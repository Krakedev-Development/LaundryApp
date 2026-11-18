import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Body, Button, Card, Icon, Title, useAction } from "./ui";
import { theme } from "../design-system/tokens";
import { orderService, type IssuedHandoff } from "../services/orders/orderService";
import { handoffQrValue } from "../services/orders/handoffQr";

type CustomerHandoffType = "CUSTOMER_TO_DRIVER" | "DRIVER_TO_CUSTOMER" | "FACILITY_TO_CUSTOMER";


const minutesLeft = (expiresAt: string, now = Date.now()) =>
  Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 60_000));

/**
 * Código de custodia que el cliente muestra al chofer (o a la sede). Se pide al servidor al
 * tocar el botón y solo vive mientras la pantalla está abierta: el servidor no lo guarda en
 * claro, así que si se cierra hay que generar otro (el anterior queda invalidado).
 */
export function ServerHandoffCode({
  orderId,
  type,
  title,
  description,
}: {
  orderId: string;
  type: CustomerHandoffType;
  title: string;
  description: string;
}) {
  const a = useAction();
  const [issued, setIssued] = useState<IssuedHandoff | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!issued) return;
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, [issued]);

  const generate = () =>
    a.asyncRun(async () => {
      setIssued(await orderService.issueHandoff(orderId, type));
      setNow(Date.now());
    });

  const left = issued ? minutesLeft(issued.expiresAt, now) : 0;
  const expired = !!issued && left === 0;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Icon name="shield-checkmark-outline" size={18} color={theme.colors.primary} />
        </View>
        <Title style={styles.title}>{title}</Title>
      </View>
      <Body muted>{description}</Body>
      {a.feedback}

      {issued && !expired ? (
        <View testID="handoff_code" style={styles.codeBox}>
          <View style={styles.qrInner}>
            <QRCode
              value={handoffQrValue(orderId, type, issued.qrToken)}
              size={theme.layout.qr}
            />
          </View>
          <Text
            accessibilityLabel={`Código ${issued.code.split("").join(" ")}`}
            style={styles.code}
          >
            {issued.code.slice(0, 3)} {issued.code.slice(3)}
          </Text>
          <Body muted>
            {left === 1 ? "Vence en 1 minuto." : `Vence en ${left} minutos.`} Muéstralo solo a la
            persona de Laundry que recibe tu ropa.
          </Body>
          <Button
            label="Generar otro código"
            secondary
            icon="refresh-outline"
            busy={a.busy}
            onPress={() => void generate()}
          />
        </View>
      ) : (
        <>
          {expired ? <Body>El código venció. Genera uno nuevo.</Body> : null}
          <Button
            label="Mostrar código"
            icon="qr-code-outline"
            busy={a.busy}
            onPress={() => void generate()}
          />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#93C5FD",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, fontSize: 16, lineHeight: 22, fontWeight: "700", color: "#0F172A" },
  codeBox: { alignItems: "center", gap: 12 },
  qrInner: {
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  code: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: 4,
    color: "#0F172A",
    fontVariant: ["tabular-nums"],
  },
});
