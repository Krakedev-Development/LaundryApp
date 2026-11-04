import { Accordion, Stepper } from "../../components/presentation";
import { useState } from "react";
import { Page } from "../../components/Page";
import { Body, Button, Card, Icon, Title, useAction } from "../../components/ui";
import { PhotoAttachment } from "../../components/PhotoAttachment";
import { useApp } from "../../store/AppProvider";

export function KycSelfieScreen() {
  const { execute } = useApp();
  const a = useAction();
  const [uri, setUri] = useState<string>();
  return (
    <Page>
      <Stepper step={2} labels={["Documento", "Selfie"]} />
      <Card>
        <Icon name="person-outline" size={46} />
        <Title>Confirma que eres tú</Title>
        <Body>Busca buena iluminación y deja tu rostro visible.</Body>
        <PhotoAttachment
          label="Selfie de verificación"
          uri={uri}
          onChange={setUri}
          selfie
        />
        <Accordion title="Selfie de demostración">
          <Button
            label="Adjuntar selfie simulada · Demo"
            secondary
            onPress={() => setUri("demo://selfie")}
          />
        </Accordion>
        {a.feedback}
        <Button
          label="Enviar verificación"
          disabled={!uri}
          onPress={() => a.run(() => execute((r) => r.submitKyc(uri!)))}
        />
      </Card>
    </Page>
  );
}
