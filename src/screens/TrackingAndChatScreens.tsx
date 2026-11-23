import { isCustomerHandoff } from "../domain/customerHandoffs";
import { useIsFocused } from "@react-navigation/native";
import { BottomSheet } from "../components/overlay/OverlayPortal";
import { ListItem, StatusChip } from "../components/presentation";
import { useReducedMotion } from "../design-system/MotionProvider";
import { contentColors as colors } from "../components/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Page } from "../components/Page";
import {
  Badge,
  Body,
  Button,
  Empty,
  Field,
  Title,
  useAction,
} from "../components/ui";
import RouteMap from "../components/RouteMap";
import { HandoffCodeSheet } from "../components/HandoffCard";
import { ServerHandoffCode } from "../components/ServerHandoffCode";
import { useApp } from "../store/AppProvider";
import { visibleOrders } from "../domain/repository";
import { pickupStatuses, type Order, type OrderStatus } from "../domain/models";
import { facilities } from "../domain/catalog";
import {
  orderService,
  buildSimulatedTracking,
  formatOrderCode,
  isUuid,
  type OrderTrackingDto,
} from "../services/orders/orderService";
import {
  fetchDrivingRoute,
  formatRouteEta,
  type DrivingRouteResult,
} from "../services/maps/routingService";
import { clientSocketService } from "../services/realtime/clientSocketService";
import {
  evaluateRouteProgress,
  isHeadingReliable,
  OFF_ROUTE_CONFIRM_MS,
  resolveRouteMarkerPlacement,
  type MapRoutePoint,
} from "../utils/routeDeviation";
import {
  handoffTypeForTrackingStatus,
  isCustomerLiveTrackingStatus,
  isFresherObservation,
  liveTrackingLegForStatus,
  parseDriverLocationFromSocketPayload,
  parseObservedAt,
  trackingBannerForStatus,
  type LiveDriverFix,
} from "../utils/orderTracking";
import type { ScreenProps } from "../navigation/routes";
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";

const ROUTE_REFRESH_MIN_MS = 20_000;
const DEVIATION_REFETCH_MIN_MS = 5_000;
const FALLBACK_POLL_MS = 30_000;
const DRIVER_LOCATION_STALE_MS = 15_000;

interface OrderStatusSocketEvent {
  orderId?: string;
  status?: string;
  activeLeg?: "INBOUND" | "OUTBOUND" | null;
  updatedAt?: string;
}

interface OrderEtaSocketEvent {
  orderId?: string;
  etaMinutes?: number;
  distanceMeters?: number;
  durationSeconds?: number;
  updatedAt?: string;
}

function destinationFor(order: Order) {
  if (["PICKED_UP", "HEADING_TO_FACILITY"].includes(order.status)) {
    const f =
      facilities.find((fac) => fac.name === order.facilityName) ?? facilities[0];
    return {
      latitude: f.latitude,
      longitude: f.longitude,
      addressFull: f.address,
    };
  }
  return pickupStatuses.includes(order.status)
    ? order.fulfillmentPlan.inbound
    : order.fulfillmentPlan.outbound;
}

