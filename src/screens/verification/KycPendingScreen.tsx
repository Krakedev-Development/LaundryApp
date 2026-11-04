import { Accordion } from "../../components/presentation";
import { Page } from "../../components/Page";
import { Badge, Body, Button, Card, Icon, Title, useAction } from "../../components/ui";
import { useApp } from "../../store/AppProvider";

export function KycPendingScreen() {
  const { execute } = useApp();
  const a = useAction();
  return (
    <Page>
      <Card>
        <Icon name="hourglass-outline" size={48} />
        <Title>Estamos revisando tu identidad</Title>
        <Body>
          Tu documento y selfie fueron recibidos. Podrás solicitar servicios
          cuando se apruebe tu verificación.
        </Body>
        <Badge>Pendiente de revisión</Badge>
        {a.feedback}
        <Accordion title="Herramientas de verificación · Demo">
          <Button
            label="Simular aprobación · Demo"
            secondary
            onPress={() => a.run(() => execute((r) => r.simulateKyc(true)))}
          />
          <Button
            label="Simular rechazo · Demo"
            secondary
            onPress={() => a.run(() => execute((r) => r.simulateKyc(false)))}
          />
        </Accordion>
        <Button
          label="Cerrar sesión"
          secondary
          onPress={() => execute((r) => r.logout())}
        />
      </Card>
    </Page>
  );
}
