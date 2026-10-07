import { useState } from "react";
import { View } from "react-native";
import { Page } from "../components/Page";
import {
  Badge,
  Body,
  Button,
  Card,
  Check,
  Choice,
  Empty,
  Field,
  Icon,
  Title,
  ui,
  useAction,
} from "../components/ui";
import { PhotoAttachment } from "../components/PhotoAttachment";
import { QrScanner } from "../components/QrScanner";
import { OrderCard } from "../components/OrderCard";
import { DemoPlantActions } from "./ClientOrderScreens";
import { useApp } from "../store/AppProvider";
import { visibleOrders } from "../domain/repository";
import {
  deliveryStatuses,
  garmentCount,
  operationalLabels,
  pickupStatuses,
  statusLabels,
  terminalStatuses,
  type OperationalStatus,
  type Order,
} from "../domain/models";
import type { ScreenProps } from "../navigation/routes";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Routes } from "../navigation/routes";

function DriverAction({ order }: { order: Order }) {
  const { execute } = useApp();
  const navigation = useNavigation<NativeStackNavigationProp<Routes>>();
  const a = useAction();
  const actions = {
    PICKUP_ASSIGNED: ["Iniciar navegación de recogida", "START_PICKUP"],
    HEADING_TO_PICKUP: ["Marcar llegada al domicilio", "ARRIVE_PICKUP"],
    PICKED_UP: ["Ir a planta central", "GO_FACILITY"],
    HEADING_TO_FACILITY: ["Confirmar entrega en planta", "ARRIVE_FACILITY"],
    DELIVERY_ASSIGNED: ["Iniciar navegación de entrega", "START_DELIVERY"],
    OUT_FOR_DELIVERY: ["Marcar llegada a entrega", "ARRIVE_DELIVERY"],
  } as const;
  const action = actions[order.status as keyof typeof actions];
  return (
    <View style={{ gap: 10 }}>
      {a.feedback}
      {action && (
        <Button
          label={action[0]}
          onPress={() => {
            if (
              a.run(() =>
                execute((r) => r.driverAction(order.id, action[1])),
              ) &&
              ["START_PICKUP", "START_DELIVERY"].includes(action[1])
            )
              navigation.navigate("DriverMap", { orderId: order.id });
          }}
        />
      )}
      {order.status === "ARRIVED_FOR_PICKUP" && (
        <Button
          label="Confirmar recogida de prendas"
          onPress={() =>
            navigation.navigate("DriverPickupConfirm", { orderId: order.id })
          }
        />
      )}
      {order.status === "ARRIVED_FOR_DELIVERY" && (
        <Button
          label="Confirmar entrega al cliente"
          onPress={() =>
            navigation.navigate("DriverDeliveryConfirm", { orderId: order.id })
          }
        />
      )}
    </View>
  );
}
export function DriverRouteScreen({ navigation }: ScreenProps<"DriverRoute">) {
  const { state, execute } = useApp();
  const d = state.driver;
  const orders = visibleOrders(state).filter(
    (o) =>
      pickupStatuses.includes(o.status) || deliveryStatuses.includes(o.status),
  );
  const next = orders[0];
  return (
    <Page>
      <Card>
        <Icon name="navigate-outline" size={32} />
        <Title>Ruta del día</Title>
        <Badge>{operationalLabels[d.operationalStatus]}</Badge>
        <Body>
          {d.zoneName} · {orders.length} paradas activas
        </Body>
        {(Object.keys(operationalLabels) as OperationalStatus[]).map(
          (status) => (
            <Choice
              key={status}
              label={operationalLabels[status]}
              selected={d.operationalStatus === status}
              onPress={() =>
                execute((r) => r.setDriverOperationalStatus(status))
              }
            />
          ),
        )}
      </Card>
      <Title>Siguiente servicio</Title>
      {next ? (
        <Card>
          <Title>
            {next.id} · {next.customerName}
          </Title>
          <Badge>{statusLabels[next.status]}</Badge>
          <Body>
            {pickupStatuses.includes(next.status)
              ? next.pickup.addressFull
              : next.delivery.addressFull}
          </Body>
          <Body muted>
            {pickupStatuses.includes(next.status)
              ? next.pickup.timeSlot
              : next.delivery.timeSlot}
          </Body>
          <DriverAction order={next} />
          <Button
            label="Ver detalle del siguiente servicio"
            secondary
            onPress={() =>
              navigation.navigate("DriverServiceDetail", { orderId: next.id })
            }
          />
          <Button
            label="Abrir chat con el cliente"
            secondary
            onPress={() => navigation.navigate("Chat", { orderId: next.id })}
          />
        </Card>
      ) : (
        <Empty text="No hay paradas activas asignadas. Consulta los próximos servicios." />
      )}
      <Title>Paradas de tu ruta</Title>
      {orders.slice(1).map((o) => (
        <OrderCard
          key={o.id}
          order={o}
          onDetail={() =>
            navigation.navigate("DriverServiceDetail", { orderId: o.id })
          }
        />
      ))}
      <Button
        label="Ver todos mis servicios"
        secondary
        onPress={() => navigation.navigate("DriverServices")}
      />
    </Page>
  );
}
export function DriverServicesScreen({
  navigation,
}: ScreenProps<"DriverServices">) {
  const { state } = useApp();
  const [upcoming, setUpcoming] = useState(false);
  const active = (o: Order) =>
    pickupStatuses.includes(o.status) || deliveryStatuses.includes(o.status);
  const orders = visibleOrders(state).filter(
    (o) => !terminalStatuses.includes(o.status) && active(o) !== upcoming,
  );
  return (
    <Page>
      <View style={ui.row}>
        <Choice
          label="Activos"
          selected={!upcoming}
          onPress={() => setUpcoming(false)}
        />
        <Choice
          label="Próximos"
          selected={upcoming}
          onPress={() => setUpcoming(true)}
        />
      </View>
      {orders.length ? (
        orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            onDetail={() =>
              navigation.navigate("DriverServiceDetail", { orderId: o.id })
            }
          />
        ))
      ) : (
        <Empty text="No hay servicios en esta categoría." />
      )}
    </Page>
  );
}
export function DriverServiceDetailScreen({
  navigation,
  route,
}: ScreenProps<"DriverServiceDetail">) {
  const { state } = useApp();
  const o = visibleOrders(state).find((o) => o.id === route.params.orderId);
  if (!o)
    return (
      <Page>
        <Empty text="Servicio no disponible para este chofer." />
      </Page>
    );
  const pickup = pickupStatuses.includes(o.status);
  const destination = pickup ? o.pickup : o.delivery;
  return (
    <Page>
      <Card>
        <Title>
          {o.id} · {pickup ? "Recogida" : "Entrega"}
        </Title>
        <Badge>{statusLabels[o.status]}</Badge>
        <Body>{o.customerName}</Body>
        <Button
          label="Abrir chat con el cliente"
          icon="chatbubble-outline"
          secondary
          onPress={() => navigation.navigate("Chat", { orderId: o.id })}
        />
      </Card>
      <Card>
        <Title>Dirección de destino</Title>
        <Body>{destination.addressFull}</Body>
        <Body muted>
          {destination.date} · {destination.timeSlot}
        </Body>
        {pickup && o.pickup.notes && (
          <Body>Instrucciones: {o.pickup.notes}</Body>
        )}
        <Button
          label="Ver mapa y navegación"
          icon="map-outline"
          onPress={() => navigation.navigate("DriverMap", { orderId: o.id })}
        />
      </Card>
      <Card>
        <Title>Prendas esperadas ({garmentCount(o)})</Title>
        {o.items.map((i) => (
          <Body key={i.id}>
            {i.quantity} × {i.garmentType} · {i.serviceType}
          </Body>
        ))}
        {o.pricingModel === "PER_WEIGHT" && (
          <Body>Servicio por peso. Confirma el conteo real al recoger.</Body>
        )}
      </Card>
      <DriverAction order={o} />
      {o.pickup.garmentCountConfirmed !== undefined && (
        <Card>
          <Title>Constancia de recogida</Title>
          <Body>
            {o.pickup.garmentCountConfirmed} prendas · {o.pickup.pickedUpAt}
          </Body>
          <Body>{o.pickup.notes}</Body>
          {o.pickup.evidencePhotoUri && <Badge>Evidencia adjunta</Badge>}
        </Card>
      )}
      {o.delivery.recipientName && (
        <Card>
          <Title>Constancia de entrega</Title>
          <Body>
            {o.delivery.recipientName} · {o.delivery.recipientRelationship}
          </Body>
          <Body muted>{o.delivery.deliveredAt}</Body>
          <Body>{o.delivery.deliveryNotes}</Body>
          {o.delivery.evidencePhotoUri && <Badge>Evidencia adjunta</Badge>}
        </Card>
      )}
      <DemoPlantActions order={o} />
    </Page>
  );
}
export function DriverPickupConfirmScreen({
  navigation,
  route,
}: ScreenProps<"DriverPickupConfirm">) {
  const { state, execute } = useApp();
  const o = visibleOrders(state).find((o) => o.id === route.params.orderId);
  const a = useAction();
  const [checked, setChecked] = useState(false),
    [count, setCount] = useState(String(o ? Math.max(1, garmentCount(o)) : 1)),
    [notes, setNotes] = useState(""),
    [photo, setPhoto] = useState<string>(),
    [code, setCode] = useState("");
  if (!o)
    return (
      <Page>
        <Empty text="Servicio no disponible." />
      </Page>
    );
  return (
    <Page>
      <Badge>{o.id}</Badge>
      <Card>
        <Title>Recepción de prendas</Title>
        <Body>
          {o.customerName} · {o.pickup.addressFull}
        </Body>
        {o.items.map((i) => (
          <Body key={i.id}>
            {i.quantity} × {i.garmentType}
          </Body>
        ))}
        <Field
          label="Cantidad de prendas recibidas"
          value={count}
          onChangeText={setCount}
          keyboardType="number-pad"
        />
        <Check
          label="Verifiqué las prendas con el cliente"
          checked={checked}
          onChange={setChecked}
        />
        <Field
          label="Observaciones de recogida"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        <PhotoAttachment
          label="Evidencia de recogida (opcional)"
          uri={photo}
          onChange={setPhoto}
        />
        <Field
          label="Código de transferencia (opcional)"
          value={code}
          onChangeText={setCode}
        />
        <QrScanner onScan={setCode} />
        <Body muted>
          Si introduces un código, debe corresponder a esta recogida.
        </Body>
        {a.feedback}
        <Button
          label="Confirmar recogida"
          disabled={!checked}
          onPress={() => {
            if (
              a.run(() =>
                execute((r) =>
                  r.driverConfirmPickup(
                    o.id,
                    Number(count),
                    notes,
                    photo,
                    code.trim() || undefined,
                  ),
                ),
              )
            )
              navigation.popTo("DriverRoute");
          }}
        />
      </Card>
    </Page>
  );
}
export function DriverDeliveryConfirmScreen({
  navigation,
  route,
}: ScreenProps<"DriverDeliveryConfirm">) {
  const { state, execute } = useApp();
  const o = visibleOrders(state).find((o) => o.id === route.params.orderId);
  const a = useAction();
  const [name, setName] = useState(o?.customerName ?? ""),
    [relationship, setRelationship] = useState("Cliente"),
    [notes, setNotes] = useState(""),
    [photo, setPhoto] = useState<string>(),
    [code, setCode] = useState(""),
    [checked, setChecked] = useState(false);
  if (!o)
    return (
      <Page>
        <Empty text="Servicio no disponible." />
      </Page>
    );
  return (
    <Page>
      <Badge>{o.id}</Badge>
      <Card>
        <Title>Confirma quién recibe</Title>
        <Field
          label="Nombre de quien recibe"
          value={name}
          onChangeText={setName}
        />
        {["Cliente", "Familiar", "Conserje", "Otro autorizado"].map((rel) => (
          <Choice
            key={rel}
            label={rel}
            selected={relationship === rel}
            onPress={() => setRelationship(rel)}
          />
        ))}
        <Field
          label="Observaciones de entrega"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        <PhotoAttachment
          label="Evidencia de entrega (opcional)"
          uri={photo}
          onChange={setPhoto}
        />
        <Field
          label="Código de entrega (opcional)"
          value={code}
          onChangeText={setCode}
        />
        <QrScanner onScan={setCode} />
        <Check
          label="Confirmo la entrega completa a la persona indicada"
          checked={checked}
          onChange={setChecked}
        />
        {a.feedback}
        <Button
          label="Confirmar entrega"
          disabled={!checked || !name.trim()}
          onPress={() => {
            if (
              a.run(() =>
                execute((r) =>
                  r.driverConfirmDelivery(
                    o.id,
                    name,
                    relationship,
                    notes,
                    photo,
                    code.trim() || undefined,
                  ),
                ),
              )
            )
              navigation.popTo("DriverRoute");
          }}
        />
      </Card>
    </Page>
  );
}
export function DriverHistoryScreen({
  navigation,
}: ScreenProps<"DriverHistory">) {
  const { state } = useApp();
  const [filter, setFilter] = useState("Todos");
  const orders = visibleOrders(state)
    .filter((o) => terminalStatuses.includes(o.status))
    .filter((o) => {
      if (filter === "Todos") return true;
      const stamp =
        o.delivery.deliveredAt ??
        o.timeline.find((e) => e.status === "CANCELLED")?.timestamp ??
        o.createdAt;
      const date = new Date(stamp).getTime();
      const age = Date.now() - date;
      return filter === "Hoy"
        ? age >= 0 && age < 86400000
        : age >= 0 && age < 7 * 86400000;
    });
  return (
    <Page>
      <Card>
        {["Hoy", "Esta semana", "Todos"].map((f) => (
          <Choice
            key={f}
            label={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </Card>
      {orders.length ? (
        orders.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            onDetail={() =>
              navigation.navigate("DriverServiceDetail", { orderId: o.id })
            }
          />
        ))
      ) : (
        <Empty text="No tienes servicios finalizados en este período." />
      )}
    </Page>
  );
}
