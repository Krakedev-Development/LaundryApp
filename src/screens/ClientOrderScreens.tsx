import {
  Accordion,
  ListItem,
  SegmentedControl,
  SearchField,
  StatusChip,
  Timeline,
  useSearch,
} from "../components/presentation";
import {
  BottomSheet,
  ConfirmDialog,
} from "../components/overlay/OverlayPortal";
import { OrderList } from "../components/OrderList";
import { useState } from "react";
import { Text, View } from "react-native";
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
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";

export function ClientHomeScreen() {
  const navigation = useLaundryNavigation();
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
      {charges.length === 0 && (
        <Button
          label="Nueva solicitud"
          icon="add-circle-outline"
          onPress={() => navigation.navigate("ClientNewOrderWizard")}
        />
      )}
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
      <Card>
        <ListItem
          title="Ver billetera"
          subtitle={money(c.walletBalance) + " disponibles"}
          icon="wallet-outline"
          onPress={() => navigation.navigate("ClientWallet")}
        />
        <ListItem
          title="Ver beneficios"
          subtitle={c.loyaltyPoints + " puntos · " + c.membershipTier}
          icon="gift-outline"
          onPress={() => navigation.navigate("ClientBenefits")}
        />
      </Card>
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
    </Page>
  );
}
export function ClientOrdersScreen() {
  const navigation = useLaundryNavigation(),
    { state } = useApp();
  const [history, setHistory] = useState(false),
    [mode, setMode] = useState<Mode | "ALL">("ALL"),
    [search, setSearch] = useState(""),
    [filters, setFilters] = useState(false);
  const query = useSearch(search);
  const orders = visibleOrders(state).filter(
    (o) =>
      terminalStatuses.includes(o.status) === history &&
      (mode === "ALL" || o.fulfillmentPlan.mode === mode) &&
      (
        o.id +
        " " +
        modeLabels[o.fulfillmentPlan.mode] +
        " " +
        statusLabels[o.status]
      )
        .toLocaleLowerCase()
        .includes(query),
  );
  return (
    <Page scroll={false}>
      <Title>Mis solicitudes</Title>
      <SegmentedControl
        value={history ? "history" : "active"}
        onChange={(v) => setHistory(v === "history")}
        options={[
          { value: "active", label: "Activos" },
          { value: "history", label: "Historial" },
        ]}
      />
      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="Buscar solicitudes"
      />
      <Button
        label={mode === "ALL" ? "Filtrar modalidad" : modeLabels[mode]}
        icon="options-outline"
        secondary
        onPress={() => setFilters(true)}
      />
      <OrderList
        orders={orders}
        onDetail={(o) =>
          navigation.navigate("ClientOrderDetail", { orderId: o.id })
        }
        onTrack={(o) =>
          navigation.navigate("ClientTracking", { orderId: o.id })
        }
        onClear={() => {
          setSearch("");
          setMode("ALL");
        }}
      />
      <BottomSheet
        title="Filtrar modalidad"
        visible={filters}
        onClose={() => setFilters(false)}
      >
        <Choice
          label="Todas las modalidades"
          selected={mode === "ALL"}
          onPress={() => {
            setMode("ALL");
            setFilters(false);
          }}
        />
        {Object.entries(modeLabels).map(([key, label]) => (
          <Choice
            key={key}
            label={label}
            selected={mode === key}
            onPress={() => {
              setMode(key as Mode);
              setFilters(false);
            }}
          />
        ))}
      </BottomSheet>
    </Page>
  );
}
export function ClientScheduleScreen({ route }: ScreenProps<"ClientSchedule">) {
  const { state } = useApp();
  const navigation = useLaundryNavigation();
  const order = visibleOrders(state).find((o) => o.id === route.params.orderId);
  return order ? (
    <ScheduleEditor
      order={order}
      onClose={() =>
        navigation.popTo("ClientOrderDetail", { orderId: order.id })
      }
    />
  ) : (
    <Page>
      <Empty text="Solicitud no disponible." />
    </Page>
  );
}
function ScheduleEditor({ order, onClose }: { order: Order; onClose(): void }) {
  const { execute } = useApp(),
    a = useAction();
  const [legName, setLegName] = useState<"INBOUND" | "OUTBOUND">("OUTBOUND"),
    [leg, setLeg] = useState<Leg>(() => clone(order.fulfillmentPlan.outbound));
  return (
    <Page
      footer={
        <>
          <Button
            label="Guardar nueva agenda"
            disabled={!leg.addressFull || !leg.timeSlotId}
            onPress={() => {
              if (
                a.run(
                  () => execute((r) => r.changeLeg(order.id, legName, leg)),
                  "Agenda actualizada.",
                )
              )
                onClose();
            }}
          />
          <Button label="Cerrar cambios" secondary onPress={onClose} />
        </>
      }
    >
      <Badge>{order.id}</Badge>
      <SegmentedControl
        value={legName}
        options={[
          { value: "INBOUND", label: "Entrada · recogida o entrega en sede" },
          { value: "OUTBOUND", label: "Salida · entrega o retiro en sede" },
        ]}
        onChange={(value) => {
          setLegName(value);
          setLeg(
            clone(
              value === "INBOUND"
                ? order.fulfillmentPlan.inbound
                : order.fulfillmentPlan.outbound,
            ),
          );
        }}
      />
      <Body muted>
        Se requiere 60 minutos de anticipación y que el tramo no haya iniciado.
      </Body>
      <FulfillmentPicker leg={legName} value={leg} onChange={setLeg} />
      {a.feedback}
    </Page>
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
    <Accordion title="Herramientas de planta · Demo">
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
    </Accordion>
  );
}
export function ClientOrderDetailScreen({
  route,
}: ScreenProps<"ClientOrderDetail">) {
  const navigation = useLaundryNavigation();
  const { state, execute } = useApp();
  const order = visibleOrders(state).find((o) => o.id === route.params.orderId);
  const a = useAction();
  const [cancel, setCancel] = useState(false),
    [options, setOptions] = useState(false);
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
        <StatusChip status={order.status} />
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
              execute((r) => r.regenerateHandoffCode(order.id, h.id))
            }
          />
        ))}
      <Accordion title="Agenda, direcciones y constancias">
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
      </Accordion>
      <Accordion title={"Prendas y cuidado (" + garmentCount(order) + ")"}>
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
      </Accordion>
      <Accordion title="Pago y valor">
        <PricingSummary
          pricing={order.pricing}
          unknown={order.pricingStatus === "PENDING_WEIGHT"}
        />
      </Accordion>
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
      <Accordion title="Historial de la solicitud">
        <Timeline events={order.timeline} />
      </Accordion>
      {order.handoffs.some((h) => h.status === "USED") && (
        <Accordion title="Transferencias realizadas">
          {order.handoffs
            .filter((h) => h.status === "USED")
            .map((h) => (
              <Body key={h.id}>
                {h.title} · {h.usedAt}
              </Body>
            ))}
        </Accordion>
      )}
      {!closed && (
        <>
          <Button
            label="Opciones de solicitud"
            icon="ellipsis-horizontal"
            secondary
            onPress={() => setOptions(true)}
          />
          <BottomSheet
            title="Opciones de solicitud"
            visible={options}
            onClose={() => setOptions(false)}
          >
            <ListItem
              title="Cambiar modalidad o reprogramar"
              icon="calendar-outline"
              onPress={() => {
                setOptions(false);
                navigation.navigate("ClientSchedule", { orderId: order.id });
              }}
            />
            <ListItem
              title="Cancelar solicitud"
              icon="close-circle-outline"
              onPress={() => {
                setOptions(false);
                setCancel(true);
              }}
            />
          </BottomSheet>
          <DemoPlantActions order={order} />
        </>
      )}
      <ConfirmDialog
        title={"Cancelar " + order.id}
        visible={cancel}
        onClose={() => setCancel(false)}
        footer={
          <>
            <Button
              label="Confirmar cancelación"
              variant="danger"
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
          </>
        }
      >
        <Body>
          {isLateCancellation(order)
            ? "La recogida inició o faltan menos de 60 minutos. Se generará un cargo de $5.00, que bloqueará nuevas solicitudes hasta regularizarlo."
            : "Cancelación sin cargo. Se liberarán tus franjas y códigos. Los reembolsos se revisan con operaciones."}
        </Body>
      </ConfirmDialog>
    </Page>
  );
}
