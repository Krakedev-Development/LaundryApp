import * as Crypto from "expo-crypto";
import demo from "../domain/demo.json";
import {
  BusinessService,
  recordBusinessCustody,
} from "../services/domain/BusinessService";
import { HandoffService } from "../services/domain/HandoffService";
import type { Actor, HandoffType } from "../services/domain/fulfillment";
import type { Order } from "../domain/models";
import type { AppBusinessState } from "../store/useBusinessStore";

// Prepared phases let independent mobile demos show customer and driver actions.
// This fixture builder creates no staff account or runtime administrative controls.
export function prepareMobileDemo(state: AppBusinessState) {
  const facility = state.facilities.find((f) => f.id === "FAC-02");
  const driver = state.drivers.find((d) => d.id === "DRV-105");
  if (!facility || !driver) return;
  let actor: Actor = {
    id: "DEMO-PREPARED-WEB",
    name: "Operaciones web · ejemplo preparado",
    role: "ADMIN",
    facilityId: facility.id,
  };
  const handoffs = new HandoffService({
    read: () => state,
    transaction: (work) => work(state),
    actor: (id) => {
      if (id !== actor.id) throw Error("Actor no válido");
      return actor;
    },
    random: () =>
      Array.from(Crypto.getRandomBytes(20), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join(""),
    paid: (o) => (o as Order).pricing.paymentStatus === "PAID",
    intakeAllowed: (o) => (o as Order).pricing.pricingModel === "PER_WEIGHT",
    declaredCount: (o) => (o as Order).itemCount,
    confirmed: recordBusinessCustody,
  });
  const service = new BusinessService({
    read: () => state,
    transaction: (work) => work(state),
    actor: () => actor,
    facilities: () => state.facilities,
    catalog: () => state.catalog,
    promotions: () => state.promotions,
    covers: () => true,
    handoffs,
  });
  const staff = () => {
    actor = {
      id: "DEMO-PREPARED-WEB",
      name: "Operaciones web · ejemplo preparado",
      role: "ADMIN",
      facilityId: facility.id,
    };
  };
  const transfer = (id: string, type: HandoffType) => {
    const code = state.handoffs.find(
      (h) => h.orderId === id && h.type === type && h.status === "ACTIVE",
    )!;
    const checked = handoffs.verify(code.fallbackCode, actor.id, code.id);
    handoffs.confirm(actor.id, {
      ticket: checked.ticket,
      count: state.orders.find((o) => o.id === id)!.itemCount,
    });
  };
  for (const [id, source] of [
    ["APP-DEMO-PICKUP", "SOL-HH-001"],
    ["APP-DEMO-DELIVERY", "SOL-SH-001"],
    ["APP-DEMO-ADJUSTMENT", "SOL-WEIGHT-001"],
  ]) {
    if (state.orders.some((o) => o.id === id)) continue;
    const template = demo.workflow.orders.find((o) => o.id === source) as
      AppBusinessState["orders"][number] | undefined;
    if (!template) continue;
    const before = JSON.parse(JSON.stringify(state)) as AppBusinessState;
    try {
      const order = JSON.parse(JSON.stringify(template)) as typeof template;
      Object.assign(order, {
        id,
        trackingNumber: id,
        status: "AWAITING_INTAKE",
        timeline: [],
        intakeHold: undefined,
        incidentsCount: 0,
        inspectionCompleted: false,
        customerMessage:
          "Ejemplo preparado para demostrar acciones móviles. Operaciones se administra en LaundryWeb.",
      });
      order.pickup.driverId = undefined;
      order.delivery.driverId = undefined;
      for (const leg of ["inbound", "outbound"] as const) {
        const f = order.fulfillment![leg];
        f.handoffIds = [];
        f.driverId = undefined;
        f.driverAssignmentId = undefined;
        f.milestone = "PENDING";
        f.status = "SCHEDULED";
        if (f.timeSlotId) {
          const slot = state.timeSlots.find((s) => s.id === f.timeSlotId);
          if (!slot || slot.reservedCount >= slot.capacity) throw Error("El horario del ejemplo ya no tiene capacidad.");
          slot.reservedCount++;
          state.reservations.push({
            id: "RSV-" + id + "-" + leg,
            orderId: id,
            leg,
            slotId: f.timeSlotId,
            active: true,
          });
        }
      }
      state.orders.unshift(order);
      handoffs.initialize(state, order);
      staff();
      if (id === "APP-DEMO-PICKUP") service.assign(id, driver.id, "inbound");
      else {
        transfer(id, "CUSTOMER_TO_FACILITY");
        if (id === "APP-DEMO-ADJUSTMENT") {
          service.weigh(id, 22.5, "LB");
          service.inspect(id, "Inspección de ejemplo completada.");
          service.proposeAdjustment(
            id,
            5,
            "Tratamiento adicional del ejemplo",
            "Acepta o rechaza el tratamiento adicional para continuar con el pago.",
          );
        } else {
          service.inspect(id, "Inspección de ejemplo completada.");
          service.process(id, "IN_PROCESS");
          service.process(id, "QUALITY_CONTROL");
          service.process(id, "READY");
          service.assign(id, driver.id, "outbound");
          transfer(id, "FACILITY_TO_DRIVER");
        }
      }
    } catch {
      // Existing policy, capacity or driver availability can forbid an optional example.
      // Keep all saved business data unchanged instead of preventing startup.
      Object.assign(state, before);
    }
  }
}
