import React, { useState } from "react";
import { Image, Linking, Text, useWindowDimensions, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import {
  AppHeader,
  Badge,
  BottomSheet,
  Button,
  Card,
  Check,
  Chip,
  EmptyState,
  ErrorState,
  Field,
  Page,
  ui,
} from "../../components/ui";
import { RouteMap } from "../../components/RouteMap";
import { useApp } from "../../store/AppStore";
import { useAction } from "../../hooks/useAction";
import {
  activeAssignment,
  dateLabel,
  DRIVER_NEXT,
  routeDistance,
  timeLabel,
  today,
} from "../../domain/rules";
import {
  DriverAssignment,
  Order,
  ORDER_STATUS_LABELS,
  OperationalStatus,
} from "../../domain/models";
import { captureImage } from "../auth/screens";

const statusLabels: Record<OperationalStatus, string> = {
  AVAILABLE: "Disponible",
  ON_SERVICE: "En servicio",
  BREAK: "Pausa",
  OFFLINE: "Fuera de turno",
};
function LocationNotice() {
  const { data, session, engine } = useApp();
  const a = useAction();
  const drv = data.drivers.find((d) => d.id === session!.userId)!;
  if (drv.locationAllowed) return null;
  return (
    <Card>
      <Badge title="Necesitamos tu ubicación" tone="warning" />
      <Text style={ui.body}>
        Puedes consultar la ruta. Para comenzar un servicio necesitamos permiso
        de ubicación.
      </Text>
      <Button
        title="Habilitar ubicación"
        busy={a.busy}
        onPress={() =>
          a.run(async () => {
            const permission =
              await Location.requestForegroundPermissionsAsync();
            if (!permission.granted)
              throw new Error(
                "La ubicación está desactivada. Abre la configuración de tu dispositivo para habilitarla.",
              );
            engine.update((d) => {
              d.drivers.find((v) => v.id === drv.id)!.locationAllowed = true;
            });
          })
        }
      />
      <Button
        title="Abrir configuración"
        variant="secondary"
        onPress={() =>
          a.run(async () => {
            await Linking.openSettings();
          })
        }
      />
      {!!a.error && <ErrorState text={a.error} />}
    </Card>
  );
}
function TaskCard({
  assignment,
  dominant = false,
}: {
  assignment: DriverAssignment;
  dominant?: boolean;
}) {
  const { engine, session, data, online } = useApp();
  const router = useRouter();
  const action = useAction();
  const o = engine.order(session!, assignment.orderId);
  const schedule = assignment.type === "PICKUP" ? o.pickup : o.delivery;
  const drv = data.drivers.find((d) => d.id === session!.userId)!;
  const facility = data.facilities.find((f) => f.id === o.facilityId)!;
  const toFacility =
    assignment.status !== "COMPLETED" &&
    ["PICKED_UP", "HEADING_TO_FACILITY"].includes(o.status);
  const distance = routeDistance(
    drv.location,
    toFacility ? facility.coordinates : schedule.address.coordinates,
  );
  const next =
    assignment.status !== "COMPLETED" ? DRIVER_NEXT[o.status] : undefined;
  return (
    <Card>
      <View style={ui.between}>
        <Badge title={assignment.type === "PICKUP" ? "Recogida" : "Entrega"} />
        <Text style={ui.section}>{o.id}</Text>
      </View>
      {!!(o.priority === "URGENT") && <Badge title="Urgente" tone="warning" />}
      <Text style={dominant ? ui.title : ui.section}>{o.customerName}</Text>
      <Text style={ui.body}>
        {toFacility ? facility.address : schedule.address.fullAddress}
      </Text>
      <Text style={ui.muted}>
        {dateLabel(schedule.date)} · {schedule.timeSlot}
      </Text>
      <Text style={ui.meta}>
        {distance} km · ETA estimada {Math.max(3, Math.ceil(distance * 4))} min
      </Text>
      <Badge
        title={
          assignment.status === "COMPLETED"
            ? "Etapa completada"
            : ORDER_STATUS_LABELS[o.status]
        }
        tone={assignment.status === "COMPLETED" ? "success" : "primary"}
      />
      {!!schedule.notes && <Text style={ui.body}>{schedule.notes}</Text>}
      <Button
        title={dominant && next ? next.label : "Abrir servicio"}
        busy={action.busy}
        onPress={() =>
          action.run(() => {
            if (
              dominant &&
              next &&
              [
                "HEADING_TO_PICKUP",
                "OUT_FOR_DELIVERY",
                "HEADING_TO_FACILITY",
              ].includes(next.status)
            ) {
              engine.transition(session!, o.id, next.status, online);
              router.push(`/(driver)/map/${o.id}`);
            } else router.push(`/(driver)/service/${o.id}`);
          })
        }
      />
      {!!action.error && <ErrorState text={action.error} />}
    </Card>
  );
}
export function DriverRouteScreen() {
  const { engine, session, data, online } = useApp();
  const a = useAction();
  const [sheet, setSheet] = useState(false);
  const drv = engine.driver(session!);
  const route = engine.routeFor(session!);
  const first = route.assignments[0];
  const width = useWindowDimensions().width;
  let target;
  if (first) {
    const o = engine.order(session!, first.orderId);
    target = ["PICKED_UP", "HEADING_TO_FACILITY"].includes(o.status)
      ? data.facilities.find((f) => f.id === o.facilityId)!
      : (first.type === "PICKUP" ? o.pickup : o.delivery).address;
  }
  return (
    <Page>
      <AppHeader
        title={`Hola, ${drv.name.split(" ")[0]}`}
        subtitle="Tu próxima parada, a un toque"
        icon="navigate-outline"
      />
      <Button
        title={`Estado: ${statusLabels[drv.operationalStatus]}`}
        variant="secondary"
        onPress={() => setSheet(true)}
      />
      <LocationNotice />
      <Card>
        <View style={ui.between}>
          <Text style={ui.section}>
            {route.assignments.length} servicios pendientes
          </Text>
          <Badge
            title={online ? "Ruta cargada" : "Ruta sin conexión"}
            tone={online ? "success" : "warning"}
          />
        </View>
        <Text style={ui.body}>
          {route.estimatedDistance} km · {route.estimatedDuration} min estimados
        </Text>
      </Card>
      {first ? (
        <View
          style={width >= 900 ? { flexDirection: "row", gap: 16 } : { gap: 16 }}
        >
          <View style={{ flex: 1 }}>
            <Text style={ui.section}>Siguiente servicio</Text>
            <TaskCard assignment={first} dominant />
          </View>
          {!!target && (
            <View style={{ flex: 1 }}>
              <RouteMap
                origin={drv.location}
                destination={
                  "coordinates" in target ? target.coordinates : drv.location
                }
                label="Próxima parada"
              />
            </View>
          )}
        </View>
      ) : (
        <EmptyState
          title="Todo al día"
          text="No tienes servicios asignados en este momento."
          icon="checkmark-circle-outline"
        />
      )}
      {route.assignments.slice(1).map((assignment, index) => (
        <View key={assignment.id} style={{ gap: 8 }}>
          <Text style={ui.meta}>Parada {index + 2}</Text>
          <TaskCard assignment={assignment} />
        </View>
      ))}
      <BottomSheet
        visible={sheet}
        title="Tu estado operativo"
        onClose={() => setSheet(false)}
      >
        {(Object.keys(statusLabels) as OperationalStatus[]).map((s) => (
          <Button
            key={s}
            title={statusLabels[s]}
            variant="secondary"
            onPress={() =>
              a.run(() => {
                engine.driverStatus(session!, s);
                setSheet(false);
              }, "Estado actualizado")
            }
          />
        ))}
        <Text style={ui.meta}>
          Disponible recibe nuevas asignaciones. En servicio se activa al
          comenzar una tarea.
        </Text>
        {!!a.error && <ErrorState text={a.error} />}
      </BottomSheet>
    </Page>
  );
}
export function DriverServicesScreen({
  history = false,
}: {
  history?: boolean;
}) {
  const { session, engine } = useApp();
  const [filter, setFilter] = useState(history ? "Mes" : "Activos");
  const [search, setSearch] = useState("");
  const assignments = engine
    .assignmentsFor(session!)
    .filter((a) =>
      history ? a.status === "COMPLETED" : a.status !== "COMPLETED",
    )
    .filter((a) => {
      const o = engine.order(session!, a.orderId);
      if (
        search &&
        !`${o.id} ${o.customerName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      if (!history) {
        const schedule = a.type === "PICKUP" ? o.pickup : o.delivery;
        return filter === "Próximos"
          ? schedule.date > today()
          : schedule.date <= today() || a.status === "ACTIVE";
      }
      const since =
        filter === "Hoy"
          ? new Date(`${today()}T00:00:00-05:00`).getTime()
          : Date.now() - (filter === "Semana" ? 7 : 30) * 86400000;
      return !a.completedAt || new Date(a.completedAt).getTime() >= since;
    });
  return (
    <Page>
      <AppHeader
        title={history ? "Historial" : "Tus servicios"}
        icon={history ? "time-outline" : "list-outline"}
      />
      <View style={ui.wrap}>
        {(history ? ["Hoy", "Semana", "Mes"] : ["Activos", "Próximos"]).map(
          (f) => (
            <Chip
              key={f}
              title={f}
              selected={filter === f}
              onPress={() => setFilter(f)}
            />
          ),
        )}
      </View>
      <Field
        label="Buscar servicio"
        value={search}
        onChangeText={setSearch}
        placeholder="Solicitud o cliente"
      />
      {assignments.map((a) => (
        <View key={a.id} style={{ gap: 8 }}>
          <TaskCard assignment={a} />
          {!!a.completedAt && (
            <Text style={ui.meta}>
              Completado: {dateLabel(a.completedAt)} ·{" "}
              {timeLabel(a.completedAt)}
            </Text>
          )}
        </View>
      ))}
      {!assignments.length && (
        <EmptyState
          title="Todo al día"
          text="No hay servicios en este filtro."
          icon="checkmark-circle-outline"
        />
      )}
    </Page>
  );
}
export function DriverServiceScreen({ map = false }: { map?: boolean }) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { engine, data, session, online } = useApp();
  const router = useRouter();
  const a = useAction();
  const [confirm, setConfirm] = useState(false);
  const [navigation, setNavigation] = useState(false);
  let o: Order;
  try {
    o = engine.order(session!, id);
  } catch {
    return (
      <Page>
        <ErrorState text="Este servicio no está asignado a tu cuenta." />
      </Page>
    );
  }
  const assignment = activeAssignment(data, o);
  const ownsActive = assignment?.driverId === session!.userId;
  const stage = ownsActive
    ? assignment!
    : data.assignments
        .filter((v) => v.orderId === id && v.driverId === session!.userId)
        .at(-1)!;
  const facility = data.facilities.find((v) => v.id === o.facilityId)!;
  const toFacility = ["PICKED_UP", "HEADING_TO_FACILITY"].includes(o.status);
  const schedule = stage.type === "PICKUP" ? o.pickup : o.delivery;
  const target = toFacility
    ? facility.coordinates
    : schedule.address.coordinates;
  const targetAddress = toFacility
    ? facility.address
    : schedule.address.fullAddress;
  const drv = engine.driver(session!);
  const next = ownsActive ? DRIVER_NEXT[o.status] : undefined;
  const execute = () =>
    a.run(() => {
      if (!next) return;
      if (next.status === "PICKED_UP")
        router.push(`/(driver)/pickup-confirm/${id}`);
      else if (next.status === "DELIVERED")
        router.push(`/(driver)/delivery-confirm/${id}`);
      else if (
        ["ARRIVED_FOR_PICKUP", "ARRIVED_FOR_DELIVERY", "AT_FACILITY"].includes(
          next.status,
        )
      )
        setConfirm(true);
      else {
        engine.transition(session!, id, next.status, online);
        router.push(`/(driver)/map/${id}`);
      }
    });
  return (
    <Page>
      <AppHeader
        title={o.id}
        subtitle={`${stage.type === "PICKUP" ? "Recogida" : "Entrega"} · ${o.customerName}`}
        icon="navigate-outline"
      />
      <Badge title={ORDER_STATUS_LABELS[o.status]} />
      <LocationNotice />
      {!!map && (
        <RouteMap
          origin={drv.location}
          destination={target}
          label={toFacility ? facility.name : schedule.address.title}
          height={350}
        />
      )}
      <Card>
        <Text style={ui.section}>
          {toFacility ? "Entrega en planta" : schedule.address.title}
        </Text>
        <Text style={ui.body}>{targetAddress}</Text>
        <Text style={ui.muted}>{schedule.address.reference}</Text>
        <Text style={ui.body}>
          {dateLabel(schedule.date)} · {schedule.timeSlot}
        </Text>
        <Text style={ui.meta}>
          Distancia estimada: {routeDistance(drv.location, target)} km
        </Text>
        {!!schedule.notes && <Text style={ui.body}>{schedule.notes}</Text>}
      </Card>
      <Card>
        <Text style={ui.section}>
          {o.items.reduce((s, i) => s + i.quantity, 0)} prendas
        </Text>
        {o.items.map((i) => (
          <Text key={i.id} style={ui.muted}>
            {i.quantity} × {i.name}
            {i.notes ? ` · ${i.notes}` : ""}
          </Text>
        ))}
      </Card>
      {!!next && (
        <Button
          title={next.label}
          onPress={execute}
          busy={a.busy}
          disabled={
            !drv.locationAllowed &&
            [
              "HEADING_TO_PICKUP",
              "OUT_FOR_DELIVERY",
              "HEADING_TO_FACILITY",
            ].includes(next.status)
          }
        />
      )}
      {!ownsActive && <Badge title="Tu etapa está completada" tone="success" />}
      {!!map && (
        <Button
          title="Abrir navegación"
          icon="map-outline"
          variant="secondary"
          disabled={!drv.locationAllowed}
          onPress={() => setNavigation(true)}
        />
      )}
      {!!ownsActive && (
        <Button
          title="Chat con cliente"
          icon="chatbubble-outline"
          variant="secondary"
          onPress={() => router.push(`/(driver)/chat/${id}`)}
        />
      )}
      {!!(!map && ownsActive) && (
        <Button
          title="Ver mapa"
          variant="secondary"
          onPress={() => router.push(`/(driver)/map/${id}`)}
        />
      )}
      {!!o.delivery.recipient && (
        <Card>
          <Text style={ui.section}>Entrega registrada</Text>
          <Text style={ui.body}>
            {o.delivery.recipient.name} · {o.delivery.recipient.relationship}
          </Text>
          <Text style={ui.meta}>
            {o.delivery.completedAt && timeLabel(o.delivery.completedAt)}
          </Text>
        </Card>
      )}
      <BottomSheet
        visible={confirm}
        title={
          next?.status === "AT_FACILITY"
            ? "¿Entregaste las prendas en planta?"
            : "¿Ya llegaste?"
        }
        onClose={() => setConfirm(false)}
      >
        <Text style={ui.body}>{targetAddress}</Text>
        <Button
          title={
            next?.status === "AT_FACILITY"
              ? "Confirmar entrega en planta"
              : "Sí, llegué"
          }
          onPress={() =>
            a.run(
              () => {
                engine.transition(session!, id, next!.status, online);
                setConfirm(false);
              },
              next?.status === "AT_FACILITY"
                ? "Etapa de recogida completada"
                : "Llegada registrada",
            )
          }
        />
        {!!a.error && <ErrorState text={a.error} />}
      </BottomSheet>
      <BottomSheet
        visible={navigation}
        title="Abrir navegación"
        onClose={() => setNavigation(false)}
      >
        {[
          {
            name: "Google Maps",
            url: `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}`,
          },
          {
            name: "Apple Maps",
            url: `https://maps.apple.com/?daddr=${target.lat},${target.lng}`,
          },
          {
            name: "Waze",
            url: `https://waze.com/ul?ll=${target.lat},${target.lng}&navigate=yes`,
          },
        ].map((provider) => (
          <Button
            key={provider.name}
            title={provider.name}
            variant="secondary"
            onPress={() =>
              a.run(async () => {
                await Linking.openURL(provider.url);
                setNavigation(false);
              })
            }
          />
        ))}
      </BottomSheet>
      {!!(a.error && !confirm) && <ErrorState text={a.error} />}
    </Page>
  );
}
export function DriverConfirmationScreen({
  delivery = false,
}: {
  delivery?: boolean;
}) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, engine } = useApp();
  let order: Order;
  try {
    order = engine.order(session!, id);
  } catch {
    return (
      <Page>
        <ErrorState text="Servicio no disponible." />
      </Page>
    );
  }
  return <DriverConfirmationForm key={id} order={order} delivery={delivery} />;
}
function DriverConfirmationForm({
  order,
  delivery,
}: {
  order: Order;
  delivery: boolean;
}) {
  const id = order.id;
  const { session, engine, online } = useApp();
  const router = useRouter();
  const a = useAction();
  const [count, setCount] = useState(
    String(order.items.reduce((sum, i) => sum + i.quantity, 0)),
  );
  const [recipient, setRecipient] = useState("");
  const [relation, setRelation] = useState("Cliente");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [evidence, setEvidence] = useState("");
  const [success, setSuccess] = useState(false);
  if (success)
    return (
      <Page>
        <EmptyState
          title={delivery ? "Entrega completada" : "Recogida registrada"}
          text={id}
          icon="checkmark-circle-outline"
        />
        <Card>
          <Text style={ui.body}>
            {delivery
              ? `Recibió: ${recipient} · ${relation}`
              : `${count} prendas recibidas`}
          </Text>
          <Text style={ui.meta}>
            {timeLabel(new Date().toISOString())}
            {!online ? " · Pendiente de sincronización" : ""}
          </Text>
        </Card>
        <Button
          title={delivery ? "Continuar ruta" : "Ir a planta"}
          onPress={() =>
            a.run(() => {
              if (delivery) router.replace("/(driver)/(tabs)/route");
              else {
                engine.transition(session!, id, "HEADING_TO_FACILITY", online);
                router.replace(`/(driver)/map/${id}`);
              }
            })
          }
        />
      </Page>
    );
  if (
    order.status !== (delivery ? "ARRIVED_FOR_DELIVERY" : "ARRIVED_FOR_PICKUP")
  )
    return (
      <Page>
        <ErrorState text="Registra tu llegada antes de confirmar este servicio." />
        <Button
          title="Volver al servicio"
          onPress={() => router.replace(`/(driver)/service/${id}`)}
        />
      </Page>
    );
  return (
    <Page>
      <AppHeader
        title={delivery ? "Confirmar entrega" : "Confirmar recogida"}
        subtitle={`${id} · ${order.customerName}`}
      />
      <Card>
        <Text style={ui.body}>
          {(delivery ? order.delivery : order.pickup).address.fullAddress}
        </Text>
        {delivery ? (
          <>
            <Field
              label="Nombre del destinatario"
              value={recipient}
              onChangeText={setRecipient}
            />
            <Text style={ui.section}>Relación con el cliente</Text>
            <View style={ui.wrap}>
              {["Cliente", "Familiar", "Recepción", "Otro"].map((r) => (
                <Chip
                  key={r}
                  title={r}
                  selected={relation === r}
                  onPress={() => setRelation(r)}
                />
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={ui.body}>
              Cantidad esperada:{" "}
              {order.items.reduce((s, i) => s + i.quantity, 0)}
            </Text>
            <Field
              label="Cantidad recibida"
              value={count}
              onChangeText={setCount}
              keyboardType="number-pad"
            />
          </>
        )}
        <Field
          label="Notas opcionales"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
        <Button
          title="Tomar foto opcional"
          icon="camera-outline"
          variant="secondary"
          onPress={() =>
            a.run(async () => {
              const uri = await captureImage(true);
              if (uri) setEvidence(uri);
            })
          }
        />
        {!!evidence && (
          <Image
            source={{ uri: evidence }}
            style={{ width: "100%", height: 180, borderRadius: 12 }}
            resizeMode="contain"
          />
        )}
        <Check
          title={
            delivery
              ? "Confirmo que el pedido fue entregado al destinatario indicado."
              : "Verifiqué las prendas entregadas por el cliente."
          }
          checked={confirmed}
          onPress={() => setConfirmed(!confirmed)}
        />
      </Card>
      {!!a.error && <ErrorState text={a.error} />}
      <Button
        title={delivery ? "Completar entrega" : "Confirmar recogida"}
        busy={a.busy}
        disabled={!confirmed || (delivery && recipient.trim().length < 3)}
        onPress={() =>
          a.run(
            () => {
              engine.transition(
                session!,
                id,
                delivery ? "DELIVERED" : "PICKED_UP",
                online,
                {
                  count: Number(count),
                  confirmed,
                  notes,
                  recipient,
                  relationship: relation,
                  evidence: evidence || undefined,
                },
              );
              setSuccess(true);
            },
            delivery ? "Entrega registrada" : "Recogida registrada",
          )
        }
      />
    </Page>
  );
}
