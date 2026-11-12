import { isCustomerHandoff } from "../domain/customerHandoffs";
import { useIsFocused } from "@react-navigation/native";
import { BottomSheet } from "../components/overlay/OverlayPortal";
import { ListItem, StatusChip } from "../components/presentation";
import { useReducedMotion } from "../design-system/MotionProvider";
import { contentColors as colors } from "../components/ui";
import { useEffect, useRef, useState } from "react";
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
import { useApp } from "../store/AppProvider";
import { visibleOrders } from "../domain/repository";
import { pickupStatuses, type Order, type OrderStatus } from "../domain/models";
import { facilities } from "../domain/catalog";
import {
  orderService,
  buildSimulatedTracking,
  formatOrderCode,
  type OrderTrackingDto,
} from "../services/orders/orderService";
import type { ScreenProps } from "../navigation/routes";
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";
function destinationFor(order: Order) {
  if (["PICKED_UP", "HEADING_TO_FACILITY"].includes(order.status)) {
    const f =
      facilities.find((f) => f.name === order.facilityName) ?? facilities[0];
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
  const o = visibleOrders(state).find((o) => o.id === route.params.orderId);
  const focused = useIsFocused(),
    reduced = useReducedMotion(),
    { height } = useWindowDimensions();
  const [details, setDetails] = useState(false);
  const [codeId, setCodeId] = useState<string>();
  const [progress, setProgress] = useState(0.05);
  const [liveTracking, setLiveTracking] = useState<OrderTrackingDto | null>(null);

  useEffect(() => {
    let active = true;
    const fetchTracking = async () => {
      try {
        const result = await orderService.getOrderTracking(route.params.orderId);
        if (active && result) {
          setLiveTracking(result);
        }
      } catch {
        if (active && o && !liveTracking) {
          setLiveTracking(buildSimulatedTracking(o));
        }
      }
    };

    void fetchTracking();

    if (!focused) return;
    const interval = setInterval(() => {
      void fetchTracking();
    }, 7000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [focused, route.params.orderId, o?.id]);

  useEffect(() => {
    if (
      !focused ||
      reduced ||
      !o ||
      !["HEADING_TO_PICKUP", "OUT_FOR_DELIVERY"].includes(o.status)
    )
      return;
    const interval = setInterval(
      () => setProgress((p) => (p > 0.75 ? 0.05 : p + 0.01)),
      1500,
    );
    return () => clearInterval(interval);
  }, [focused, reduced, o?.status]);

  const trackingData = liveTracking ?? (o ? buildSimulatedTracking(o) : null);
  if (!trackingData && !o) {
    return (
      <Page>
        <Empty text="Solicitud no disponible." />
      </Page>
    );
  }

  const effectiveStatus = (trackingData?.status ?? o?.status ?? "CONFIRMED") as OrderStatus;
  const isEnRoute = [
    "HEADING_TO_PICKUP",
    "OUT_FOR_DELIVERY",
    "CONFIRMED",
    "PICKUP_ASSIGNED",
    "DELIVERY_ASSIGNED",
  ].includes(effectiveStatus);

  const assignedDriver = trackingData?.assignedDriver;
  const hasDriverLocation = !!(
    assignedDriver &&
    assignedDriver.latitude !== null &&
    assignedDriver.longitude !== null
  );

  const destination = trackingData
    ? {
        latitude: trackingData.customerAddress.latitude,
        longitude: trackingData.customerAddress.longitude,
        addressFull: trackingData.customerAddress.text,
      }
    : destinationFor(o!);

  const facility = trackingData?.facility;

  const origin = hasDriverLocation
    ? {
        latitude: assignedDriver!.latitude!,
        longitude: assignedDriver!.longitude!,
      }
    : {
        latitude:
          (facility?.latitude ?? destination.latitude) +
          (destination.latitude - (facility?.latitude ?? destination.latitude)) *
            (isEnRoute ? progress : 0),
        longitude:
          (facility?.longitude ?? destination.longitude) +
          (destination.longitude - (facility?.longitude ?? destination.longitude)) *
            (isEnRoute ? progress : 0),
      };

  const code = o?.handoffs.find((h) => h.id === codeId && h.status === "ACTIVE");
  const displayCode = trackingData
    ? formatOrderCode({
        id: trackingData.orderId,
        number: trackingData.orderNumber,
      })
    : o!.id;

  return (
    <Page
      scroll={false}
      footer={
        <>
          <Button
            label="Abrir chat con el chofer"
            icon="chatbubble-outline"
            onPress={() =>
              navigation.navigate("Chat", { orderId: route.params.orderId })
            }
          />
          <Button
            label="Volver al detalle"
            secondary
            onPress={() =>
              navigation.navigate("ClientOrderDetail", {
                orderId: route.params.orderId,
              })
            }
          />
        </>
      }
    >
      <StatusChip status={effectiveStatus} />
      <RouteMap
        height={Math.max(220, Math.min(380, height * 0.38))}
        origin={origin}
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
        isSearching={!assignedDriver}
      />

      {/* Real-time Driver Radar Card */}
      {assignedDriver ? (
        <View style={radarStyles.card}>
          <View style={radarStyles.cardHeader}>
            <View style={radarStyles.statusPill}>
              <View style={radarStyles.greenDot} />
              <Text style={radarStyles.statusPillText}>
                {assignedDriver.status === "ON_SERVICE"
                  ? "Chofer en servicio activo"
                  : "Chofer asignado"}
              </Text>
            </View>
            <Text style={radarStyles.signalText}>
              {assignedDriver.locationAt
                ? `GPS: ${new Date(assignedDriver.locationAt).toLocaleTimeString()}`
                : "Señal activa · Guayaquil"}
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
                {assignedDriver.plate ?? "GSE-1234"}
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
      ) : (
        <View style={radarStyles.searchingCard}>
          <View style={radarStyles.cardHeader}>
            <View style={radarStyles.searchingPill}>
              <View style={radarStyles.yellowDot} />
              <Text style={radarStyles.searchingPillText}>
                Radar de asignación
              </Text>
            </View>
            <Text style={radarStyles.signalText}>Guayaquil Central</Text>
          </View>
          <View style={{ gap: 4, paddingVertical: 2 }}>
            <Text style={radarStyles.searchingTitle}>
              Buscando chofer en ruta...
            </Text>
            <Text style={radarStyles.searchingSubtitle}>
              Tu orden está procesándose en {facility?.name ?? "Sede Central"}. En cuanto un chofer sea asignado, verás su avance en el radar táctico.
            </Text>
          </View>
        </View>
      )}

      <ListItem
        title={displayCode}
        subtitle={destination.addressFull}
        icon="car-outline"
        onPress={() => setDetails(true)}
      />
      <BottomSheet
        title="Tu seguimiento"
        visible={details}
        onClose={() => setDetails(false)}
      >
        <Title>{assignedDriver?.name ?? o?.assignedDriverName ?? "Chofer por asignar"}</Title>
        <Body>{assignedDriver?.vehicle ?? o?.assignedDriverVehicle ?? "Vehículo de planta"}</Body>
        <Badge>{assignedDriver?.plate ?? o?.assignedDriverPlate ?? "Sede Central"}</Badge>
        <Body>
          {isEnRoute
            ? "Tu servicio está en curso sobre la ruta de Guayaquil."
            : "El tramo de seguimiento aún no está en camino."}
        </Body>
        <Body muted>
          El radar táctico muestra la posición sincronizada con el backend y la sede de operaciones.
        </Body>
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
  const o = visibleOrders(state).find((o) => o.id === route.params.orderId);
  const a = useAction();
  const [text, setText] = useState("");
  const list = useRef<FlatList>(null),
    reduced = useReducedMotion();
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
});
