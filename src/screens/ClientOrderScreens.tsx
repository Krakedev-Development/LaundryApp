import { useState } from "react";
import { Modal, Text, View } from "react-native";
import { Page } from "../components/Page";
import {
  Badge,
  Body,
  Button,
  Card,
  Choice,
  Empty,
  Field,
  Icon,
  Title,
  ui,
  useAction,
} from "../components/ui";
import { OrderCard } from "../components/OrderCard";
import { HandoffCard } from "../components/HandoffCard";
import { FulfillmentPicker } from "../components/FulfillmentPicker";
import { PricingSummary } from "./NewOrderScreen";
import { useApp } from "../store/AppProvider";
import {
  clone,
  currentCustomer,
  isLateCancellation,
  visibleOrders,
} from "../domain/repository";
import {
  canTrack,
  garmentCount,
  modeLabels,
  money,
  pricingLabels,
  statusLabels,
  terminalStatuses,
  type Leg,
  type Mode,
  type Order,
} from "../domain/models";
import type { ScreenProps } from "../navigation/routes";

export function ClientHomeScreen({ navigation }: ScreenProps<"ClientHome">) {
  const { state } = useApp();
  const c = currentCustomer(state);
  const orders = visibleOrders(state);
  const active = orders.find((o) => !terminalStatuses.includes(o.status));
  const charges = state.customerCharges.filter(
    (ch) => ch.customerId === c.id && ch.status === "PENDING",
  );
  return (
    <Page>
      <Text style={ui.title}>Ropa fresca, tiempo para ti.</Text>
      <Body muted>Agenda tu servicio y sigue cada etapa de tus prendas.</Body>
      <Button
        label="Nueva solicitud"
        icon="add-circle-outline"
        onPress={() => navigation.navigate("ClientNewOrderWizard")}
      />
      {charges.length > 0 && (
        <Card>
          <Icon name="alert-circle-outline" />
          <Title>Tienes cargos pendientes</Title>
          <Body>
            Regulariza {money(charges.reduce((sum, ch) => sum + ch.amount, 0))}{" "}
            para crear nuevas solicitudes.
          </Body>
          <Button
            label="Regularizar en billetera"
            onPress={() => navigation.navigate("ClientWallet")}
          />
        </Card>
      )}
      <View style={ui.row}>
        <View style={{ flex: 1 }}>
          <Card>
            <Icon name="wallet-outline" />
            <Title>{money(c.walletBalance)}</Title>
            <Body muted>Billetera Laundry</Body>
            <Button
              label="Ver billetera"
              secondary
              onPress={() => navigation.navigate("ClientWallet")}
            />
          </Card>
        </View>
        <View style={{ flex: 1 }}>
          <Card>
            <Icon name="gift-outline" />
            <Title>{c.loyaltyPoints} puntos</Title>
            <Body muted>Beneficios Laundry</Body>
            <Button
              label="Ver beneficios"
              secondary
              onPress={() => navigation.navigate("ClientBenefits")}
            />
          </Card>
        </View>
      </View>
      <Title>Tu solicitud activa</Title>
      {active ? (
        <OrderCard
          order={active}
          onDetail={() =>
            navigation.navigate("ClientOrderDetail", { orderId: active.id })
          }
          onTrack={() =>
            navigation.navigate("ClientTracking", { orderId: active.id })
          }
        />
      ) : (
        <Empty text="No tienes solicitudes activas. Agenda tu próximo servicio." />
      )}
      <Button
        label="Ver todas mis solicitudes"
        secondary
        onPress={() => navigation.navigate("ClientOrders")}
      />
      <Card>
        <Title>Cuidado a tu medida</Title>
        <Body>
          Lavado por prenda o por peso. Elige recogida y entrega a domicilio, o
          visita una de nuestras sedes.
        </Body>
      </Card>
    </Page>
  );
}
export function ClientOrdersScreen({
  navigation,
}: ScreenProps<"ClientOrders">) {
  const { state } = useApp();
  const [history, setHistory] = useState(false),
    [mode, setMode] = useState<Mode | "ALL">("ALL");
  const orders = visibleOrders(state).filter(
    (o) =>
      terminalStatuses.includes(o.status) === history &&
      (mode === "ALL" || o.fulfillmentPlan.mode === mode),
  );
  return (
    <Page>
      <View style={ui.row}>
        <Choice
          label="Activos"
          selected={!history}
          onPress={() => setHistory(false)}
        />
        <Choice
          label="Historial"
          selected={history}
          onPress={() => setHistory(true)}
        />
      </View>
      <Card>
        <Title>Filtrar modalidad</Title>
        <Choice
          label="Todas las modalidades"
          selected={mode === "ALL"}
          onPress={() => setMode("ALL")}
        />
        {Object.entries(modeLabels).map(([key, label]) => (
          <Choice
            key={key}
            label={label}
            selected={mode === key}
            onPress={() => setMode(key as Mode)}
          />
        ))}
      </Card>
      {orders.length ? (
        orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            onDetail={() =>
              navigation.navigate("ClientOrderDetail", { orderId: o.id })
            }
            onTrack={() =>
              navigation.navigate("ClientTracking", { orderId: o.id })
            }
          />
        ))
      ) : (
        <Empty text="No hay solicitudes para este filtro." />
      )}
      <Button
        label="Nueva solicitud"
        icon="add-circle-outline"
        onPress={() => navigation.navigate("ClientNewOrderWizard")}
      />
    </Page>
  );
}
function ScheduleEditor({ order, onClose }: { order: Order; onClose(): void }) {
  const { execute } = useApp();
  const a = useAction();
  const [legName, setLegName] = useState<"INBOUND" | "OUTBOUND">("OUTBOUND");
  const [leg, setLeg] = useState<Leg>(() =>
    clone(order.fulfillmentPlan.outbound),
  );
  return (
    <Card>
      <Title>Cambiar modalidad o reprogramar</Title>
      <Choice
        label="Entrada · recogida o entrega en sede"
        selected={legName === "INBOUND"}
        onPress={() => {
          setLegName("INBOUND");
          setLeg(clone(order.fulfillmentPlan.inbound));
        }}
      />
      <Choice
        label="Salida · entrega o retiro en sede"
        selected={legName === "OUTBOUND"}
        onPress={() => {
          setLegName("OUTBOUND");
          setLeg(clone(order.fulfillmentPlan.outbound));
        }}
      />
      <Body muted>
        Se requiere 60 minutos de anticipación y que el tramo no haya iniciado.
      </Body>
      <FulfillmentPicker leg={legName} value={leg} onChange={setLeg} />
      {a.feedback}
      <Button
        label="Guardar nueva agenda"
        onPress={() => {
          if (a.run(() => execute((r) => r.changeLeg(order.id, legName, leg))))
            onClose();
        }}
      />
      <Button label="Cerrar cambios" secondary onPress={onClose} />
    </Card>
  );
}
export function DemoPlantActions({ order }: { order: Order }) {
  const { execute } = useApp();
  const a = useAction();
  const [weight, setWeight] = useState("15");
  const labels: Partial<Record<Order["status"], string>> = {
    AWAITING_INTAKE: "Simular recepción en sede",
    AT_FACILITY:
      order.pricingModel === "PER_WEIGHT"
        ? "Simular inicio de pesaje"
        : "Simular ingreso a lavado",
    WEIGHING: "Registrar peso certificado",
    IN_PROCESS: "Simular control de calidad",
    QUALITY_CONTROL: "Simular prendas listas",
    READY_FOR_DELIVERY: "Simular asignación de entrega",
    READY_FOR_PICKUP: "Simular retiro en sede",
  };
  if (
    !labels[order.status] ||
    (order.status === "WEIGHING" && order.pricingStatus === "CALCULATED")
  )
    return null;
  return (
    <Card>
      <Badge>Simulación del prototipo</Badge>
      <Body muted>
        Avanza la operación de planta local para recorrer el flujo completo.
      </Body>
      {order.status === "WEIGHING" && (
        <Field
          label="Peso certificado en libras"
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
      )}
      {a.feedback}
      <Button
        label={`${labels[order.status]} · Demo`}
        secondary
        onPress={() =>
          a.run(() =>
            execute((r) => r.advancePlantOperation(order.id, Number(weight))),
          )
        }
      />
    </Card>
  );
}
export function ClientOrderDetailScreen({
  navigation,
  route,
}: ScreenProps<"ClientOrderDetail">) {
  const { state, execute } = useApp();
  const order = visibleOrders(state).find((o) => o.id === route.params.orderId);
  const a = useAction();
  const [editing, setEditing] = useState(false),
    [cancel, setCancel] = useState(false);
  if (!order)
    return (
      <Page>
        <Empty text="Esta solicitud no existe o no pertenece a tu cuenta." />
      </Page>
    );
  const closed = terminalStatuses.includes(order.status);
  return (
    <Page>
      <Card>
        <Title>{order.id}</Title>
        <Badge>{statusLabels[order.status]}</Badge>
        <Body>{modeLabels[order.fulfillmentPlan.mode]}</Body>
        <Badge>{pricingLabels[order.pricingStatus]}</Badge>
        <Body>
          Pago:{" "}
          {order.paymentStatus === "PAGADO"
            ? "Pagado"
            : order.paymentStatus === "PENDIENTE_PESO"
              ? "Monto por determinar"
              : "Pendiente"}
        </Body>
        <Body muted>{order.facilityName}</Body>
      </Card>
      {a.feedback}
      {order.adjustments.map((adj) => (
        <Card key={adj.id}>
          <Title>Ajuste de planta · {money(adj.amountDifference)}</Title>
          <Body>{adj.description}</Body>
          <Badge>
            {adj.status === "PENDING_CUSTOMER"
              ? "Requiere tu aprobación"
              : adj.status === "APPROVED"
                ? "Aprobado"
                : "Rechazado"}
          </Badge>
          {adj.status === "PENDING_CUSTOMER" && !closed && (
            <>
              <Button
                label="Aprobar ajuste"
                onPress={() =>
                  a.run(
                    () => execute((r) => r.approveAdjustment(order.id, adj.id)),
                    "Ajuste aprobado. Continúa el lavado.",
                  )
                }
              />
              <Button
                label="Rechazar ajuste"
                secondary
                onPress={() =>
                  a.run(
                    () =>
                      execute((r) =>
                        r.approveAdjustment(order.id, adj.id, false),
                      ),
                    "Continúa el tratamiento original.",
                  )
                }
              />
            </>
          )}
        </Card>
      ))}
      {order.pricingModel === "PER_WEIGHT" && (
        <Card>
          <Title>Pesaje certificado</Title>
          <Body>
            {order.weightLb
              ? `${order.weightLb} lb · ${order.weightKg} kg · ${money(order.pricePerLb)} / lb`
              : `Pendiente en planta · estimado ${order.estimatedWeightLb ?? "—"} lb`}
          </Body>
          {order.pricingStatus === "CALCULATED" && !closed && (
            <>
              <Body>
                Confirma el valor final de {money(order.pricing.total)} para
                iniciar el lavado.
              </Body>
              <Button
                label="Confirmar peso y pagar con billetera"
                onPress={() =>
                  a.run(
                    () => execute((r) => r.confirmWeightAndPay(order.id)),
                    "Pago por peso confirmado.",
                  )
                }
              />
              <Button
                label="Confirmar peso y pagar con tarjeta · Demo"
                secondary
                onPress={() =>
                  a.run(
                    () =>
                      execute((r) =>
                        r.confirmWeightAndPay(order.id, "Tarjeta"),
                      ),
                    "Pago por peso confirmado.",
                  )
                }
              />
            </>
          )}
        </Card>
      )}
      {order.handoffs
        .filter((h) => h.status === "ACTIVE" || h.status === "PENDING")
        .map((h) => (
          <HandoffCard
            key={h.id}
            handoff={h}
            onRegenerate={() =>
              a.run(
                () => execute((r) => r.regenerateHandoffCode(order.id, h.id)),
                "Código actualizado.",
              )
            }
          />
        ))}
      <Card>
        <Title>Entrada</Title>
        <Body>
          {order.fulfillmentPlan.inbound.method === "DRIVER"
            ? "Recogida en domicilio"
            : "Entrega en sede"}
        </Body>
        <Body>{order.pickup.addressFull}</Body>
        <Body muted>
          {order.pickup.date} · {order.pickup.timeSlot}
        </Body>
        <Body muted>{order.pickup.notes}</Body>
        {order.pickup.garmentCountConfirmed !== undefined && (
          <Badge>{order.pickup.garmentCountConfirmed} prendas recibidas</Badge>
        )}
        {order.pickup.evidencePhotoUri && (
          <Body muted>Evidencia de recogida adjunta.</Body>
        )}
        <Title>Salida</Title>
        <Body>
          {order.fulfillmentPlan.outbound.method === "DRIVER"
            ? "Entrega en domicilio"
            : "Retiro en sede"}
        </Body>
        <Body>{order.delivery.addressFull}</Body>
        <Body muted>
          {order.delivery.date} · {order.delivery.timeSlot}
        </Body>
        {order.delivery.recipientName && (
          <Body>
            Recibido por {order.delivery.recipientName} ·{" "}
            {order.delivery.recipientRelationship}
          </Body>
        )}
        {order.delivery.deliveryNotes && (
          <Body muted>{order.delivery.deliveryNotes}</Body>
        )}
        {order.delivery.evidencePhotoUri && (
          <Body muted>Evidencia de entrega adjunta.</Body>
        )}
      </Card>
      <Card>
        <Title>Prendas y cuidado ({garmentCount(order)})</Title>
        {order.items.map((i) => (
          <View key={i.id}>
            <Body>
              {i.quantity} × {i.garmentType} · {money(i.quantity * i.unitPrice)}
            </Body>
            <Body muted>
              {i.serviceType}
              {i.notes ? ` · ${i.notes}` : ""}
            </Body>
          </View>
        ))}
        {!order.items.length && <Body>Servicio por peso.</Body>}
        {order.extras.map((e) => (
          <Body key={e.id}>
            {e.name} · {money(e.price)}
          </Body>
        ))}
      </Card>
      <PricingSummary
        pricing={order.pricing}
        unknown={order.pricingStatus === "PENDING_WEIGHT"}
      />
      {order.assignedDriverId && (
        <Card>
          <Icon name="car-outline" />
          <Title>Chofer asignado</Title>
          <Body>{order.assignedDriverName}</Body>
          <Body muted>
            {order.assignedDriverVehicle} · {order.assignedDriverPlate}
          </Body>
          <Body muted>Comunícate mediante el chat del pedido.</Body>
          {canTrack(order) && (
            <Button
              label="Seguir chofer en mapa"
              onPress={() =>
                navigation.navigate("ClientTracking", { orderId: order.id })
              }
            />
          )}
          <Button
            label="Abrir chat con el chofer"
            secondary
            onPress={() => navigation.navigate("Chat", { orderId: order.id })}
          />
        </Card>
      )}
      <Card>
        <Title>Historial de la solicitud</Title>
        {order.timeline.map((event, i) => (
          <View
            key={`${event.status}-${i}`}
            style={[ui.row, { alignItems: "flex-start", flexWrap: "nowrap" }]}
          >
            <Icon
              name={
                event.completed ? "checkmark-circle-outline" : "ellipse-outline"
              }
              size={20}
            />
            <View style={{ flex: 1 }}>
              <Body>{event.title}</Body>
              {event.description && <Body muted>{event.description}</Body>}
              <Body muted>{event.timestamp}</Body>
            </View>
          </View>
        ))}
      </Card>
      {order.handoffs.some((h) => h.status === "USED") && (
        <Card>
          <Title>Transferencias realizadas</Title>
          {order.handoffs
            .filter((h) => h.status === "USED")
            .map((h) => (
              <Body key={h.id}>
                {h.title} · {h.usedAt}
              </Body>
            ))}
        </Card>
      )}
      {!closed && (
        <>
          <Button
            label="Cambiar modalidad o reprogramar"
            secondary
            onPress={() => setEditing(!editing)}
          />
          {editing && (
            <ScheduleEditor
              key={order.id}
              order={order}
              onClose={() => setEditing(false)}
            />
          )}
          <Button
            label="Cancelar solicitud"
            secondary
            onPress={() => setCancel(true)}
          />
          <DemoPlantActions order={order} />
        </>
      )}
      <Modal
        visible={cancel}
        transparent
        animationType="fade"
        onRequestClose={() => setCancel(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 24,
            backgroundColor: "#0F172A66",
          }}
        >
          <Card>
            <Title>Cancelar {order.id}</Title>
            <Body>
              {isLateCancellation(order)
                ? "La recogida inició o faltan menos de 60 minutos. Se generará un cargo de $5.00, que bloqueará nuevas solicitudes hasta regularizarlo."
                : "Cancelación sin cargo. Se liberarán tus franjas y códigos. Los reembolsos se revisan con operaciones."}
            </Body>
            <Button
              label="Confirmar cancelación"
              onPress={() => {
                setCancel(false);
                a.run(
                  () => execute((r) => r.cancelOrder(order.id)),
                  "Solicitud cancelada.",
                );
              }}
            />
            <Button
              label="Conservar solicitud"
              secondary
              onPress={() => setCancel(false)}
            />
          </Card>
        </View>
      </Modal>
    </Page>
  );
}
