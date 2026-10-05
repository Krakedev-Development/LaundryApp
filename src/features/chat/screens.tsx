import React, { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  AppHeader,
  Badge,
  Button,
  Card,
  Chip,
  ErrorState,
  Field,
  Page,
  ui,
} from "../../components/ui";
import { useApp } from "../../store/AppStore";
import { useAction } from "../../hooks/useAction";
import { activeAssignment, timeLabel } from "../../domain/rules";
import { Colors as C } from "../../theme/colors";

export function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, engine, data, online } = useApp();
  const a = useAction();
  const [text, setText] = useState("");
  let o;
  try {
    o = engine.order(session!, id);
  } catch {
    return (
      <Page>
        <ErrorState text="No tienes acceso a este chat." />
      </Page>
    );
  }
  const assignment = activeAssignment(data, o);
  if (!assignment || (session!.role === "CHOFER" && assignment.driverId !== session!.userId))
    return (
      <Page>
        <ErrorState text="El chat se habilita cuando existe una etapa con chofer asignado." />
      </Page>
    );
  const driver = data.drivers.find((d) => d.id === assignment.driverId)!;
  const role = session!.role;
  const messages = data.messages.filter(
    (m) =>
      m.orderId === id &&
      m.driverId === assignment.driverId &&
      m.customerId === o.customerId,
  );
  const send = (body: string) =>
    a.run(() => {
      engine.sendMessage(session!, id, body, online);
      setText("");
    });
  return (
    <Page
      footer={
        <View style={{ gap: 8 }}>
          <Field
            label="Mensaje"
            placeholder="Escribe un mensaje…"
            value={text}
            onChangeText={setText}
            maxLength={2000}
            multiline
          />
          <Button
            title="Enviar mensaje"
            icon="send-outline"
            busy={a.busy}
            disabled={!text.trim()}
            onPress={() => send(text)}
          />
        </View>
      }
    >
      <AppHeader
        title={role === "CLIENTE" ? driver.name : o.customerName}
        subtitle={`${id} · ${assignment.type === "PICKUP" ? "Recogida" : "Entrega"}`}
        icon="chatbubble-outline"
      />
      <Text style={ui.meta}>La comunicación ocurre dentro de tu pedido.</Text>
      {!!(role === "CHOFER") && (
        <View style={ui.wrap}>
          {[
            "Estoy en camino.",
            "He llegado.",
            "Estoy en la entrada.",
            "Tengo una demora.",
          ].map((msg) => (
            <Chip key={msg} title={msg} onPress={() => send(msg)} />
          ))}
        </View>
      )}
      {messages.map((m) => (
        <Card
          key={m.id}
          style={{
            alignSelf:
              m.senderId === session!.userId ? "flex-end" : "flex-start",
            backgroundColor:
              m.senderId === session!.userId ? C.primarySoft : C.surface,
            maxWidth: "90%",
          }}
        >
          <Text style={ui.body}>{m.text}</Text>
          <Text style={ui.meta}>
            {timeLabel(m.date)} ·{" "}
            {m.senderId === session!.userId
              ? "Tú"
              : m.senderRole === "CHOFER"
                ? driver.name
                : o.customerName}
          </Text>
          {!!(m.syncStatus === "PENDING") && (
            <Badge title="Pendiente de sincronización" tone="warning" />
          )}
        </Card>
      ))}
      {!messages.length && (
        <Text style={ui.muted}>Inicia la conversación con un mensaje.</Text>
      )}
      {!!a.error && <ErrorState text={a.error} />}
    </Page>
  );
}
