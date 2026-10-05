import React, { useRef, useState } from "react";
import { Linking, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect } from "expo-router";
import { useApp } from "../../store/AppStore";
import {
  Badge,
  Button,
  Card,
  Check,
  ErrorState,
  Field,
  ui,
} from "../../components/ui";
import { HANDOFF_LABELS } from "../../domain/fulfillment";
import { Verification } from "../../domain/HandoffService";
import { Order } from "../../domain/models";

export function HandoffCode({ order }: { order: Order }) {
  const { data, session, engine } = useApp();
  const handoff = engine.handoffService.activeCodesForPresenter(
    order.id,
    session!.userId,
  )[0];
  return (
    <Card>
      <Text style={ui.section}>
        {order.fulfillment?.mode === "STORE_STORE"
          ? "Ingreso y retiro en sede"
          : "Código de transferencia"}
      </Text>
      {handoff ? (
        <>
          <Text style={ui.body}>{HANDOFF_LABELS[handoff.type]}</Text>
          <View
            style={{
              alignSelf: "center",
              padding: 16,
              backgroundColor: "white",
            }}
          >
            <QRCode
              value={engine.handoffService.payload(handoff)}
              size={190}
              ecl="M"
              quietZone={20}
            />
          </View>
          <Text
            selectable
            style={[ui.title, { textAlign: "center", letterSpacing: 5 }]}
          >
            {handoff.fallbackCode}
          </Text>
          <Text style={ui.muted}>
            Comparte este código solo al entregar o retirar físicamente las
            prendas. Válido hasta confirmar la transferencia; un solo uso.
          </Text>
        </>
      ) : (
        <Text style={ui.muted}>
          El código aparecerá cuando corresponda a la etapa del pedido. Los
          códigos usados o revocados quedan en el historial.
        </Text>
      )}
      <Badge title="Validación local · demo" />
    </Card>
  );
}

