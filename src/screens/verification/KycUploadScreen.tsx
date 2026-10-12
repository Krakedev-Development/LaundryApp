import { Accordion, ListItem, Stepper } from "../../components/presentation";
import { BottomSheet } from "../../components/overlay/OverlayPortal";
import { useState } from "react";
import { Page } from "../../components/Page";
import { Body, Button, Card, Choice, Field, Icon, useAction } from "../../components/ui";
import { PhotoAttachment } from "../../components/PhotoAttachment";
import { useApp } from "../../store/AppProvider";
import { currentCustomer } from "../../domain/repository";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";

export function KycUploadScreen() {
  const navigation = useLaundryNavigation();
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  const a = useAction();
  const [type, setType] = useState(c.kycDocumentType),
    [number, setNumber] = useState(c.kycDocumentId ?? ""),
    [uri, setUri] = useState(c.documentUri),
    [typePanel, setTypePanel] = useState(false);
  return (
    <Page>
      <Stepper step={1} labels={["Documento", "Selfie"]} />
      <Body>Verifica tu identidad antes de solicitar recogidas.</Body>
      <Card>
        <Icon name="document-text-outline" size={42} />
        <ListItem
          title="Tipo de documento"
          subtitle={type}
          icon="document-outline"
          onPress={() => setTypePanel(true)}
        />
        <BottomSheet
          title="Tipo de documento"
          visible={typePanel}
          onClose={() => setTypePanel(false)}
        >
          {[
            "Cédula de Identidad",
            "DNI",
            "Pasaporte",
            "Carné de extranjería",
          ].map((t) => (
            <Choice
              key={t}
              label={t}
              selected={type === t}
              onPress={() => {
                setType(t);
                setTypePanel(false);
              }}
            />
          ))}
        </BottomSheet>
        <Field
          label="Número de documento"
          value={number}
          onChangeText={setNumber}
        />
        <PhotoAttachment
          label="Documento legible"
          uri={uri}
          onChange={setUri}
        />
        <Accordion title="Documento de demostración">
          <Button
            label="Adjuntar documento simulado · Demo"
            secondary
            onPress={() => {
              setUri("demo://document");
              if (!number) setNumber("72819234");
            }}
          />
        </Accordion>
        {a.feedback}
        <Button
          label="Continuar a selfie"
          disabled={!uri || !number.trim()}
          onPress={() =>
            a.run(() => {
              execute((r) => r.saveKycDocument(type, number, uri!));
              navigation.navigate("KycSelfie");
            })
          }
        />
        <Button
          label="Volver al inicio de sesión"
          secondary
          onPress={() => execute((r) => r.logout())}
        />
      </Card>
    </Page>
  );
}
