import { useState } from "react";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Badge, Body, Button, Card, Title, useAction } from "./ui";
import { BottomSheet } from "./overlay/OverlayPortal";
import { theme } from "../design-system/tokens";
import type { Handoff } from "../domain/models";
export function HandoffCard({
  handoff,
  onRegenerate,
}: {
  handoff: Handoff;
  onRegenerate?(): void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <Title>{handoff.title}</Title>
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
      <Body muted>{handoff.description}</Body>
      {handoff.status === "ACTIVE" && (
        <Button
          label={"Mostrar código · " + handoff.title}
          secondary
          icon="qr-code-outline"
          onPress={() => setOpen(true)}
        />
      )}
      {handoff.usedAt && <Body muted>Usado: {handoff.usedAt}</Body>}
      <BottomSheet
        title={handoff.title}
        visible={open && handoff.status === "ACTIVE"}
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
  return (
    <>
      <Body>{handoff.description}</Body>
      <View
        style={{ alignSelf: "center", padding: 12, backgroundColor: "#FFFFFF" }}
      >
        <QRCode value={handoff.qrToken} size={theme.layout.qr} />
      </View>
      <Title>Código manual: {handoff.fallbackCode}</Title>
      {a.feedback}
      {onRegenerate && (
        <Button
          label="Regenerar código"
          secondary
          onPress={() => a.run(onRegenerate, "Código actualizado.")}
        />
      )}
    </>
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
