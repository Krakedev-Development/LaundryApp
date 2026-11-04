import { Page } from "../../components/Page";
import { Body, Button, Card, Icon, Title } from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { currentCustomer } from "../../domain/repository";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";

export function KycRejectedScreen() {
  const navigation = useLaundryNavigation();
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  return (
    <Page>
      <Card>
        <Icon name="alert-circle-outline" size={48} />
        <Title>Necesitamos una nueva verificación</Title>
        <Body>
          {c.kycRejectionReason ?? "Revisa el documento y vuelve a enviarlo."}
        </Body>
        <Button
          label="Volver a enviar documentos"
          onPress={() => navigation.navigate("KycUpload")}
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
