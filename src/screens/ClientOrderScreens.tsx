import {
  Accordion,
  ListItem,
  SegmentedControl,
  StatusChip,
  Timeline,
} from "../components/presentation";
import {
  BottomSheet,
  ConfirmDialog,
} from "../components/overlay/OverlayPortal";

import { useState } from "react";
import { Text, View } from "react-native";
import { Page } from "../components/Page";
import {
  Badge,
  Body,
  Button,
  Card,
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
  terminalStatuses,
  type Leg,
  type Order,
} from "../domain/models";
import type { ScreenProps } from "../navigation/routes";
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";
import { contentColors } from "../design-system/classic";
import { HomeMetric, homeStyles } from "../components/HomePresentation";

import {
  DetailMeta,
  detailStyles,
} from "../components/OrderDetailPresentation";

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
      <Card style={homeStyles.hero}>
        <Text style={[ui.title, homeStyles.heroTitle]}>
          Ropa fresca, tiempo para ti.
        </Text>
        <Body muted style={homeStyles.heroBody}>
          Agenda tu servicio y sigue cada etapa de tus prendas.
        </Body>
        {charges.length === 0 && (
          <Button
            label="Nueva solicitud"
            icon="add-circle-outline"
            style={homeStyles.heroAction}
            onPress={() => navigation.navigate("ClientNewOrderWizard")}
          />
        )}
      </Card>
      {charges.length > 0 && (
        <Card style={homeStyles.charges}>
          <Icon name="alert-circle-outline" color={contentColors.warning} />
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
      <Card style={homeStyles.metrics}>
        <HomeMetric
          title="Ver billetera"
          amount={money(c.walletBalance)}
          caption="Saldo disponible"
          icon="wallet-outline"
          onPress={() => navigation.navigate("ClientWallet")}
        />
        <View style={homeStyles.metricDivider} />
        <HomeMetric
          title="Ver beneficios"
          amount={String(c.loyaltyPoints)}
          caption={"Puntos · " + c.membershipTier}
          icon="star-outline"
          color="#B45309"
          onPress={() => navigation.navigate("ClientBenefits")}
        />
      </Card>
      <Title style={homeStyles.sectionTitle}>Tu solicitud activa</Title>
      {active ? (
        <OrderCard
          order={active}
          appearance="home"
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
        style={homeStyles.allOrders}
        onPress={() => navigation.navigate("ClientOrders")}
      />
    </Page>
  );
}
export { ClientOrdersScreen } from "./orders/ClientOrdersScreen";
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
  const [legName, setLegName] = useState<"INBOUND" | "OUTBOUND">(
      order.pickupNeedsScheduling ? "INBOUND" : "OUTBOUND",
    ),
    [leg, setLeg] = useState<Leg>(() =>
      clone(
        order.pickupNeedsScheduling
          ? order.fulfillmentPlan.inbound
          : order.fulfillmentPlan.outbound,
      ),
    );
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
      {order.pickupNeedsScheduling && (
        <Body>
          Tu ingreso en sede pendiente se reemplazó por recogida a domicilio.
          Confirma dirección, fecha y horario para continuar.
        </Body>
      )}
      <SegmentedControl
        value={legName}
        options={[
          { value: "INBOUND", label: "Entrada · recogida a domicilio" },
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
      <Card style={detailStyles.hero}>
        <View style={detailStyles.heroTop}>
          <Title style={detailStyles.orderId}>{order.id}</Title>
          <StatusChip status={order.status} />
        </View>
        <Body style={detailStyles.mode}>
          {modeLabels[order.fulfillmentPlan.mode]}
        </Body>
        <Badge>{pricingLabels[order.pricingStatus]}</Badge>
        <DetailMeta icon="cash-outline">
          <Body style={detailStyles.body}>
            Pago:{" "}
            {order.paymentStatus === "PAGADO"
              ? "Pagado"
              : order.paymentStatus === "PENDIENTE_PESO"
                ? "Monto por determinar"
                : "Pendiente"}
          </Body>
        </DetailMeta>
        <DetailMeta icon="location-outline">
          <Body muted style={detailStyles.caption}>
            {order.facilityName}
          </Body>
        </DetailMeta>
      </Card>
      {a.feedback}
      {order.adjustments.map((adj) => (
        <Card key={adj.id} style={detailStyles.warning}>
          <View style={detailStyles.warningHeader}>
            <Icon name="warning-outline" size={16} color="#D97706" />
            <Title style={detailStyles.warningTitle}>
              Ajuste de planta · {money(adj.amountDifference)}
            </Title>
          </View>
          <Body style={detailStyles.warningText}>{adj.description}</Body>
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
        <Card style={detailStyles.card}>
          <Title style={detailStyles.sectionTitle}>Pesaje certificado</Title>
          <Body style={detailStyles.body}>
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
      {order.pickupNeedsScheduling && (
        <Card style={detailStyles.card}>
          <Body>
            Confirma la recogida a domicilio para continuar este pedido.
          </Body>
          <Button
            label="Programar recogida a domicilio"
            onPress={() =>
              navigation.navigate("ClientSchedule", { orderId: order.id })
            }
          />
        </Card>
      )}
      <Card style={detailStyles.accordionCard}>
        <Accordion title="Agenda, direcciones y constancias" appearance="list">
          <Title style={detailStyles.sectionTitle}>Entrada</Title>
          <Body>
            {order.legacyInbound?.status === "COMPLETED"
              ? "Recepción anterior en sede registrada"
              : "Recogida en domicilio"}
          </Body>
          <Body>{order.pickup.addressFull}</Body>
          <Body muted>
            {order.pickup.date} · {order.pickup.timeSlot}
          </Body>
          <Body muted>{order.pickup.notes}</Body>
          {order.pickup.garmentCountConfirmed !== undefined && (
            <Badge>
              {order.pickup.garmentCountConfirmed} prendas recibidas
            </Badge>
          )}
          {order.pickup.evidencePhotoUri && (
            <Body muted>Evidencia de recogida adjunta.</Body>
          )}
          <Title style={detailStyles.sectionTitle}>Salida</Title>
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
      </Card>
      <Card style={detailStyles.accordionCard}>
        <Accordion
          title={"Prendas y cuidado (" + garmentCount(order) + ")"}
          appearance="list"
        >
          {order.items.map((i) => (
            <View key={i.id} style={detailStyles.row}>
              <Body style={detailStyles.body}>
                {i.quantity} × {i.garmentType} ·{" "}
                {money(i.quantity * i.unitPrice)}
              </Body>
              <Body muted style={detailStyles.caption}>
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
      </Card>
      <Card style={detailStyles.accordionCard}>
        <Accordion title="Pago y valor" appearance="list">
          <PricingSummary
            pricing={order.pricing}
            unknown={order.pricingStatus === "PENDING_WEIGHT"}
          />
        </Accordion>
      </Card>
      {order.assignedDriverId && (
        <Card style={detailStyles.card}>
          <Title style={detailStyles.sectionTitle}>Chofer asignado</Title>
          <View style={detailStyles.driverRow}>
            <View style={detailStyles.driverIcon}>
              <Icon name="car-outline" size={22} color="#FFFFFF" />
            </View>
            <View style={detailStyles.driverInfo}>
              <Body style={detailStyles.driverName}>
                {order.assignedDriverName}
              </Body>
              <Body muted style={detailStyles.caption}>
                {order.assignedDriverVehicle} · {order.assignedDriverPlate}
              </Body>
            </View>
          </View>
          <Body muted style={detailStyles.caption}>
            Comunícate mediante el chat del pedido.
          </Body>
          <View style={detailStyles.actions}>
            {canTrack(order) && (
              <Button
                label="Seguir chofer en mapa"
                icon="location-outline"
                variant="secondary"
                style={detailStyles.action}
                textStyle={detailStyles.actionText}
                onPress={() =>
                  navigation.navigate("ClientTracking", { orderId: order.id })
                }
              />
            )}
            <Button
              label="Abrir chat con el chofer"
              icon="chatbubble-outline"
              variant="primary"
              style={detailStyles.action}
              textStyle={detailStyles.actionText}
              secondary
              onPress={() => navigation.navigate("Chat", { orderId: order.id })}
            />
          </View>
        </Card>
      )}
      <Card style={detailStyles.accordionCard}>
        <Accordion title="Historial de la solicitud" appearance="list">
          <Timeline events={order.timeline} />
        </Accordion>
      </Card>
      {order.handoffs.some((h) => h.status === "USED") && (
        <Card style={detailStyles.accordionCard}>
          <Accordion title="Transferencias realizadas" appearance="list">
            {order.handoffs
              .filter((h) => h.status === "USED")
              .map((h) => (
                <Body key={h.id}>
                  {h.title} · {h.usedAt}
                </Body>
              ))}
          </Accordion>
        </Card>
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
