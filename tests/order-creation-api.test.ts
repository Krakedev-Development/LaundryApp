import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  initializeState,
  LaundryRepository,
  visibleOrders,
} from "../src/domain/repository";
import { fetchGarments, fetchServices } from "../src/services/catalog/catalogService";
import {
  orderService,
  formatOrderCode,
} from "../src/services/orders/orderService";
import { slotService } from "../src/services/slots/slotService";

test("slotService and orderService create and list real orders on backend with Guayaquil address", async () => {
  const uniqueEmail = `cliente.orders.${Date.now()}@laundryguayaquil.com`;
  const repo = new LaundryRepository(initializeState());

  // 1. Register and login client
  const registeredUser = await repo.registerWithApi(
    "Carlos Guayaquil",
    uniqueEmail,
    "0998765432",
    "Password123!",
  );
  assert.equal(registeredUser.email, uniqueEmail);

  // 2. Query slots for DRIVER_PICKUP
  const slots = await slotService.fetchSlots({ context: "DRIVER_PICKUP" });
  assert.ok(slots.length > 0, "Should return slots from backend");
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const futureSlot = slots.find((s) => s.date >= tomorrow && s.available > 0) ?? slots[0];
  assert.ok(futureSlot, "Should have a future slot available");

  // 3. Ensure Guayaquil address
  const address = await orderService.ensureGuayaquilAddress();
  assert.ok(address.id, "Address should be created with ID");
  assert.equal(Number(address.latitude), -2.1894);
  assert.equal(Number(address.longitude), -79.8891);

  // 4. Fetch real garments & services for order items
  const [garments, services] = await Promise.all([
    fetchGarments(),
    fetchServices(),
  ]);
  assert.ok(garments.length > 0);
  assert.ok(services.length > 0);

  // 5. Create order with mode HOME_HOME, paymentMethodKind WALLET
  const orderDto = {
    facilityId: futureSlot.facilityId,
    mode: "HOME_HOME" as const,
    pickupAddressId: address.id,
    pickupSlotId: futureSlot.id,
    items: [
      {
        garmentId: garments[0].id,
        serviceId: services[0].id,
        quantity: 2,
      },
    ],
    paymentMethodKind: "WALLET" as const,
  };

  const createdOrder = await orderService.createOrder(orderDto);
  assert.ok(createdOrder.id, "Order should have UUID");
  const code = formatOrderCode(createdOrder);
  assert.match(code, /^ORD-\d{4}$/, "Order code should match ORD-XXXX format");

  // 6. Register order into repository and verify visibleOrders
  const mapped = repo.registerApiOrder(createdOrder, {
    items: [
      {
        id: garments[0].id,
        garmentType: garments[0].name,
        quantity: 2,
        serviceType: services[0].name,
        unitPrice: 5.0,
        notes: "",
        iconName: "shirt-outline",
      },
    ],
  });
  assert.equal(mapped.id, code);
  assert.ok(["PAYMENT_PENDING", "CONFIRMED"].includes(mapped.status));

  const orders = visibleOrders(repo.state);
  assert.ok(orders.some((o) => o.id === code));

  // 7. List orders from backend
  const list = await orderService.listOrders();
  assert.ok(list.length > 0, "listOrders should return customer orders");
  assert.ok(
    list.some((o) => o.id === createdOrder.id),
    "List should contain newly created order",
  );

  // 8. Get order details from backend
  const detailed = await orderService.getOrder(createdOrder.id);
  assert.equal(detailed.id, createdOrder.id);
  assert.equal(detailed.mode, "HOME_HOME");
});
