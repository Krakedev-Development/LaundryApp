import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import QRCode from "react-native-qrcode-svg";
import {
  businessService,
  currentActor,
  flushBusiness,
  handoffService,
  useBusinessStore,
} from "../../store/useBusinessStore";
import {
  HANDOFF_LABELS,
  type Handoff,
} from "../../services/domain/fulfillment";
import { MODE_LABELS, nextAction } from "../../services/domain/BusinessService";
import type { Verification } from "../../services/domain/HandoffService";
import { Screen, Card, Action, ui } from "./ui";
import { CustomerActions } from "./CustomerActions";
import type { Order } from "../../domain/models";

export function BusinessOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    router = useRouter(),
    state = useBusinessStore((s) => s.state)!;
  const actor = currentActor(),
    raw = state.orders.find((o) => o.id === id);
  const [code, setCode] = useState(""),
    [ticket, setTicket] = useState<Verification>(),
    [scan, setScan] = useState(false),
    [permission, requestPermission] = useCameraPermissions();
  const [count, setCount] = useState(""),
    [recipient, setRecipient] = useState(""),
    [relationship, setRelationship] = useState(""),
    [notes, setNotes] = useState(""),
    [chat, setChat] = useState(""),
    [channel, setChannel] = useState<"DRIVER" | "OPERATIONS">("OPERATIONS"),
    [error, setError] = useState("");
  const run = async (fn: () => unknown) => {
    setError("");
    try {
      const result = fn();
      await flushBusiness();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  };
  if (!raw)
    return (
      <Screen title="Solicitud">
        <Text style={ui.error}>Solicitud no encontrada.</Text>
      </Screen>
    );
  if (
    (actor.role === "CLIENT" && raw.customerId !== actor.id) ||
    (actor.role === "DRIVER" &&
      ![
        raw.fulfillment?.inbound.driverId,
        raw.fulfillment?.outbound.driverId,
      ].includes(actor.id))
  )
    return (
      <Screen title="Solicitud">
        <Text style={ui.error}>No tienes acceso a esta solicitud.</Text>
      </Screen>
    );
  const order: Order =
    actor.role === "CLIENT" ? businessService.customerView(id).order : raw;
  const active = state.handoffs.filter(
    (h) => h.orderId === id && h.status === "ACTIVE",
  );
  const present = handoffService.activeCodesForPresenter(id, actor.id);
  const verify = async (value: string, h?: Handoff) => {
    await run(() => {
      const v = handoffService.verify(value, actor.id, h?.id);
      if (v.order.id !== id)
        throw Error("El código corresponde a otra solicitud.");
      setTicket(v);
      setCount(String(order.itemCount));
    });
  };
  const verifier =
    actor.role === "DRIVER"
      ? active.filter((h) =>
          ["CUSTOMER_TO_DRIVER", "DRIVER_TO_CUSTOMER"].includes(h.type),
        )
      : [];
  const leg = order.status === "READY" ? "outbound" : "inbound";
  const f = order.fulfillment![leg];
  const target =
    f.milestone === "ASSIGNED" || f.milestone === "RELEASED"
      ? "EN_ROUTE"
      : f.milestone === "EN_ROUTE"
        ? "ARRIVED"
        : f.milestone === "COLLECTED"
          ? "TO_FACILITY"
          : f.milestone === "TO_FACILITY"
            ? "ARRIVED_AT_FACILITY"
            : null;
  const label =
    target === "EN_ROUTE"
      ? "Iniciar ruta"
      : target === "ARRIVED"
        ? "Marcar llegada"
        : target === "TO_FACILITY"
          ? "Trasladar a planta"
          : "Marcar llegada a planta";
  return (
    <Screen title={`Solicitud ${id}`}>
      <Card>
        <Text style={ui.subtitle}>{MODE_LABELS[order.fulfillment!.mode]}</Text>
        <Text style={ui.badge}>
          {order.status} · {order.facilityName}
        </Text>
        <Text style={ui.text}>{nextAction(raw, state)}</Text>
        <Text style={ui.text}>
          {order.pricing.amountKnown === false
            ? "Importe pendiente de pesaje"
            : `Importe: $${order.pricing.total.toFixed(2)}`}{" "}
          · {order.pricing.paymentStatus}
        </Text>
        {order.pricing.measuredWeight && (
          <Text style={ui.text}>
            Peso recibido: {order.pricing.measuredWeight}{" "}
            {order.pricing.weightUnit}
          </Text>
        )}
        {order.customerMessage && (
          <Text style={ui.text}>{order.customerMessage}</Text>
        )}
        {order.policyReview && (
          <View style={ui.warning}>
            <Text style={ui.text}>{order.policyReview}</Text>
          </View>
        )}
        <Action
          label="Ver mapa del pedido"
          icon="map-outline"
          onPress={() =>
            router.push({
              pathname:
                actor.role === "CLIENT"
                  ? "/(client)/tracking"
                  : "/(driver)/map",
              params: { id },
            })
          }
        />
      </Card>
      {error && (
        <View accessibilityRole="alert" style={ui.warning}>
          <Text style={ui.error}>{error}</Text>
        </View>
      )}
      {actor.role === "CLIENT" && (
        <CustomerActions
          order={order}
          run={(fn) => {
            void run(fn);
          }}
        />
      )}
      {actor.role === "DRIVER" && target && (
        <Card>
          <Text style={ui.subtitle}>
            Tramo {leg === "inbound" ? "de recogida" : "de entrega"}
          </Text>
          <Text style={ui.text}>{(f.address as any)?.street}</Text>
          <Text style={ui.muted}>
            {f.date} · {f.timeSlot}
          </Text>
          <Action
            label={label}
            onPress={() =>
              void run(() => businessService.driverAdvance(id, leg, target))
            }
          />
          {leg === "inbound" &&
            ["EN_ROUTE", "ARRIVED"].includes(f.milestone) && (
              <>
                <TextInput
                  style={ui.input}
                  placeholder="Motivo de recogida no completada"
                  value={notes}
                  onChangeText={setNotes}
                />
                <Action
                  label="Reportar cliente ausente"
                  onPress={() =>
                    void run(() =>
                      businessService.recordFailure(id, "NO_SHOW", notes),
                    )
                  }
                />
              </>
            )}
        </Card>
      )}
      {present.map((h) => (
        <Card key={h.id}>
          <Text style={ui.subtitle}>{HANDOFF_LABELS[h.type]}</Text>
          <Text style={ui.muted}>
            Presenta este código. El operador verificará y luego confirmará la
            transferencia física.
          </Text>
          <View style={{ alignItems: "center", gap: 15, padding: 12 }}>
            <QRCode value={handoffService.payload(h)} size={185} />
            <Text selectable style={ui.code}>
              {h.fallbackCode}
            </Text>
          </View>
          <Text style={ui.muted}>
            Generación {h.generation} · Código de un solo uso
          </Text>
        </Card>
      ))}
      {verifier.length > 0 && (
        <Card>
          <Text style={ui.subtitle}>Verificar transferencia</Text>
          <Text style={ui.muted}>
            Selecciona la etapa y lee el código presentado por la otra persona.
            Verificar no confirma la recepción.
          </Text>
          {verifier.map((h) => (
            <View key={h.id} style={{ gap: 10 }}>
              <Text style={ui.text}>{HANDOFF_LABELS[h.type]}</Text>
              <TextInput
                accessibilityLabel="Código de transferencia"
                style={ui.input}
                placeholder="Código manual de seis dígitos o QR"
                value={code}
                onChangeText={setCode}
                autoCapitalize="none"
              />
              <Action
                label="Verificar código"
                onPress={() => void verify(code, h)}
              />
              <Action
                label="Escanear QR"
                icon="scan-outline"
                onPress={async () => {
                  if (!permission?.granted) {
                    const p = await requestPermission();
                    if (!p.granted) {
                      setError(
                        "Activa el permiso de cámara o utiliza el código manual.",
                      );
                      return;
                    }
                  }
                  setScan(true);
                }}
              />
            </View>
          ))}
        </Card>
      )}
      {ticket && (
        <Card>
          <Text style={ui.subtitle}>
            Código verificado · {HANDOFF_LABELS[ticket.handoff.type]}
          </Text>
          <Text style={ui.text}>
            La custodia todavía no cambió. Confirma únicamente después de
            revisar la entrega física.
          </Text>
          {[
            "CUSTOMER_TO_DRIVER",
            "DRIVER_TO_FACILITY",
            "CUSTOMER_TO_FACILITY",
          ].includes(ticket.handoff.type) ? (
            <TextInput
              accessibilityLabel="Cantidad recibida"
              style={ui.input}
              value={count}
              keyboardType="number-pad"
              onChangeText={setCount}
            />
          ) : (
            <>
              <TextInput
                accessibilityLabel="Nombre del receptor"
                style={ui.input}
                placeholder="Nombre completo del receptor"
                value={recipient}
                onChangeText={setRecipient}
              />
              <TextInput
                style={ui.input}
                accessibilityLabel="Relación o autorización del receptor"
                placeholder="Relación o autorización (Titular, Familiar…)"
                value={relationship}
                onChangeText={setRelationship}
              />
            </>
          )}
          <TextInput
            style={ui.input}
            value={notes}
            placeholder="Observaciones de la transferencia"
            onChangeText={setNotes}
          />
          <Action
            label="Confirmar entrega física"
            icon="checkmark-circle-outline"
            onPress={async () => {
              const result = await run(() => {
                handoffService.confirm(actor.id, {
                  ticket: ticket.ticket,
                  count: Number(count),
                  recipient,
                  relationship,
                  notes,
                });
                return true;
              });
              if (result) setTicket(undefined);
            }}
          />
        </Card>
      )}
      <Card>
        <Text style={ui.subtitle}>Desglose del servicio</Text>
        {order.pricing.pricingModel === "PER_WEIGHT" && (
          <Text style={ui.text}>
            Tarifa: ${order.pricing.pricePerWeightUnit?.toFixed(2)} /{" "}
            {order.pricing.weightUnit}
          </Text>
        )}
        {order.pricing.amountKnown === false ? (
          <Text style={ui.muted}>
            El precio del lavado y el total se calculan con el peso real
            recibido.
          </Text>
        ) : (
          <>
            <Text style={ui.text}>
              Servicio: ${order.pricing.subtotal.toFixed(2)}
            </Text>
            <Text style={ui.text}>
              Extras: ${order.pricing.extrasTotal.toFixed(2)}
            </Text>
            <Text style={ui.text}>
              Descuento: −${order.pricing.discount.toFixed(2)}
            </Text>
            <Text style={ui.text}>
              Logística: ${order.pricing.deliveryFee.toFixed(2)}
            </Text>
            <Text style={ui.text}>
              Ajustes aceptados: $
              {(order.pricing.adjustmentsTotal ?? 0).toFixed(2)}
            </Text>
            {order.pricing.taxAmount !== undefined && (
              <Text style={ui.text}>
                IVA: ${order.pricing.taxAmount.toFixed(2)}
              </Text>
            )}
            <Text style={ui.text}>
              Pagado: ${(order.pricing.amountPaid ?? 0).toFixed(2)} · Pendiente:
              ${(order.pricing.amountDue ?? 0).toFixed(2)}
            </Text>
          </>
        )}
      </Card>
      <Card>
        <Text style={ui.subtitle}>Prendas y agenda</Text>
        {order.items.map((item, index) => (
          <Text key={index} style={ui.text}>
            {item.quantity} × {item.name}
            {item.notes ? ` · ${item.notes}` : ""}
          </Text>
        ))}
        <Text style={ui.text}>
          Entrada: {order.fulfillment!.inbound.date} ·{" "}
          {order.fulfillment!.inbound.timeSlot}
        </Text>
        <Text style={ui.text}>
          Salida: {order.fulfillment!.outbound.date || "Al estar listo"} ·{" "}
          {order.fulfillment!.outbound.timeSlot}
        </Text>
      </Card>
      <Card>
        <Text style={ui.subtitle}>Chat del pedido</Text>
        <Text style={ui.muted}>
          Mensajes locales. El chat con el chofer requiere una asignación
          vigente; no revela su teléfono personal.
        </Text>
        <View style={ui.row}>
          {(["OPERATIONS", "DRIVER"] as const).map((c) => (
            <TouchableOpacity
              key={c}
              style={[ui.outline, channel === c && ui.selected]}
              onPress={() => setChannel(c)}
            >
              <Text style={ui.text}>
                {c === "DRIVER" ? "Chofer" : "Operaciones"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {state.messages
          .filter(
            (m) =>
              m.orderId === id &&
              m.channel === channel &&
              (m.senderId === actor.id || m.recipientId === actor.id),
          )
          .map((m) => (
            <Text key={m.id} style={ui.text}>
              {m.senderId === actor.id ? "Tú" : "Respuesta"}: {m.text}
            </Text>
          ))}
        <TextInput
          style={ui.input}
          placeholder="Escribe un mensaje"
          value={chat}
          onChangeText={setChat}
        />
        <Action
          label="Enviar"
          onPress={() =>
            void run(() => {
              businessService.sendMessage(id, channel, chat);
              setChat("");
            })
          }
        />
      </Card>
      <Card>
        <Text style={ui.subtitle}>Historial</Text>
        {order.timeline.map((t) => (
          <View key={t.id}>
            <Text style={ui.text}>{t.label}</Text>
            <Text style={ui.muted}>
              {t.timestamp} · {t.userName}
            </Text>
          </View>
        ))}
      </Card>
      <Modal visible={scan} onRequestClose={() => setScan(false)}>
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={({ data }) => {
            setScan(false);
            setCode(data);
            void verify(data, verifier[0]);
          }}
        />
        <View style={{ padding: 20, backgroundColor: "#FFF" }}>
          <Action
            label="Volver al código manual"
            onPress={() => setScan(false)}
          />
        </View>
      </Modal>
    </Screen>
  );
}
