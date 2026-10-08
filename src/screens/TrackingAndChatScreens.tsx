import { useIsFocused } from "@react-navigation/native";
import { BottomSheet } from "../components/overlay/OverlayPortal";
import { ListItem, StatusChip } from "../components/presentation";
import { useReducedMotion } from "../design-system/MotionProvider";
import { colors } from "../components/ui";
import { useEffect, useRef, useState } from "react";
import {
  Linking,
  FlatList,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Page } from "../components/Page";
import {
  Badge,
  Body,
  Button,
  Card,
  Empty,
  Field,
  Title,
  useAction,
} from "../components/ui";
import RouteMap from "../components/RouteMap";
import { HandoffCodeSheet } from "../components/HandoffCard";
import { useApp } from "../store/AppProvider";
import { visibleOrders } from "../domain/repository";
import { pickupStatuses, type Order } from "../domain/models";
import { facilities } from "../domain/catalog";
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
  if (!o)
    return (
      <Page>
        <Empty text="Solicitud no disponible." />
      </Page>
    );
  const destination = destinationFor(o),
    d = state.driver;
  const code = o.handoffs.find((h) => h.id === codeId && h.status === "ACTIVE");
  const active = ["HEADING_TO_PICKUP", "OUT_FOR_DELIVERY"].includes(o.status);
  const origin = {
    latitude:
      d.currentLat +
      (destination.latitude - d.currentLat) * (active ? progress : 0),
    longitude:
      d.currentLng +
      (destination.longitude - d.currentLng) * (active ? progress : 0),
  };
  return (
    <Page
      scroll={false}
      footer={
        <>
          <Button
            label="Abrir chat con el chofer"
            icon="chatbubble-outline"
            onPress={() => navigation.navigate("Chat", { orderId: o.id })}
          />
          <Button
            label="Volver al detalle"
            secondary
            onPress={() =>
              navigation.navigate("ClientOrderDetail", { orderId: o.id })
            }
          />
        </>
      }
    >
      <StatusChip status={o.status} />
      <RouteMap
        height={Math.max(230, Math.min(420, height * 0.43))}
        origin={origin}
        destination={destination}
      />
      <Badge>Posición y ruta simuladas · Demo</Badge>
      <ListItem
        title={o.id}
        subtitle={destination.addressFull}
        icon="car-outline"
        onPress={() => setDetails(true)}
      />
      <BottomSheet
        title="Tu seguimiento"
        visible={details}
        onClose={() => setDetails(false)}
      >
        <Title>{o.assignedDriverName ?? "Chofer por asignar"}</Title>
        <Body>{o.assignedDriverVehicle}</Body>
        <Badge>{o.assignedDriverPlate}</Badge>
        <Body>
          {active
            ? "Tu chofer está en camino."
            : "El tramo de seguimiento aún no está en camino."}
        </Body>
        <Body muted>
          La línea representa el recorrido de demostración. No corresponde a una
          ruta vial calculada ni a GPS en tiempo real.
        </Body>
        {o.handoffs
          .filter((h) => h.status === "ACTIVE")
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
export function DriverMapScreen({ route }: ScreenProps<"DriverMap">) {
  const navigation = useLaundryNavigation();
  const { state } = useApp();
  const o = visibleOrders(state).find((o) => o.id === route.params.orderId);
  const a = useAction(),
    { height } = useWindowDimensions();
  if (!o)
    return (
      <Page>
        <Empty text="Servicio no disponible." />
      </Page>
    );
  const destination = destinationFor(o),
    d = state.driver;
  return (
    <Page>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <RouteMap
          height={Math.max(230, Math.min(420, height * 0.45))}
          origin={{ latitude: d.currentLat, longitude: d.currentLng }}
          destination={destination}
        />
      </Card>
      <Card>
        <Title>{o.id}</Title>
        <StatusChip status={o.status} />
        <Body>{destination.addressFull}</Body>
        <Badge>Mapa de posición y ruta demo</Badge>
        <Body muted>
          Elige una aplicación de navegación para calcular el recorrido real.
        </Body>
        {a.feedback}
        <Button
          label="Navegar con Google Maps"
          busy={a.busy}
          icon="navigate-outline"
          onPress={() => {
            void a.asyncRun(() =>
              Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`,
              ),
            );
          }}
        />
        <Button
          label="Navegar con Waze"
          busy={a.busy}
          secondary
          onPress={() => {
            void a.asyncRun(() =>
              Linking.openURL(
                `https://waze.com/ul?ll=${destination.latitude},${destination.longitude}&navigate=yes`,
              ),
            );
          }}
        />
        <Button
          label="Abrir chat con el cliente"
          secondary
          icon="chatbubble-outline"
          onPress={() => navigation.navigate("Chat", { orderId: o.id })}
        />
      </Card>
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
  const recipient =
    state.session?.role === "CLIENT" ? o.assignedDriverName : o.customerName;
  return (
    <Page scroll={false}>
      <View>
        <Title>{recipient ?? "Chat de solicitud"}</Title>
        <Body muted>{o.id} · Mensajes locales de demostración</Body>
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
