import { useEffect, useState } from "react";
import { Page } from "../../components/Page";
import { Body, Button, Card, Icon, Title } from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { currentCustomer } from "../../domain/repository";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";
import { kycService, type KycState } from "../../services/kyc/kycService";

export function KycRejectedScreen() {
  const navigation = useLaundryNavigation();
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  const [kyc, setKyc] = useState<KycState | null>(null);

  // Trae el motivo y los reenvíos disponibles desde el servidor.
  useEffect(() => {
    let alive = true;
    kycService
      .status()
      .then((fresh) => {
        if (!alive) return;
        setKyc(fresh);
        execute((r) => r.setKycStatus(fresh.status, fresh.rejectionReason));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // Solo al abrir la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canResubmit = kyc ? kyc.canSubmit : true;
  return (
    <Page>
      <Card>
        <Icon name="alert-circle-outline" size={48} />
        <Title>Necesitamos una nueva verificación</Title>
        <Body>
          {c.kycRejectionReason ?? "Revisa tus documentos y vuelve a enviarlos."}
        </Body>
        {kyc ? (
          <Body muted>
            {canResubmit
              ? `Reenvíos restantes: ${kyc.resubmissionsLeft}.`
              : "Alcanzaste el máximo de reenvíos. Contacta a soporte."}
          </Body>
        ) : null}
        {canResubmit ? (
          <Button
            label="Volver a enviar documentos"
            onPress={() => navigation.navigate("KycUpload")}
          />
        ) : null}
        <Button
          label="Cerrar sesión"
          secondary
          onPress={() => execute((r) => r.logout())}
        />
      </Card>
    </Page>
  );
}
