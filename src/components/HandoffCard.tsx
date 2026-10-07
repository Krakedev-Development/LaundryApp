import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Badge, Body, Button, Card, Title } from "./ui";
import type { Handoff } from "../domain/models";
export function HandoffCard({
  handoff,
  onRegenerate,
}: {
  handoff: Handoff;
  onRegenerate?(): void;
}) {
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
      <Body>{handoff.description}</Body>
      {handoff.status === "ACTIVE" && (
        <>
          <View
            style={{
              alignSelf: "center",
              padding: 12,
              backgroundColor: "#FFF",
            }}
          >
            <QRCode value={handoff.qrToken} size={170} />
          </View>
          <Title>Código manual: {handoff.fallbackCode}</Title>
          {onRegenerate && (
            <Button label="Regenerar código" secondary onPress={onRegenerate} />
          )}
        </>
      )}
      {handoff.usedAt && <Body muted>Usado: {handoff.usedAt}</Body>}
    </Card>
  );
}