export function HandoffAction({
  order,
  actorId,
  demo = false,
  handoffId,
}: {
  order: Order;
  actorId: string;
  demo?: boolean;
  handoffId?: string;
}) {
  const { data, engine } = useApp();
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState<Verification | null>(null);
  const [count, setCount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [camera, setCamera] = useState(false);
  const [reason, setReason] = useState("");
  const lock = useRef(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    React.useCallback(() => {
      setFocused(true);
      return () => {
        setFocused(false);
        setCamera(false);
      };
    }, []),
  );
  const candidates = data.handoffs.filter(
    (h) => h.orderId === order.id && h.status === "ACTIVE",
  );
  const expected = handoffId
    ? data.handoffs.find((h) => h.id === handoffId)
    : candidates.find((h) =>
        actorId.startsWith("DEMO-")
          ? !["CUSTOMER_TO_DRIVER", "DRIVER_TO_CUSTOMER"].includes(h.type)
          : ["CUSTOMER_TO_DRIVER", "DRIVER_TO_CUSTOMER"].includes(h.type),
      );
  function verify(value = code) {
    setError("");
    setSuccess("");
    setCamera(false);
    lock.current = true;
    try {
      setVerified(engine.handoffService.verify(value, actorId, expected?.id));
    } catch (e) {
      setError((e as Error).message);
      setVerified(null);
    }
  }
  return (
    <Card>
      <Text style={ui.section}>
        {demo ? "Control demo: operador de sede" : "Verificar transferencia"}
      </Text>
      <Badge title="Validación local · sin sincronización" />
      {expected ? (
        <Text style={ui.body}>{HANDOFF_LABELS[expected.type]}</Text>
      ) : (
        <Text style={ui.muted}>
          No hay una transferencia habilitada para este operador.
        </Text>
      )}
      <Field
        label="Código de 6 dígitos o contenido QR"
        value={code}
        onChangeText={(v) => {
          setCode(v);
          setVerified(null);
          setChecked(false);
        }}
        autoCapitalize="none"
      />
      <Button
        title="Verificar código"
        onPress={() => verify()}
        disabled={!expected || !code.trim()}
      />
      <Button
        title="Escanear QR"
        variant="secondary"
        disabled={!expected}
        onPress={async () => {
          setError("");
          lock.current = false;
          if (!permission?.granted) {
            const p = await requestPermission();
            if (!p.granted) {
              setError(
                "Cámara no disponible. Puedes ingresar el código manualmente.",
              );
              return;
            }
          }
          setCamera(true);
        }}
      />
      {camera && focused && permission?.granted && (
        <>
          <CameraView
            style={{ height: 260 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data: value }) => {
              if (lock.current) return;
              lock.current = true;
              setCode(value);
              verify(value);
            }}
          />
          <Button
            title="Cerrar cámara"
            variant="secondary"
            onPress={() => setCamera(false)}
          />
        </>
      )}
      {demo && expected && (
        <Button
          title="Demo: cargar código preparado"
          variant="secondary"
          onPress={() => {
            setCode(expected.fallbackCode);
            setVerified(null);
            setChecked(false);
          }}
        />
      )}
      {demo &&
        expected &&
        !["USED", "REVOKED", "PENDING"].includes(expected.status) && (
          <>
            <Field
              label="Motivo del override administrativo"
              value={reason}
              onChangeText={setReason}
            />
            <Button
              title="Verificar override administrativo"
              variant="secondary"
              onPress={() => {
                try {
                  setVerified(
                    engine.handoffService.verifyAdministrativeOverride(
                      expected.id,
                      actorId,
                      reason,
                    ),
                  );
                  setError("");
                  setChecked(false);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            />
          </>
        )}
      {verified && (
        <>
          <Text style={ui.muted}>{verified.warning}</Text>
          <Text style={ui.body}>
            Pedido {verified.order.id}. Prendas declaradas:{" "}
            {order.items.reduce((n, i) => n + i.quantity, 0)}
          </Text>
          {[
            "CUSTOMER_TO_DRIVER",
            "CUSTOMER_TO_FACILITY",
            "DRIVER_TO_FACILITY",
          ].includes(verified.handoff.type) && (
            <Field
              label="Prendas recibidas"
              value={count}
              keyboardType="number-pad"
              onChangeText={setCount}
            />
          )}
          {["DRIVER_TO_CUSTOMER", "FACILITY_TO_CUSTOMER"].includes(
            verified.handoff.type,
          ) && (
            <>
              <Field
                label="Nombre de quien recibe o retira"
                value={recipient}
                onChangeText={setRecipient}
              />
              <Field
                label="Relación o autorización"
                value={relationship}
                onChangeText={setRelationship}
              />
            </>
          )}
          <Field
            label="Observaciones de la transferencia"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          <Check
            title="Verifiqué las prendas y confirmo la entrega física"
            checked={checked}
            onPress={() => setChecked(!checked)}
          />
          <Button
            title="Confirmar transferencia"
            disabled={!checked}
            onPress={() => {
              try {
                engine.handoffService.confirm(actorId, {
                  ticket: verified.ticket,
                  count: count ? Number(count) : undefined,
                  recipient,
                  relationship,
                  notes,
                });
                setSuccess(
                  "Transferencia registrada. El código ya no se puede reutilizar.",
                );
                setVerified(null);
                setCode("");
                setChecked(false);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          />
        </>
      )}
      {!!success && <Text style={ui.body}>{success}</Text>}
      {!!error && <ErrorState text={error} />}
    </Card>
  );
}

export function FacilityInfo({ order }: { order: Order }) {
  const { data } = useApp();
  const f = data.facilities.find((f) => f.id === order.facilityId);
  if (!f) return null;
  return (
    <Card>
      <Text style={ui.section}>{f.name}</Text>
      <Text style={ui.body}>{f.address}</Text>
      <Text style={ui.muted}>
        {f.openingHours ?? "Atención de demo: lunes a sábado, 08:00–18:00"}
      </Text>
      <Button
        title="Cómo llegar a la sede"
        variant="secondary"
        onPress={() =>
          Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${f.coordinates.lat},${f.coordinates.lng}`,
          )
        }
      />
    </Card>
  );
}