export function TrackingScreen({ route }: ScreenProps<"ClientTracking">) {
  const navigation = useLaundryNavigation();
  const { state } = useApp();
  const orderId = route.params.orderId;
  const o = visibleOrders(state).find((item) => item.id === orderId);
  const focused = useIsFocused();
  const { height } = useWindowDimensions();

  const [details, setDetails] = useState(false);
  const [showHandoffSheet, setShowHandoffSheet] = useState(false);
  const [codeId, setCodeId] = useState<string>();
  const [liveTracking, setLiveTracking] = useState<OrderTrackingDto | null>(null);
  const [driverFix, setDriverFix] = useState<LiveDriverFix | null>(null);
  const [routePoints, setRoutePoints] = useState<MapRoutePoint[]>([]);
  const [routeMeta, setRouteMeta] = useState<{
    distanceMeters: number;
    durationSeconds: number;
  } | null>(null);
  const [routeAnchorVersion, setRouteAnchorVersion] = useState(0);
  const [offRouteTick, setOffRouteTick] = useState(0);

  const mountedRef = useRef(true);
  const driverFixRef = useRef<LiveDriverFix | null>(null);
  driverFixRef.current = driverFix;
  const lastWsLocationAtRef = useRef(0);
  const lastEtaObservedAtRef = useRef(0);
  const lastRouteFetchAtRef = useRef(0);
  const routePointsRef = useRef<MapRoutePoint[]>([]);
  routePointsRef.current = routePoints;
  const routeAnchoredRef = useRef<{ status: string; isRealRoute: boolean } | null>(null);
  const offRouteStreakRef = useRef(0);
  const offRouteSinceRef = useRef<number | null>(null);
  const lastRouteProgressAtRef = useRef(Date.now());
  const lastDeviationFetchAtRef = useRef(0);
  const offRouteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLegRef = useRef<"INBOUND" | "OUTBOUND" | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (offRouteTimerRef.current) clearTimeout(offRouteTimerRef.current);
    };
  }, []);

  const clearOffRouteTimer = useCallback(() => {
    offRouteSinceRef.current = null;
    if (offRouteTimerRef.current) {
      clearTimeout(offRouteTimerRef.current);
      offRouteTimerRef.current = null;
    }
  }, []);

  const scheduleOffRouteRecheck = useCallback((delayMs: number) => {
    if (offRouteTimerRef.current) return;
    offRouteTimerRef.current = setTimeout(() => {
      offRouteTimerRef.current = null;
      if (mountedRef.current) setOffRouteTick((t) => t + 1);
    }, Math.max(0, delayMs));
  }, []);

  const resetTrackingGeometry = useCallback(() => {
    setRoutePoints([]);
    setRouteMeta(null);
    routeAnchoredRef.current = null;
    offRouteStreakRef.current = 0;
    clearOffRouteTimer();
    setRouteAnchorVersion((v) => v + 1);
  }, [clearOffRouteTimer]);

  const refreshTrackingSnapshot = useCallback(async () => {
    try {
      const result = await orderService.getOrderTracking(orderId);
      if (!mountedRef.current || !result) return;
      setLiveTracking(result);

      const nextLeg = liveTrackingLegForStatus(result.status);
      if (lastLegRef.current && nextLeg !== lastLegRef.current) {
        setDriverFix(null);
        resetTrackingGeometry();
      }
      lastLegRef.current = nextLeg;

      if (!isCustomerLiveTrackingStatus(result.status)) {
        setDriverFix(null);
        resetTrackingGeometry();
        return;
      }

      const d = result.assignedDriver;
      if (
        d &&
        d.latitude !== null &&
        d.longitude !== null &&
        Date.now() - lastWsLocationAtRef.current >= DRIVER_LOCATION_STALE_MS
      ) {
        setDriverFix({
          latitude: d.latitude,
          longitude: d.longitude,
          heading: d.heading ?? null,
          speed: d.speed ?? null,
          locationAt: d.locationAt,
        });
      }
    } catch {
      if (mountedRef.current && o && !liveTracking) {
        setLiveTracking(buildSimulatedTracking(o));
      }
    }
  }, [orderId, o, liveTracking, resetTrackingGeometry]);

  const trackingData = liveTracking ?? (o ? buildSimulatedTracking(o) : null);
  const effectiveStatus = (trackingData?.status ?? o?.status ?? "CONFIRMED") as OrderStatus;
  const isLiveTracking = isCustomerLiveTrackingStatus(effectiveStatus);
  const activeLeg = liveTrackingLegForStatus(effectiveStatus);
  const assignedDriver = trackingData?.assignedDriver ?? null;

  const destination = useMemo(() => {
    if (trackingData) {
      return {
        latitude: trackingData.customerAddress.latitude,
        longitude: trackingData.customerAddress.longitude,
        addressFull: trackingData.customerAddress.text,
      };
    }
    return o ? destinationFor(o) : null;
  }, [trackingData, o]);

  const fetchRouteFromServer = useCallback(
    async (force = false) => {
      if (!mountedRef.current || !isLiveTracking || !destination) return;
      const fix = driverFixRef.current;
      if (!fix) return;

      const anchor = routeAnchoredRef.current;
      if (!force && anchor?.isRealRoute && anchor.status === effectiveStatus) return;

      const now = Date.now();
      if (!force && now - lastRouteFetchAtRef.current < ROUTE_REFRESH_MIN_MS) return;
      lastRouteFetchAtRef.current = now;

      let resolved: DrivingRouteResult | null = null;
      if (isUuid(orderId)) {
        try {
          const response = await orderService.getOrderRoute(orderId, {
            driverLat: fix.latitude,
            driverLng: fix.longitude,
            ...(isHeadingReliable(fix.heading, fix.speed)
              ? { driverHeading: fix.heading }
              : {}),
          });
          const coords = response.data?.geometry?.coordinates;
          if (response.success && response.data && Array.isArray(coords) && coords.length >= 2) {
            resolved = {
              distanceMeters: response.data.distanceMeters,
              durationSeconds: response.data.durationSeconds,
              coordinates: coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng })),
              isFallback: Boolean(response.data.isFallback),
            };
          }
        } catch {
          // Si falla el backend de ruta, usar fallback cliente OSRM/Haversine.
        }
      }

      if (!resolved) {
        resolved = await fetchDrivingRoute(
          { latitude: fix.latitude, longitude: fix.longitude },
          { latitude: destination.latitude, longitude: destination.longitude },
        );
      }

      if (!mountedRef.current || !resolved) return;
      setRoutePoints(resolved.coordinates);
      setRouteMeta({
        distanceMeters: resolved.distanceMeters,
        durationSeconds: resolved.durationSeconds,
      });
      routeAnchoredRef.current = {
        status: effectiveStatus,
        isRealRoute: !resolved.isFallback && resolved.coordinates.length >= 2,
      };
      offRouteStreakRef.current = 0;
      clearOffRouteTimer();
      lastRouteProgressAtRef.current = Date.now();
      setRouteAnchorVersion((v) => v + 1);
    },
    [orderId, isLiveTracking, destination, effectiveStatus, clearOffRouteTimer],
  );

  // Suscripción WebSocket en tiempo real mientras la pantalla está enfocada.
  useEffect(() => {
    if (!focused) return;

    void clientSocketService.connect();
    if (isUuid(orderId)) {
      clientSocketService.subscribeOrder(orderId);
    }

    const handleAuthenticated = () => {
      if (isUuid(orderId)) clientSocketService.subscribeOrder(orderId);
      void refreshTrackingSnapshot();
    };

    const handleDriverLocation = (raw: unknown) => {
      const payload = raw as { orderId?: string };
      if (payload?.orderId && payload.orderId !== orderId) return;
      const parsed = parseDriverLocationFromSocketPayload(
        raw as Parameters<typeof parseDriverLocationFromSocketPayload>[0],
      );
      if (!parsed || !mountedRef.current) return;
      lastWsLocationAtRef.current = Date.now();
      setDriverFix(parsed);
    };

    const handleStatusChanged = (raw: unknown) => {
      const payload = raw as OrderStatusSocketEvent;
      if (payload?.orderId !== orderId || !payload.status || !mountedRef.current) return;
      const nextStatus = payload.status;
      const nextLeg = liveTrackingLegForStatus(nextStatus);
      setLiveTracking((prev) =>
        prev
          ? {
              ...prev,
              status: nextStatus,
              activeLeg: nextLeg,
              isLiveTrackingActive: isCustomerLiveTrackingStatus(nextStatus),
            }
          : prev,
      );
      if (!isCustomerLiveTrackingStatus(nextStatus) || nextLeg !== lastLegRef.current) {
        setDriverFix(null);
        resetTrackingGeometry();
      }
      lastLegRef.current = nextLeg;
      void refreshTrackingSnapshot();
    };

    const handleEtaUpdated = (raw: unknown) => {
      const payload = raw as OrderEtaSocketEvent;
      if (payload?.orderId !== orderId || !mountedRef.current) return;
      const observedAt = parseObservedAt(payload.updatedAt, Date.now());
      if (!isFresherObservation(observedAt, lastEtaObservedAtRef.current)) return;
      lastEtaObservedAtRef.current = observedAt;
      if (
        typeof payload.distanceMeters === "number" &&
        typeof payload.durationSeconds === "number"
      ) {
        setRouteMeta({
          distanceMeters: payload.distanceMeters,
          durationSeconds: payload.durationSeconds,
        });
      }
    };

    clientSocketService.on("authenticated", handleAuthenticated);
    clientSocketService.on("driver:location:updated", handleDriverLocation);
    clientSocketService.on("order:status:changed", handleStatusChanged);
    clientSocketService.on("order:driver_arrived", handleStatusChanged);
    clientSocketService.on("order:eta:updated", handleEtaUpdated);

    return () => {
      clientSocketService.off("authenticated", handleAuthenticated);
      clientSocketService.off("driver:location:updated", handleDriverLocation);
      clientSocketService.off("order:status:changed", handleStatusChanged);
      clientSocketService.off("order:driver_arrived", handleStatusChanged);
      clientSocketService.off("order:eta:updated", handleEtaUpdated);
      if (isUuid(orderId)) {
        clientSocketService.unsubscribeOrder(orderId);
      }
    };
  }, [focused, orderId, refreshTrackingSnapshot, resetTrackingGeometry]);

  // Carga inicial + polling de respaldo cada 30 s (ETA + fallback GPS si WS >= 15 s sin señal).
  useEffect(() => {
    void refreshTrackingSnapshot();
    if (!focused) return;

    const pollFallback = async () => {
      await refreshTrackingSnapshot();
      if (!isLiveTracking || !isUuid(orderId)) return;
      try {
        const etaRes = await orderService.getOrderEta(orderId);
        const data = etaRes.data;
        if (!mountedRef.current || !etaRes.success || !data) return;
        const now = Date.now();
        if (
          typeof data.distanceMeters === "number" &&
          typeof data.durationSeconds === "number" &&
          isFresherObservation(now, lastEtaObservedAtRef.current)
        ) {
          lastEtaObservedAtRef.current = now;
          setRouteMeta({
            distanceMeters: data.distanceMeters,
            durationSeconds: data.durationSeconds,
          });
        }
        if (
          data.driverLocation &&
          Date.now() - lastWsLocationAtRef.current >= DRIVER_LOCATION_STALE_MS
        ) {
          setDriverFix({
            latitude: data.driverLocation.lat,
            longitude: data.driverLocation.lng,
            heading: data.driverLocation.heading ?? null,
            speed: data.driverLocation.speed ?? null,
            locationAt: data.driverLocation.locationAt,
          });
        }
      } catch {
        // Silencioso: WebSocket cubre el flujo principal.
      }
    };

    const interval = setInterval(() => {
      void pollFallback();
    }, FALLBACK_POLL_MS);

    return () => clearInterval(interval);
  }, [focused, orderId, isLiveTracking, refreshTrackingSnapshot]);

  // Snapping del chofer sobre la polilínea + recorte de ruta + detección de desvío.
  useEffect(() => {
    if (!isLiveTracking || !driverFix) return;
    const anchor = routeAnchoredRef.current;
    if (!anchor?.isRealRoute || anchor.status !== effectiveStatus) {
      void fetchRouteFromServer(false);
      return;
    }

    const now = Date.now();
    const decision = evaluateRouteProgress({
      route: routePointsRef.current,
      location: driverFix,
      offRouteStreak: offRouteStreakRef.current,
      elapsedSinceProgressMs: now - lastRouteProgressAtRef.current,
      offRouteElapsedMs:
        offRouteSinceRef.current == null ? 0 : now - offRouteSinceRef.current,
    });
    if (!decision) return;
    offRouteStreakRef.current = decision.offRouteStreak;

    if (decision.kind === "on_route") {
      clearOffRouteTimer();
      lastRouteProgressAtRef.current = now;
      setRoutePoints(decision.trimmedRoute);
      return;
    }

    if (decision.kind === "off_route_pending") {
      offRouteSinceRef.current ??= now;
      scheduleOffRouteRecheck(
        OFF_ROUTE_CONFIRM_MS - (now - offRouteSinceRef.current),
      );
      return;
    }

    const sinceLastDeviation = now - lastDeviationFetchAtRef.current;
    if (sinceLastDeviation < DEVIATION_REFETCH_MIN_MS) {
      scheduleOffRouteRecheck(DEVIATION_REFETCH_MIN_MS - sinceLastDeviation);
      return;
    }
    lastDeviationFetchAtRef.current = now;
    void fetchRouteFromServer(true);
  }, [
    driverFix,
    isLiveTracking,
    effectiveStatus,
    fetchRouteFromServer,
    clearOffRouteTimer,
    scheduleOffRouteRecheck,
    offRouteTick,
  ]);

  const driverRouteMatch = useMemo(() => {
    const anchor = routeAnchoredRef.current;
    if (!driverFix || !isLiveTracking) return null;
    if (
      routeAnchorVersion === 0 ||
      !anchor?.isRealRoute ||
      anchor.status !== effectiveStatus
    ) {
      return null;
    }
    return resolveRouteMarkerPlacement({
      route: routePointsRef.current,
      location: driverFix,
      offRouteStreak: offRouteStreakRef.current,
      elapsedSinceProgressMs: Date.now() - lastRouteProgressAtRef.current,
      offRouteElapsedMs:
        offRouteSinceRef.current == null
          ? 0
          : Date.now() - offRouteSinceRef.current,
    });
  }, [driverFix, isLiveTracking, effectiveStatus, routeAnchorVersion, offRouteTick]);

  if (!trackingData && !o) {
    return (
      <Page>
        <Empty text="Solicitud no disponible." />
      </Page>
    );
  }

  const banner = trackingBannerForStatus(effectiveStatus);
  const handoffType = handoffTypeForTrackingStatus(effectiveStatus);
  const canShowServerHandoff = Boolean(handoffType && isUuid(orderId));
  const facility = trackingData?.facility;
  const hasRealDriverCoords = driverFix !== null;
  const displayedDriverPoint =
    driverRouteMatch && driverRouteMatch.kind !== "off_route"
      ? driverRouteMatch.point
      : driverFix;
  const displayedDriverBearing =
    driverRouteMatch?.kind === "on_route"
      ? driverRouteMatch.bearing
      : (driverFix?.heading ?? null);

  const code = o?.handoffs.find((h) => h.id === codeId && h.status === "ACTIVE");
  const displayCode = trackingData
    ? formatOrderCode({
        id: trackingData.orderId,
        number: trackingData.orderNumber,
      })
    : o!.id;

  const arrivedAtDoor =
    effectiveStatus === "ARRIVED_FOR_PICKUP" ||
    effectiveStatus === "ARRIVED_FOR_DELIVERY";

  return (
    <Page
      scroll={false}
      footer={
        <>
          {handoffType ? (
            <Button
              label={
                effectiveStatus === "ARRIVED_FOR_PICKUP" ||
                effectiveStatus === "HEADING_TO_PICKUP"
                  ? "Mostrar código PIN / QR de recogida"
                  : "Mostrar código PIN / QR de entrega"
              }
              icon="qr-code-outline"
              onPress={() => {
                if (canShowServerHandoff) {
                  setShowHandoffSheet(true);
                } else {
                  navigation.navigate("ClientOrderDetail", { orderId });
                }
              }}
            />
          ) : null}
          <Button
            label="Abrir chat con el chofer"
            icon="chatbubble-outline"
            onPress={() => navigation.navigate("Chat", { orderId })}
          />
          <Button
            label="Volver al detalle"
            secondary
            onPress={() =>
              navigation.navigate("ClientOrderDetail", { orderId })
            }
          />
        </>
      }
    >
      <StatusChip status={effectiveStatus} />

      {isLiveTracking && destination ? (
        hasRealDriverCoords && displayedDriverPoint ? (
          <RouteMap
            height={Math.max(220, Math.min(360, height * 0.36))}
            origin={displayedDriverPoint}
            destination={destination}
            facility={facility}
            driverInfo={
              assignedDriver
                ? {
                    name: assignedDriver.name,
                    vehicle: assignedDriver.vehicle ?? undefined,
                    plate: assignedDriver.plate ?? undefined,
                    status: assignedDriver.status,
                  }
                : null
            }
            driverBearing={displayedDriverBearing}
            isSearching={!assignedDriver}
            routeCoordinates={routePoints.length >= 2 ? routePoints : undefined}
          />
        ) : (
          <View style={radarStyles.awaitingMapBox}>
            <Ionicons name="navigate-outline" size={28} color="#38BDF8" />
            <Text style={radarStyles.awaitingMapTitle}>{banner.title}</Text>
            <Text style={radarStyles.awaitingMapSubtitle}>
              {assignedDriver
                ? "Esperando señal GPS en tiempo real del chofer para trazar la ruta hacia tu domicilio."
                : "En cuanto el chofer inicie su recorrido, verás su ubicación en tiempo real en el mapa."}
            </Text>
          </View>
        )
      ) : (
        <View style={radarStyles.pausedMapBox}>
          <Ionicons
            name={
              effectiveStatus === "DELIVERED" || effectiveStatus === "COMPLETED"
                ? "checkmark-circle-outline"
                : "business-outline"
            }
            size={30}
            color="#38BDF8"
          />
          <Text style={radarStyles.awaitingMapTitle}>{banner.title}</Text>
          <Text style={radarStyles.awaitingMapSubtitle}>{banner.subtitle}</Text>
        </View>
      )}

      {isLiveTracking && assignedDriver ? (
        <View style={radarStyles.card}>
          <View style={radarStyles.cardHeader}>
            <View style={radarStyles.statusPill}>
              <View style={radarStyles.greenDot} />
              <Text style={radarStyles.statusPillText}>
                {activeLeg === "OUTBOUND"
                  ? "Chofer en entrega"
                  : "Chofer en recogida"}
              </Text>
            </View>
            <Text style={radarStyles.signalText}>
              {driverFix?.locationAt
                ? `GPS: ${new Date(driverFix.locationAt).toLocaleTimeString()}`
                : "Esperando señal GPS"}
            </Text>
          </View>

          <View style={radarStyles.etaBanner}>
            <Ionicons name="time-outline" size={14} color="#38BDF8" />
            <Text style={radarStyles.etaBannerText}>
              {arrivedAtDoor
                ? `${banner.etaLabel} · Chofer esperando en puerta`
                : routeMeta
                  ? `${banner.etaLabel}: ${formatRouteEta(routeMeta.distanceMeters, routeMeta.durationSeconds)}`
                  : banner.title}
            </Text>
          </View>

          <View style={radarStyles.driverRow}>
            <View style={radarStyles.driverAvatar}>
              <Ionicons name="person" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={radarStyles.driverName}>{assignedDriver.name}</Text>
              <Text style={radarStyles.driverVehicle}>
                {assignedDriver.vehicle ?? "Vehículo utilitario"} ·{" "}
                {assignedDriver.plate ?? "Sin placa"}
              </Text>
            </View>
            {assignedDriver.phone ? (
              <View style={radarStyles.phoneChip}>
                <Ionicons name="call-outline" size={12} color="#38BDF8" />
                <Text style={radarStyles.phoneText}>{assignedDriver.phone}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : isLiveTracking ? (
        <View style={radarStyles.searchingCard}>
          <View style={radarStyles.cardHeader}>
            <View style={radarStyles.searchingPill}>
              <View style={radarStyles.yellowDot} />
              <Text style={radarStyles.searchingPillText}>
                Asignación en curso
              </Text>
            </View>
            <Text style={radarStyles.signalText}>
              {facility?.name ?? "Sede asignada"}
            </Text>
          </View>
          <View style={{ gap: 4, paddingVertical: 2 }}>
            <Text style={radarStyles.searchingTitle}>{banner.title}</Text>
            <Text style={radarStyles.searchingSubtitle}>{banner.subtitle}</Text>
          </View>
        </View>
      ) : null}

      {destination ? (
        <ListItem
          title={displayCode}
          subtitle={destination.addressFull}
          icon="car-outline"
          onPress={() => setDetails(true)}
        />
      ) : null}

      <BottomSheet
        title="Tu seguimiento"
        visible={details}
        onClose={() => setDetails(false)}
      >
        <Title>
          {assignedDriver?.name ?? o?.assignedDriverName ?? "Chofer por asignar"}
        </Title>
        <Body>
          {assignedDriver?.vehicle ??
            o?.assignedDriverVehicle ??
            "Vehículo de planta"}
        </Body>
        <Badge>
          {assignedDriver?.plate ?? o?.assignedDriverPlate ?? "Sede Central"}
        </Badge>
        <Body>{banner.subtitle}</Body>
        {o?.handoffs
          .filter((h) => isCustomerHandoff(h) && h.status === "ACTIVE")
          .map((h) => (
            <ListItem
              key={h.id}
              title={"Mostrar código · " + h.title}
              icon="qr-code-outline"
              onPress={() => {
                setDetails(false);
                setCodeId(h.id);
              }}
            />
          ))}
      </BottomSheet>

      {canShowServerHandoff && handoffType ? (
        <BottomSheet
          title={
            handoffType === "CUSTOMER_TO_DRIVER"
              ? "Código de recogida (PIN / QR)"
              : "Código de entrega (PIN / QR)"
          }
          visible={showHandoffSheet}
          onClose={() => setShowHandoffSheet(false)}
        >
          <ServerHandoffCode
            orderId={orderId}
            type={handoffType}
            title={
              handoffType === "CUSTOMER_TO_DRIVER"
                ? "Entrega de prendas al chofer"
                : "Recepción de prendas limpias"
            }
            description={
              handoffType === "CUSTOMER_TO_DRIVER"
                ? "Muestra el QR o dicta el código de 6 dígitos al chofer al retirar tus prendas."
                : "Muestra el QR o dicta el código de 6 dígitos al chofer al recibir tus prendas."
            }
          />
        </BottomSheet>
      ) : null}

      {code && (
        <HandoffCodeSheet
          handoff={code}
          visible={!!codeId}
          onClose={() => setCodeId(undefined)}
        />
      )}
    </Page>
  );
}

export function ChatScreen({ route }: ScreenProps<"Chat">) {
  const { state, execute } = useApp();
  const o = visibleOrders(state).find((item) => item.id === route.params.orderId);
  const a = useAction();
  const [text, setText] = useState("");
  const list = useRef<FlatList>(null);
  const reduced = useReducedMotion();
  if (!o)
    return (
      <Page>
        <Empty text="Chat no disponible para esta solicitud." />
      </Page>
    );
  const messages = state.chatMessages[o.id] ?? [];
  const recipient = o.assignedDriverName;
  return (
    <Page scroll={false}>
      <View>
        <Title>{recipient ?? "Chat de solicitud"}</Title>
        <Body muted>{o.id} · Mensajes locales</Body>
      </View>
      <FlatList
        ref={list}
        style={{ flex: 1 }}
        data={messages}
        keyExtractor={(msg) => msg.id}
        contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          list.current?.scrollToEnd({ animated: !reduced })
        }
        renderItem={({ item: msg }) => {
          const mine = msg.senderId === state.session?.id;
          return (
            <View
              key={msg.id}
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "88%",
                padding: 13,
                borderRadius: 12,
                backgroundColor: mine ? colors.primary : colors.soft,
                gap: 5,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: mine ? colors.soft : colors.muted,
                }}
              >
                {mine ? "Tú" : msg.senderName}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 22,
                  color: mine ? colors.onPrimary : colors.text,
                }}
              >
                {msg.text}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  color: mine ? colors.soft : colors.muted,
                }}
              >
                {msg.timestamp}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Body muted>Inicia una conversación sobre este pedido.</Body>
        }
      />
      {a.feedback}
      <Field
        label="Escribe un mensaje"
        value={text}
        onChangeText={setText}
        multiline
        maxLength={2000}
      />
      <Button
        label="Enviar mensaje"
        icon="send-outline"
        disabled={!text.trim()}
        onPress={() => {
          if (a.run(() => execute((r) => r.sendChatMessage(o.id, text))))
            setText("");
        }}
      />
    </Page>
  );
}

