import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Badge, Body, Button, Card, Icon, Title, useAction } from "./ui";
import { BottomSheet } from "./overlay/OverlayPortal";
import { theme } from "../design-system/tokens";
import { tactile } from "../design-system/interaction";
import type { Handoff } from "../domain/models";

function copyToClipboard(value: string) {
  if (
    Platform.OS === "web" &&
    typeof navigator !== "undefined" &&
    navigator.clipboard
  ) {
    void navigator.clipboard.writeText(value).catch(() => {});
  }
}

export function HandoffCard({
  handoff,
  onRegenerate,
}: {
  handoff: Handoff;
  onRegenerate?(): void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = handoff.status === "ACTIVE";
  return (
    <Card style={[styles.card, isActive && styles.activeCard]}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.iconBadge}>
            <Icon
              name="shield-checkmark-outline"
              size={18}
              color={theme.colors.primary}
            />
          </View>
          <Title style={styles.title}>{handoff.title}</Title>
        </View>
        <Badge>
          {
            {
              ACTIVE: "Activo",
              PENDING: "Se activará al iniciar el tramo",
              USED: "Utilizado",
              EXPIRED: "Expirado",
              REVOKED: "Revocado",
            }[handoff.status]
          }
        </Badge>
      </View>
      <Body muted style={styles.description}>
        {handoff.description}
      </Body>
      {isActive && (
        <Button
          label={"Mostrar código · " + handoff.title}
          secondary
          icon="qr-code-outline"
          style={styles.showButton}
          onPress={() => setOpen(true)}
        />
      )}
      {handoff.usedAt && <Body muted>Usado: {handoff.usedAt}</Body>}
      <BottomSheet
        title={handoff.title}
        visible={open && isActive}
        onClose={() => setOpen(false)}
      >
        <HandoffCode handoff={handoff} onRegenerate={onRegenerate} />
      </BottomSheet>
    </Card>
  );
}

function HandoffCode({
  handoff,
  onRegenerate,
}: {
  handoff: Handoff;
  onRegenerate?(): void;
}) {
  const a = useAction();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    tactile("success");
    copyToClipboard(handoff.fallbackCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2600);
  };

  return (
    <View style={styles.sheetContainer}>
      <View style={styles.securityBadge}>
        <Icon name="lock-closed" size={14} color="#059669" />
        <Text style={styles.securityBadgeText}>
          Custodia verificada · Token único
        </Text>
      </View>

      <Body style={styles.sheetDescription}>{handoff.description}</Body>

      <View style={styles.tacticalFrame}>
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        <View style={styles.qrInner}>
          <QRCode value={handoff.qrToken} size={theme.layout.qr} />
        </View>
      </View>

      <View style={styles.manualCodeBox}>
        <Title style={styles.manualCodeTitle}>
          Código manual: {handoff.fallbackCode}
        </Title>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copiar código manual"
          onPress={handleCopy}
          style={({ pressed }) => [
            styles.copyButton,
            copied && styles.copyButtonSuccess,
            {
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          <Icon
            name={copied ? "checkmark-circle" : "copy-outline"}
            size={16}
            color={copied ? "#059669" : theme.colors.primary}
          />
          <Text
            style={[
              styles.copyButtonText,
              copied && styles.copyButtonTextSuccess,
            ]}
          >
            {copied ? "Código copiado" : "Copiar código"}
          </Text>
        </Pressable>
      </View>

      {a.feedback}
      {onRegenerate && (
        <Button
          label="Regenerar código"
          secondary
          icon="refresh-outline"
          onPress={() => {
            setCopied(false);
            a.run(onRegenerate, "Código actualizado.");
          }}
        />
      )}
    </View>
  );
}

export function HandoffCodeSheet({
  handoff,
  visible,
  onClose,
}: {
  handoff: Handoff;
  visible: boolean;
  onClose(): void;
}) {
  return (
    <BottomSheet
      title={handoff.title}
      visible={visible && handoff.status === "ACTIVE"}
      onClose={onClose}
    >
      <HandoffCode handoff={handoff} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  activeCard: {
    borderColor: "#93C5FD",
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 160,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#0F172A",
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  showButton: {
    borderColor: "#93C5FD",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
  },
  sheetContainer: {
    gap: 14,
    alignItems: "stretch",
  },
  securityBadge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  securityBadgeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#047857",
  },
  sheetDescription: {
    textAlign: "center",
    color: "#475569",
    fontSize: 13.5,
    lineHeight: 20,
  },
  tacticalFrame: {
    alignSelf: "center",
    padding: 18,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  qrInner: {
    padding: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  corner: {
    position: "absolute",
    width: 18,
    height: 18,
    borderColor: "#143F73",
  },
  cornerTL: {
    top: 8,
    left: 8,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  cornerTR: {
    top: 8,
    right: 8,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  cornerBL: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  manualCodeBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    alignItems: "center",
    gap: 10,
  },
  manualCodeTitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    minHeight: 36,
  },
  copyButtonSuccess: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  copyButtonText: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "700",
    color: "#143F73",
  },
  copyButtonTextSuccess: {
    color: "#047857",
  },
});
