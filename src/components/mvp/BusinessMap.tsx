import { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  currentActor,
  useBusinessStore,
  businessService,
  flushBusiness,
} from "../../store/useBusinessStore";
import TrackingMap from "../map/TrackingMap";
import { routingService, geoIsDemo } from "../../services/geo";
import { Screen, Card, Action, ui } from "./ui";
import type { Coordinates } from "../../services/geo/geo.types";
import { mapDestination } from "./mapDestination";
import { publishDriverLocation } from "../../store/useBusinessStore";
export function BusinessMap() {
  const { id } = useLocalSearchParams<{ id?: string }>(),
    state = useBusinessStore((s) => s.state)!,
    actor = currentActor(),
    router = useRouter();
  const [geometry, setGeometry] = useState<Coordinates[]>([]),
    [routeNote, setRouteNote] = useState(""),
    [error, setError] = useState(""),
    [simulating, setSimulating] = useState(false);
  const order = id
    ? state.orders.find((o) => o.id === id)
    : state.orders.find(
        (o) =>
          [
            o.fulfillment?.inbound.driverId,
            o.fulfillment?.outbound.driverId,
          ].includes(actor.id) &&
          !["COMPLETED", "CANCELLED"].includes(o.status),
      );
  const authorized =
    order &&
    (actor.role === "CLIENT"
      ? order.customerId === actor.id
      : actor.role === "DRIVER" &&
        [
          order.fulfillment?.inbound.driverId,
          order.fulfillment?.outbound.driverId,
        ].includes(actor.id));
  const facility =
    state.facilities.find((f) => f.id === order?.facilityId) ??
    state.facilities[0];
  const leg =
    order?.status === "READY" || order?.status === "COMPLETED"
      ? "outbound"
      : "inbound";
  const f = order?.fulfillment?.[leg];
  const driver = state.drivers.find(
    (d) => d.id === (actor.role === "DRIVER" ? actor.id : f?.driverId),
  );
  const stops = state.routeStops
    .filter(
      (s) =>
        s.driverId === actor.id && ["PENDING", "ACTIVE"].includes(s.status),
    )
    .sort((a, b) => a.position - b.position);
  const start = driver
    ? { lat: driver.location.lat, lng: driver.location.lng }
    : f?.method === "CUSTOMER"
      ? (state.customers.find((c) => c.id === order?.customerId)?.addresses[0]
          ?.coordinates ?? facility.coordinates)
      : facility.coordinates;
  const end =
    actor.role === "DRIVER" && stops[0]
      ? stops[0].address.coordinates
      : mapDestination(order, leg, facility.coordinates);
  const key = `${order?.id}-${f?.milestone}-${end.lat}-${end.lng}`;
  useEffect(() => {
    if (!authorized) {
      setGeometry([]);
      return;
    }
    const controller = new AbortController();
    routingService
      .getRoute(start, end, { signal: controller.signal })
      .then((route) => {
        if (controller.signal.aborted) return;
        setGeometry(
          route?.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })) ?? [],
        );
        setRouteNote(
          route
            ? `${geoIsDemo ? "Ruta ilustrativa · " : "Ruta por calles · "}${(route.distanceMeters / 1000).toFixed(1)} km · ${Math.ceil(route.durationSeconds / 60)} min`
            : "Ruta no disponible. Puedes abrir navegación externa.",
        );
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [key, authorized]);
  useEffect(() => {
    if (
      !simulating ||
      actor.role !== "DRIVER" ||
      !driver ||
      geometry.length < 2
    )
      return;
    let tick = 0;
    const timer = setInterval(() => {
      const segment = Math.min(geometry.length - 2, Math.floor(tick / 10));
      const a = geometry[segment],
        b = geometry[segment + 1],
        fraction = (tick % 10) / 10;
      try {
        publishDriverLocation(driver.id, {
          lat: a.lat + (b.lat - a.lat) * fraction,
          lng: a.lng + (b.lng - a.lng) * fraction,
        });
        void flushBusiness().catch((e) => setError(e.message));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error de ubicación");
        setSimulating(false);
      }
      tick++;
      if (tick >= (geometry.length - 1) * 10) {
        clearInterval(timer);
        setSimulating(false);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [simulating, driver?.id, geometry]);
  const run = async (fn: () => void) => {
    try {
      fn();
      await flushBusiness();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  };
  return (
    <Screen
      title={
        actor.role === "CLIENT"
          ? f?.method === "CUSTOMER"
            ? "Cómo llegar a la sede"
            : "Seguimiento de solicitud"
          : "Ruta del chofer"
      }
    >
      {order && !authorized ? (
        <Text style={ui.error}>
          No tienes acceso al mapa de esta solicitud.
        </Text>
      ) : (
        <>
          <Text style={ui.muted}>
            MVP · Ubicación y recorridos de demostración en esta instalación.{" "}
            {geoIsDemo
              ? "Las distancias y ETA son estimaciones ilustrativas."
              : "Mapbox calcula rutas por calles."}
          </Text>
          <View
            style={{
              height: 330,
              borderRadius: 18,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "#DDE8F4",
            }}
          >
            <TrackingMap
              center={{
                latitude: facility.coordinates.lat,
                longitude: facility.coordinates.lng,
              }}
              stops={
                actor.role === "DRIVER"
                  ? stops.map((stop) => ({
                      id: stop.id,
                      label: stop.type + " · " + stop.orderId,
                      coordinates: {
                        latitude: stop.address.coordinates.lat,
                        longitude: stop.address.coordinates.lng,
                      },
                    }))
                  : order
                    ? [
                        {
                          id: order.id,
                          label:
                            f?.method === "CUSTOMER" ? facility.name : order.id,
                          coordinates: {
                            latitude: end.lat,
                            longitude: end.lng,
                          },
                        },
                      ]
                    : []
              }
              currentPosition={
                driver
                  ? {
                      latitude: driver.location.lat,
                      longitude: driver.location.lng,
                    }
                  : null
              }
              routeCoordinates={geometry.map((p) => ({
                latitude: p.lat,
                longitude: p.lng,
              }))}
            />
          </View>
          <Text style={ui.text}>{routeNote}</Text>
          {error && <Text style={ui.error}>{error}</Text>}
          {order && (
            <Card>
              <Text style={ui.subtitle}>{order.id}</Text>
              <Text style={ui.text}>
                {f?.date} · {f?.timeSlot}
              </Text>
              <Action
                label="Abrir solicitud y confirmaciones"
                onPress={() =>
                  router.push({
                    pathname:
                      actor.role === "CLIENT"
                        ? "/(client)/order-detail"
                        : "/(driver)/order",
                    params: { id: order.id },
                  })
                }
              />
              <Action
                label="Abrir navegación externa"
                onPress={() =>
                  void Linking.openURL(
                    `https://www.google.com/maps/dir/?api=1&destination=${end.lat},${end.lng}&travelmode=driving`,
                  ).catch(() => setError("No se pudo abrir el navegador."))
                }
              />
              {actor.role === "DRIVER" && (
                <Action
                  label={
                    simulating
                      ? "Detener recorrido de demostración"
                      : "Simular movimiento en mapa"
                  }
                  onPress={() => setSimulating(!simulating)}
                  disabled={geometry.length < 2}
                />
              )}
            </Card>
          )}
          {actor.role === "DRIVER" && (
            <Card>
              <Text style={ui.subtitle}>Paradas pendientes</Text>
              {stops.map((stop, index) => (
                <View key={stop.id} style={{ gap: 8 }}>
                  <Text style={ui.text}>
                    {index + 1}.{" "}
                    {
                      {
                        PICKUP: "Recogida",
                        FACILITY_DROPOFF: "Ingreso a planta",
                        FACILITY_PICKUP: "Salida de planta",
                        DELIVERY: "Entrega al cliente",
                      }[stop.type]
                    }{" "}
                    · {stop.orderId} · {stop.address.street} · {stop.status}
                  </Text>
                  <Action
                    label="Ver parada"
                    onPress={() =>
                      router.push({
                        pathname: "/(driver)/order",
                        params: { id: stop.orderId },
                      })
                    }
                  />
                  {state.businessPolicy.driverMayReorder &&
                    stops
                      .filter((s) => s.status === "PENDING")
                      .findIndex((s) => s.id === stop.id) > 0 &&
                    stop.status === "PENDING" && (
                      <TouchableOpacity
                        onPress={() =>
                          void run(() => {
                            const pending = stops
                              .filter((s) => s.status === "PENDING")
                              .map((s) => s.id);
                            const i = pending.indexOf(stop.id);
                            [pending[i - 1], pending[i]] = [
                              pending[i],
                              pending[i - 1],
                            ];
                            businessService.reorder(actor.id, pending);
                          })
                        }
                      >
                        <Text style={ui.link}>
                          Mover antes de la parada anterior
                        </Text>
                      </TouchableOpacity>
                    )}
                </View>
              ))}
              {!state.businessPolicy.driverMayReorder && (
                <Text style={ui.muted}>
                  El reordenamiento por el chofer continúa en revisión.
                </Text>
              )}
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
