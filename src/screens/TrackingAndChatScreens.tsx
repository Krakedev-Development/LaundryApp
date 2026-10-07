import { useEffect, useRef, useState } from "react";
import { Linking, ScrollView, Text, View } from "react-native";
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
  useAction,
} from "../components/ui";
import RouteMap from "../components/RouteMap";
import { HandoffCard } from "../components/HandoffCard";
import { useApp } from "../store/AppProvider";
import { visibleOrders } from "../domain/repository";
import { pickupStatuses, statusLabels, type Order } from "../domain/models";
import { facilities } from "../domain/catalog";
import type { ScreenProps } from "../navigation/routes";

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
export function TrackingScreen({
  navigation,
  route,
}: ScreenProps<"ClientTracking">) {
  const { state } = useApp();
  const o = visibleOrders(state).find((o) => o.id === route.params.orderId);
  const [progress, setProgress] = useState(0.05);
  useEffect(() => {
    const interval = setInterval(
      () => setProgress((p) => (p > 0.75 ? 0.05 : p + 0.01)),
      1500,
    );
    return () => clearInterval(interval);
  }, []);
  if (!o)
    return (
      <Page>
        <Empty text="Solicitud no disponible." />
      </Page>
    );
  const destination = destinationFor(o),
    d = state.driver;
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
    <Page>
      <Badge>{statusLabels[o.status]}</Badge>
      <Card>
        <Title>{o.id}</Title>
        <Body>{destination.addressFull}</Body>
        <Badge>Posición y ruta simuladas · Demo</Badge>
        <RouteMap origin={origin} destination={destination} />
        <Body muted>
          La línea representa el recorrido de demostración. No corresponde a una
          ruta vial calculada ni a GPS en tiempo real.
        </Body>
      </Card>
      <Card>
        <Icon name="car-outline" />
        <Title>{o.assignedDriverName ?? "Chofer por asignar"}</Title>
        <Body>{o.assignedDriverVehicle}</Body>
        <Badge>{o.assignedDriverPlate}</Badge>
        <Body muted>
          {active
            ? "Tu chofer está en camino."
            : "El tramo de seguimiento aún no está en camino."}
        </Body>
        <Button
          label="Abrir chat con el chofer"
          icon="chatbubble-outline"
          onPress={() => navigation.navigate("Chat", { orderId: o.id })}
        />
      </Card>
      {o.handoffs
        .filter((h) => h.status === "ACTIVE")
        .map((h) => (
          <HandoffCard key={h.id} handoff={h} />
        ))}
      <Button
        label="Volver al detalle"
        secondary
        onPress={() =>
          navigation.navigate("ClientOrderDetail", { orderId: o.id })
        }
      />
    </Page>
  );
}
export function DriverMapScreen({
  navigation,
  route,
}: ScreenProps<"DriverMap">) {
  const { state } = useApp();
  const o = visibleOrders(state).find((o) => o.id === route.params.orderId);
  const a = useAction();
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
      <Card>
        <Title>{o.id}</Title>
        <Badge>{statusLabels[o.status]}</Badge>
        <Body>{destination.addressFull}</Body>
        <RouteMap
          origin={{ latitude: d.currentLat, longitude: d.currentLng }}
          destination={destination}
        />
        <Badge>Mapa de posición y ruta demo</Badge>
        <Body muted>
          Elige una aplicación de navegación para calcular el recorrido real.
        </Body>
        {a.feedback}
        <Button
          label="Navegar con Google Maps"
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
  const list = useRef<ScrollView>(null);
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
      <ScrollView
        ref={list}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
        onContentSizeChange={() =>
          list.current?.scrollToEnd({ animated: true })
        }
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg) => {
          const mine = msg.senderId === state.session?.id;
          return (
            <View
              key={msg.id}
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "88%",
                padding: 13,
                borderRadius: 12,
                backgroundColor: mine ? "#143F73" : "#E8EEF5",
                gap: 5,
              }}
            >
              <Text
                style={{ fontSize: 11, color: mine ? "#E8EEF5" : "#64748B" }}
              >
                {mine ? "Tú" : msg.senderName}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 22,
                  color: mine ? "#FFF" : "#0F172A",
                }}
              >
                {msg.text}
              </Text>
              <Text
                style={{ fontSize: 10, color: mine ? "#E8EEF5" : "#64748B" }}
              >
                {msg.timestamp}
              </Text>
            </View>
          );
        })}
        {!messages.length && (
          <Body muted>Inicia una conversación sobre este pedido.</Body>
        )}
      </ScrollView>
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
