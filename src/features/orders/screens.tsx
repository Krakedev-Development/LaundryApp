import { HandoffCode, FacilityInfo } from "../handoffs/components";
import { operationalStage } from "../../domain/fulfillment";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AppHeader,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  Page,
  ui,
} from "../../components/ui";
import { useApp } from "../../store/AppStore";
import {
  dateLabel,
  formatMoney,
  isFinished,
  pointsBalance,
  walletBalance,
} from "../../domain/rules";
import { ORDER_STATUS_LABELS } from "../../domain/models";
import { ClientOrderActions, OrderCard, Timeline } from "./components";
import { Colors as C } from "../../theme/colors";

export function ClientHomeScreen() {
  const { session, data, engine } = useApp();
  const router = useRouter();
  const c = engine.customer(session!);
  const orders = engine.ordersFor(session!);
  const active = orders.find((o) => !isFinished(operationalStage(o)));
  const plan = data.plans.find((p) => p.id === c.membershipId);
  const unread = data.notifications.filter(
    (n) => n.userId === c.id && !n.read,
  ).length;
  return (
    <Page>
      <AppHeader
        title={`Hola, ${c.name.split(" ")[0]}`}
        subtitle="Laundry Clean & Fresh"
        right={
          <IconButton
            name="notifications-outline"
            label={`Notificaciones, ${unread} sin leer`}
            onPress={() => router.push("/(client)/notifications")}
          />
        }
      />
      {active ? (
        <>
          <Text style={ui.section}>Tu pedido</Text>
          <OrderCard order={active} />
        </>
      ) : (
        <View style={ui.heroCard}>
          <Badge title="Tu tiempo vale más" />
          <Text style={[ui.hero, { color: C.surface }]}>
            Tu ropa limpia sin salir de casa.
          </Text>
          <Text style={{ color: C.surface, lineHeight: 22 }}>
            Agenda una recogida y nosotros nos encargamos del resto.
          </Text>
        </View>
      )}
      <Button
        title="Solicitar recogida"
        icon="add-circle-outline"
        variant="lime"
        onPress={() => router.push("/(client)/new-order/garments")}
      />
      <View style={[ui.row, { alignItems: "stretch" }]}>
        <Card style={{ flex: 1 }}>
          <Text style={ui.meta}>Billetera</Text>
          <Text style={[ui.title, { color: C.primary }]}>
            {formatMoney(walletBalance(data, c.id))}
          </Text>
          <Button
            title="Ver saldo"
            variant="secondary"
            onPress={() => router.push("/(client)/wallet")}
          />
        </Card>
        <Card style={{ flex: 1 }}>
          <Text style={ui.meta}>Puntos Fresh</Text>
          <Text style={[ui.title, { color: C.purple }]}>
            {pointsBalance(data, c.id).toLocaleString()}
          </Text>
          <Button
            title="Ver puntos"
            variant="secondary"
            onPress={() => router.push("/(client)/rewards")}
          />
        </Card>
      </View>
      <Card style={{ backgroundColor: C.limeSoft }}>
        <Text style={ui.section}>Beneficios que se sienten</Text>
        <Text style={ui.muted}>
          {data.promotions.find((p) => p.status === "ACTIVE")?.description}
        </Text>
        <Button
          title="Explorar promociones"
          variant="secondary"
          onPress={() => router.push("/(client)/promotions")}
        />
      </Card>
      <Card>
        <Badge
          title={plan ? `Plan ${plan.name}` : "Elige tu membresía"}
          tone="purple"
        />
        <Text style={ui.body}>
          {plan
            ? plan.benefits.join(" · ")
            : "Más frescura, más beneficios en cada pedido."}
        </Text>
        <Button
          title="Ver membresía"
          variant="secondary"
          onPress={() => router.push("/(client)/membership")}
        />
      </Card>
    </Page>
  );
}
export function OrdersScreen() {
  const { session, engine } = useApp();
  const [history, setHistory] = useState(false);
  const [filter, setFilter] = useState("Todos");
  const router = useRouter();
  const cut =
    filter === "Últimos 30 días"
      ? Date.now() - 30 * 86400000
      : filter === "Año"
        ? new Date(new Date().getFullYear(), 0, 1).getTime()
        : 0;
  const orders = engine
    .ordersFor(session!)
    .filter(
      (o) =>
        isFinished(operationalStage(o)) === history &&
        new Date(o.createdAt).getTime() >= cut,
    );
  return (
    <Page>
      <AppHeader
        title="Tus pedidos"
        subtitle="El cuidado de tu ropa, paso a paso"
        icon="receipt-outline"
      />
      <View style={ui.wrap}>
        <Chip
          title="Activos"
          selected={!history}
          onPress={() => setHistory(false)}
        />
        <Chip
          title="Historial"
          selected={history}
          onPress={() => setHistory(true)}
        />
      </View>
      {!!history && (
        <View style={ui.wrap}>
          {["Todos", "Últimos 30 días", "Año"].map((f) => (
            <Chip
              key={f}
              title={f}
              selected={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </View>
      )}
      {orders.map((o) => (
        <OrderCard key={o.id} order={o} />
      ))}
      {!orders.length && (
        <EmptyState
          title="Aún no tienes pedidos"
          text="Agenda tu primera recogida."
          action={
            <Button
              title="Solicitar recogida"
              onPress={() => router.push("/(client)/new-order/garments")}
            />
          }
        />
      )}
    </Page>
  );
}
export function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, engine, data } = useApp();
  const router = useRouter();
  let order;
  try {
    order = engine.order(session!, id);
  } catch {
    return (
      <Page>
        <ErrorState
          text="No encontramos este pedido en tu cuenta."
          retry={() => router.replace("/(client)/(tabs)/orders")}
        />
      </Page>
    );
  }
  const o = order;
  const a = data.assignments.find((a) => a.id === o.pickup.driverAssignmentId);
  const d = data.assignments.find(
    (a) => a.id === o.delivery.driverAssignmentId,
  );
  return (
    <Page>
      <AppHeader title={o.id} subtitle="Tu solicitud" icon="receipt-outline" />
      <View style={ui.heroCard}>
        <Text style={[ui.title, { color: C.surface }]}>
          {
            ORDER_STATUS_LABELS[
              o.fulfillment?.mode === "STORE_STORE"
                ? o.status
                : operationalStage(o)
            ]
          }
        </Text>
        <Text style={{ color: C.surface }}>
          Entrega estimada: {dateLabel(o.delivery.date)} · {o.delivery.timeSlot}
        </Text>
      </View>
      <ClientOrderActions order={o} />
      <HandoffCode order={o} />
      {o.fulfillment?.mode === "STORE_STORE" && <FacilityInfo order={o} />}
      <Button
        title="Operaciones de sede · demo"
        variant="secondary"
        onPress={() => router.push("/(client)/demo-operations")}
      />
      <Timeline order={o} />
      {[
        {
          title:
            o.fulfillment?.mode === "STORE_STORE"
              ? "Ingreso en sede"
              : "Recogida",
          schedule: o.pickup,
          driver: a?.driverId,
        },
        {
          title:
            o.fulfillment?.mode === "STORE_STORE"
              ? "Retiro cuando esté listo"
              : "Entrega",
          schedule: o.delivery,
          driver: d?.driverId,
        },
      ].map((row) => (
        <Card key={row.title}>
          <Text style={ui.section}>{row.title}</Text>
          <Text style={ui.body}>
            {dateLabel(row.schedule.date)} · {row.schedule.timeSlot}
          </Text>
          <Text style={ui.muted}>{row.schedule.address.fullAddress}</Text>
          <Text style={ui.meta}>{row.schedule.notes}</Text>
          {!!row.driver && (
            <Text style={ui.body}>
              Chofer: {data.drivers.find((v) => v.id === row.driver)?.name}
            </Text>
          )}
        </Card>
      ))}
      <Card>
        <Text style={ui.section}>Lo que cuidamos por ti</Text>
        {o.items.map((i) => (
          <View key={i.id} style={ui.between}>
            <View style={{ flex: 1 }}>
              <Text style={ui.body}>
                {i.quantity} × {i.name}
              </Text>
              <Text style={ui.meta}>
                {i.serviceName}
                {i.notes ? ` · ${i.notes}` : ""}
              </Text>
            </View>
            <Text style={ui.body}>{formatMoney(i.quantity * i.unitPrice)}</Text>
          </View>
        ))}
        {o.extras.map((e) => (
          <Text key={e.id} style={ui.muted}>
            {e.name} · {formatMoney(e.price)}
          </Text>
        ))}
        <View style={ui.divider} />
        {[
          ["Subtotal", o.pricing.itemsSubtotal],
          ["Extras", o.pricing.extrasTotal],
          ["Promoción", -o.pricing.discount],
          ["Membresía", -o.pricing.membershipBenefitDiscount],
          ["Recompensa", -(o.pricing.rewardDiscount ?? 0)],
          ["Entrega", o.pricing.deliveryFee],
          ["Total", o.pricing.total],
        ].map(([label, value]) => (
          <View key={label} style={ui.between}>
            <Text style={ui.body}>{label}</Text>
            <Text style={ui.body}>{formatMoney(Number(value))}</Text>
          </View>
        ))}
        <Text style={ui.meta}>
          Pago: {o.payment.method} ·{" "}
          {o.payment.status === "PAID" ? "Pagado" : "Pendiente"}
        </Text>
      </Card>
      {!!o.delivery.recipient && (
        <Card>
          <Badge title="Entrega registrada" tone="success" />
          <Text style={ui.body}>
            Recibió: {o.delivery.recipient.name} ·{" "}
            {o.delivery.recipient.relationship}
          </Text>
          <Text style={ui.muted}>
            {o.delivery.completedAt &&
              new Date(o.delivery.completedAt).toLocaleString("es")}
          </Text>
        </Card>
      )}
      {o.incidents.map((i) => (
        <Card key={i.id}>
          <Badge title="Incidencia" tone="warning" />
          <Text style={ui.body}>{i.description}</Text>
        </Card>
      ))}
      <Button
        title="Ayuda con este pedido"
        variant="secondary"
        onPress={() => router.push("/(client)/support")}
      />
    </Page>
  );
}
export function OrderSuccessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, engine } = useApp();
  const router = useRouter();
  let order;
  try {
    order = engine.order(session!, id);
  } catch {
    return (
      <Page>
        <ErrorState text="No encontramos tu solicitud." />
      </Page>
    );
  }
  return (
    <Page>
      <EmptyState
        title="¡Solicitud confirmada!"
        text={order.id}
        icon="checkmark-circle-outline"
      />
      <Card>
        <Text style={ui.section}>Tu recogida</Text>
        <Text style={ui.body}>
          {dateLabel(order.pickup.date)} · {order.pickup.timeSlot}
        </Text>
        <Text style={ui.muted}>{order.pickup.address.fullAddress}</Text>
        <Text style={ui.body}>
          Te avisaremos cuando un chofer sea asignado.
        </Text>
      </Card>
      <Button
        title="Ver solicitud"
        onPress={() => router.replace(`/(client)/order/${id}`)}
      />
      <Button
        title="Volver al inicio"
        variant="secondary"
        onPress={() => router.replace("/(client)/(tabs)/home")}
      />
    </Page>
  );
}
