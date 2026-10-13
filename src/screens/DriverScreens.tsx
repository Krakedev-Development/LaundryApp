import {
  Accordion,
  ListItem,
  SegmentedControl,
  SearchField,
  StatusChip,
  useSearch,
} from "../components/presentation";
import { BottomSheet } from "../components/overlay/OverlayPortal";
import { OrderList } from "../components/OrderList";
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
  terminalStatuses,
  type OperationalStatus,
  type Order,
} from "../domain/models";
import type { ScreenProps } from "../navigation/routes";
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";
import { RouteMetadata, routeStyles } from "../components/DriverRoutePresentation";
import { DriverSectionTitle, DriverServiceMeta, driverServiceStyles } from "../components/DriverServicePresentation";
import { ordersStyles } from "../components/OrdersPresentation";

function DriverAction({ order }: { order: Order }) {
  const { execute } = useApp();
  const navigation = useLaundryNavigation();
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
export function DriverRouteScreen() {
  const navigation = useLaundryNavigation();
  const { state, execute } = useApp();
  const d = state.driver;
  const [statusPanel, setStatusPanel] = useState(false);
  const orders = visibleOrders(state).filter(
    (o) =>
      pickupStatuses.includes(o.status) || deliveryStatuses.includes(o.status),
  );
  const next = orders[0];
  return (
    <Page>
      <Card style={routeStyles.summary}>
        <View style={routeStyles.summaryHeader}>
          <View style={routeStyles.summaryIcon}>
            <Icon name="navigate-outline" size={22} />
          </View>
          <View style={routeStyles.info}>
            <Title style={routeStyles.title}>Ruta del día</Title>
            <Badge>{operationalLabels[d.operationalStatus]}</Badge>
          </View>
        </View>
        <Body style={routeStyles.caption}>
          {d.zoneName} · {orders.length} paradas activas
        </Body>
        <ListItem
          title="Cambiar disponibilidad"
          subtitle={operationalLabels[d.operationalStatus]}
          icon="toggle-outline"
          onPress={() => setStatusPanel(true)}
        />
        <BottomSheet
          title="Disponibilidad"
          visible={statusPanel}
          onClose={() => setStatusPanel(false)}
        >
          {(Object.keys(operationalLabels) as OperationalStatus[]).map(
            (status) => (
              <Choice
                key={status}
                style={[
                  routeStyles.choice,
                  d.operationalStatus === status && routeStyles.selectedChoice,
                ]}
                label={operationalLabels[status]}
                selected={d.operationalStatus === status}
                onPress={() => {
                  execute((r) => r.setDriverOperationalStatus(status));
                  setStatusPanel(false);
                }}
              />
            ),
          )}
        </BottomSheet>
      </Card>
      <Title style={routeStyles.section}>Siguiente servicio</Title>
      {next ? (
        <Card style={routeStyles.next}>
          <View style={routeStyles.nextHeader}>
            <Title style={routeStyles.id}>{next.id}</Title>
            <StatusChip status={next.status} />
          </View>
          <Title style={routeStyles.customer}>{next.customerName}</Title>
          <RouteMetadata icon="location-outline">
            <Body style={routeStyles.address}>
              {pickupStatuses.includes(next.status)
                ? next.pickup.addressFull
                : next.delivery.addressFull}
            </Body>
          </RouteMetadata>
          <View style={routeStyles.time}>
            <RouteMetadata icon="time-outline">
              <Body muted style={routeStyles.address}>
                {pickupStatuses.includes(next.status)
                  ? next.pickup.timeSlot
                  : next.delivery.timeSlot}
              </Body>
            </RouteMetadata>
          </View>
          <DriverAction order={next} />
          <Button
            label="Ver detalle del siguiente servicio"
            secondary
            style={routeStyles.secondary}
            textStyle={routeStyles.secondaryText}
            onPress={() =>
              navigation.navigate("DriverServiceDetail", { orderId: next.id })
            }
          />
          <Button
            label="Abrir chat con el cliente"
            secondary
            style={routeStyles.secondary}
            textStyle={routeStyles.secondaryText}
            onPress={() => navigation.navigate("Chat", { orderId: next.id })}
          />
        </Card>
      ) : (
        <Empty text="No hay paradas activas asignadas. Consulta los próximos servicios." />
      )}
      <Title style={routeStyles.section}>Paradas de tu ruta</Title>
      {orders.slice(1).map((o) => (
        <OrderCard
          key={o.id}
          order={o}
          appearance="orders"
          onDetail={() =>
            navigation.navigate("DriverServiceDetail", { orderId: o.id })
          }
        />
      ))}
      <Button
        label="Ver todos mis servicios"
        secondary
        style={routeStyles.secondary}
        textStyle={routeStyles.secondaryText}
        onPress={() => navigation.navigate("DriverServices")}
      />
    </Page>
  );
}
export function DriverServicesScreen() {
  const navigation = useLaundryNavigation(),
    { state } = useApp();
  const [upcoming, setUpcoming] = useState(false),
    [search, setSearch] = useState("");
  const query = useSearch(search);
  const active = (o: Order) =>
    pickupStatuses.includes(o.status) || deliveryStatuses.includes(o.status);
  const orders = visibleOrders(state).filter(
    (o) =>
      !terminalStatuses.includes(o.status) &&
      active(o) !== upcoming &&
      (
        o.id +
        " " +
        o.customerName +
        " " +
        o.pickup.addressFull +
        " " +
        o.delivery.addressFull
      )
        .toLocaleLowerCase()
        .includes(query),
  );
  return (
    <Page scroll={false}>
      <Title style={ordersStyles.screenTitle}>Mis servicios</Title>
      <SegmentedControl
        appearance="request"
        value={upcoming ? "next" : "active"}
        onChange={(v) => setUpcoming(v === "next")}
        options={[
          { value: "active", label: "Activos" },
          { value: "next", label: "Próximos" },
        ]}
      />
      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="Buscar servicios"
      />
      <OrderList
        appearance="orders"
        orders={orders}
        onDetail={(o) =>
          navigation.navigate("DriverServiceDetail", { orderId: o.id })
        }
        onClear={() => setSearch("")}
      />
    </Page>
  );
}
export function DriverServiceDetailScreen({
  route,
}: ScreenProps<"DriverServiceDetail">) {
  const navigation = useLaundryNavigation();
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
      <Card style={driverServiceStyles.card}>
        <View style={driverServiceStyles.heroRow}>
          <Title style={driverServiceStyles.id}>
            {o.id} · {pickup ? "Recogida" : "Entrega"}
          </Title>
          <StatusChip status={o.status} />
        </View>
        <DriverServiceMeta icon="person-outline">
          <Body style={driverServiceStyles.customer}>{o.customerName}</Body>
        </DriverServiceMeta>
        <Button
          label="Abrir chat con el cliente"
          icon="chatbubble-outline"
          secondary
          style={driverServiceStyles.secondary}
          onPress={() => navigation.navigate("Chat", { orderId: o.id })}
        />
      </Card>
      <Card style={driverServiceStyles.card}>
        <DriverSectionTitle icon="location-outline">
          Dirección de destino
        </DriverSectionTitle>
        <Body style={driverServiceStyles.text}>{destination.addressFull}</Body>
        <DriverServiceMeta icon="time-outline">
          <Body muted style={driverServiceStyles.text}>
            {destination.date} · {destination.timeSlot}
          </Body>
        </DriverServiceMeta>
        {pickup && o.pickup.notes && (
          <Body style={driverServiceStyles.notice}>
            Instrucciones: {o.pickup.notes}
          </Body>
        )}
        <Button
          label="Ver mapa y navegación"
          icon="map-outline"
          secondary
          variant="primary"
          style={driverServiceStyles.primary}
          onPress={() => navigation.navigate("DriverMap", { orderId: o.id })}
        />
      </Card>
      <Card style={driverServiceStyles.accordionCard}>
        <Accordion
          title={"Prendas esperadas (" + garmentCount(o) + ")"}
          appearance="list"
        >
          {o.items.map((i) => (
            <Body key={i.id} style={driverServiceStyles.text}>
              {i.quantity} × {i.garmentType} · {i.serviceType}
            </Body>
          ))}
          {o.pricingModel === "PER_WEIGHT" && (
            <Body>Servicio por peso. Confirma el conteo real al recoger.</Body>
          )}
        </Accordion>
      </Card>
      <DriverAction order={o} />
      {o.pickup.garmentCountConfirmed !== undefined && (
        <Card style={driverServiceStyles.accordionCard}>
          <Accordion title="Constancia de recogida" appearance="list">
            <Body>
              {o.pickup.garmentCountConfirmed} prendas · {o.pickup.pickedUpAt}
            </Body>
            <Body>{o.pickup.notes}</Body>
            {o.pickup.evidencePhotoUri && <Badge>Evidencia adjunta</Badge>}
          </Accordion>
        </Card>
      )}
      {o.delivery.recipientName && (
        <Card style={driverServiceStyles.accordionCard}>
          <Accordion title="Constancia de entrega" appearance="list">
            <Body>
              {o.delivery.recipientName} · {o.delivery.recipientRelationship}
            </Body>
            <Body muted>{o.delivery.deliveredAt}</Body>
            <Body>{o.delivery.deliveryNotes}</Body>
            {o.delivery.evidencePhotoUri && <Badge>Evidencia adjunta</Badge>}
          </Accordion>
        </Card>
      )}
      <DemoPlantActions order={o} />
    </Page>
  );
}
export function DriverPickupConfirmScreen({
  route,
}: ScreenProps<"DriverPickupConfirm">) {
  const navigation = useLaundryNavigation();
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
    <Page
      footer={
        <>
          <Button
            label="Confirmar recogida"
            icon="checkmark-circle-outline"
            style={driverServiceStyles.primary}
            disabled={
              !checked || !Number.isInteger(Number(count)) || Number(count) < 1
            }
            onPress={() => {
              if (
                a.run(
                  () =>
                    execute((r) =>
                      r.driverConfirmPickup(
                        o.id,
                        Number(count),
                        notes,
                        photo,
                        code.trim() || undefined,
                      ),
                    ),
                  "Recogida confirmada.",
                )
              )
                navigation.popTo("DriverRoute");
            }}
          />
        </>
      }
    >
      <Badge>{o.id}</Badge>
      <Card style={driverServiceStyles.card}>
        <DriverSectionTitle icon="shirt-outline">
          Recepción de prendas
        </DriverSectionTitle>
        <DriverServiceMeta icon="person-outline">
          <Body style={driverServiceStyles.text}>
            {o.customerName} · {o.pickup.addressFull}
          </Body>
        </DriverServiceMeta>
        {o.items.map((i) => (
          <Body
            key={i.id}
            style={[driverServiceStyles.text, driverServiceStyles.garment]}
          >
            {i.quantity} × {i.garmentType}
          </Body>
        ))}
        <Field
          label="Cantidad de prendas recibidas"
          labelStyle={driverServiceStyles.label}
          style={driverServiceStyles.count}
          validate={(value) =>
            !Number.isInteger(Number(value)) || Number(value) < 1
              ? "Ingresa una cantidad entera mayor a cero."
              : undefined
          }
          value={count}
          onChangeText={setCount}
          keyboardType="number-pad"
        />
        <Check
          label="Verifiqué las prendas con el cliente"
          style={[
            driverServiceStyles.check,
            checked && driverServiceStyles.checked,
          ]}
          checked={checked}
          onChange={setChecked}
        />
        <Card style={driverServiceStyles.accordionCard}>
          <Accordion
            title="Observaciones y evidencia (opcional)"
            appearance="list"
          >
            <Field
              label="Observaciones de recogida"
              labelStyle={driverServiceStyles.label}
              style={driverServiceStyles.input}
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
              labelStyle={driverServiceStyles.label}
              style={driverServiceStyles.input}
              value={code}
              onChangeText={setCode}
            />
            <QrScanner onScan={setCode} />
            <Body muted style={driverServiceStyles.notice}>
              Si introduces un código, debe corresponder a esta recogida.
            </Body>
          </Accordion>
        </Card>
        {a.feedback}
      </Card>
    </Page>
  );
}
export function DriverDeliveryConfirmScreen({
  route,
}: ScreenProps<"DriverDeliveryConfirm">) {
  const navigation = useLaundryNavigation();
  const { state, execute } = useApp();
  const o = visibleOrders(state).find((o) => o.id === route.params.orderId);
  const a = useAction();
  const [relationshipPanel, setRelationshipPanel] = useState(false);
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
    <Page
      footer={
        <>
          <Button
            label="Confirmar entrega"
            disabled={!checked || !name.trim()}
            onPress={() => {
              if (
                a.run(
                  () =>
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
                  "Entrega confirmada.",
                )
              )
                navigation.popTo("DriverRoute");
            }}
          />
        </>
      }
    >
      <Badge>{o.id}</Badge>
      <Card>
        <Title>Confirma quién recibe</Title>
        <Field
          label="Nombre de quien recibe"
          value={name}
          onChangeText={setName}
        />
        <ListItem
          title="Relación con el cliente"
          subtitle={relationship}
          icon="people-outline"
          onPress={() => setRelationshipPanel(true)}
        />
        <BottomSheet
          title="Quién recibe"
          visible={relationshipPanel}
          onClose={() => setRelationshipPanel(false)}
        >
          {["Cliente", "Familiar", "Conserje", "Otro autorizado"].map((rel) => (
            <Choice
              key={rel}
              label={rel}
              selected={relationship === rel}
              onPress={() => {
                setRelationship(rel);
                setRelationshipPanel(false);
              }}
            />
          ))}
        </BottomSheet>
        <Accordion title="Observaciones y evidencia (opcional)">
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
        </Accordion>
        <Check
          label="Confirmo la entrega completa a la persona indicada"
          checked={checked}
          onChange={setChecked}
        />
        {a.feedback}
      </Card>
    </Page>
  );
}
export function DriverHistoryScreen() {
  const navigation = useLaundryNavigation();
  const { state } = useApp();
  const [filter, setFilter] = useState("Todos"),
    [search, setSearch] = useState("");
  const query = useSearch(search);
  const orders = visibleOrders(state)
    .filter(
      (o) =>
        terminalStatuses.includes(o.status) &&
        (o.id + " " + o.customerName).toLocaleLowerCase().includes(query),
    )
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
    <Page scroll={false}>
      <Title>Historial de servicios</Title>
      <SegmentedControl
        value={filter}
        onChange={setFilter}
        options={["Hoy", "Esta semana", "Todos"].map((f) => ({
          value: f,
          label: f,
        }))}
      />
      <SearchField
        value={search}
        onChange={setSearch}
        placeholder="Buscar en historial"
      />
      <OrderList
        orders={orders}
        onDetail={(o) =>
          navigation.navigate("DriverServiceDetail", { orderId: o.id })
        }
        onClear={() => {
          setSearch("");
          setFilter("Todos");
        }}
      />
    </Page>
  );
}
