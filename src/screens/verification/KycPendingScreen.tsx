import { useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { Page } from "../../components/Page";
import { Badge, Body, Button, Card, Icon, Title, useAction } from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { kycService } from "../../services/kyc/kycService";

const POLL_MS = 30_000;

// El cliente puede entrar a su cuenta, pero no operar hasta que el administrador apruebe.
export function KycPendingScreen() {
  const { execute } = useApp();
  const a = useAction();

  const refresh = useCallback(async () => {
    const state = await kycService.status();
    // Si el administrador ya decidió, la navegación cambia sola.
    execute((r) => r.setKycStatus(state.status, state.rejectionReason));
  }, [execute]);

  useEffect(() => {
    const quiet = () => void refresh().catch(() => undefined);
    const timer = setInterval(quiet, POLL_MS);
    const listener = AppState.addEventListener("change", (status) => {
      if (status === "active") quiet();
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [refresh]);

  return (
    <Page>
      <Card>
        <Icon name="hourglass-outline" size={48} />
        <Title>Estamos revisando tu identidad</Title>
        <Body>
          Recibimos tu selfie y tu cédula. Cuando el administrador apruebe tu
          verificación podrás solicitar servicios. Mientras tanto puedes
          mantener tu sesión abierta.
        </Body>
        <Badge>Pendiente de aprobación</Badge>
        {a.feedback}
        <Button
          label="Actualizar estado"
          icon="refresh-outline"
          busy={a.busy}
          onPress={() => void a.asyncRun(refresh)}
          testID="kyc_refresh_button"
        />
        <Button
          label="Cerrar sesión"
          secondary
          onPress={() => execute((r) => r.logout())}
        />
      </Card>
    </Page>
  );
}