const radarStyles = StyleSheet.create({
  awaitingMapBox: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 160,
  },
  pausedMapBox: {
    backgroundColor: "#0F172A",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 170,
  },
  awaitingMapTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F8FAFC",
    textAlign: "center",
  },
  awaitingMapSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: "#94A3B8",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 12,
    gap: 10,
    marginVertical: 4,
  },
  searchingCard: {
    backgroundColor: "#0F172A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 12,
    gap: 8,
    marginVertical: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(14, 165, 233, 0.15)",
    borderColor: "rgba(14, 165, 233, 0.35)",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  searchingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(234, 179, 8, 0.15)",
    borderColor: "rgba(234, 179, 8, 0.35)",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#22C55E",
  },
  yellowDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#EAB308",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#38BDF8",
    letterSpacing: 0.2,
  },
  searchingPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FACC15",
    letterSpacing: 0.2,
  },
  signalText: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "500",
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  driverAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#38BDF8",
  },
  driverName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  driverVehicle: {
    fontSize: 11,
    color: "#94A3B8",
  },
  phoneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#334155",
  },
  phoneText: {
    fontSize: 11,
    color: "#38BDF8",
    fontWeight: "600",
  },
  searchingTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  searchingSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    color: "#94A3B8",
  },
  etaBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderColor: "rgba(56, 189, 248, 0.28)",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  etaBannerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E0F2FE",
    letterSpacing: 0.2,
  },
});
