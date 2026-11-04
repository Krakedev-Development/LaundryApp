import { Accordion } from "../../components/presentation";
import { Linking, View } from "react-native";
import { Page } from "../../components/Page";
import { Body, Button, Card, Title, useAction } from "../../components/ui";
import { faqs } from "./faqs";
import {
  SupportContactCard,
  supportStyles,
} from "../../components/SupportPresentation";

export function SupportScreen() {
  const a = useAction();
  return (
    <Page>
      <Title style={supportStyles.sectionLabel}>Contacta a soporte</Title>
      <SupportContactCard email="soporte@laundryfresh.com">
        <Body muted style={supportStyles.contactDescription}>
          Atención mediante correo electrónico.
        </Body>
        {a.feedback}
        <Button
          label="Escribir a soporte"
          icon="mail-outline"
          variant="ghost"
          style={supportStyles.contactAction}
          textStyle={supportStyles.contactActionText}
          onPress={() => {
            void a.asyncRun(() =>
              Linking.openURL("mailto:soporte@laundryfresh.com"),
            );
          }}
        />
      </SupportContactCard>
      <Title style={supportStyles.sectionLabel}>Preguntas frecuentes</Title>
      <Card style={supportStyles.faqCard}>
        {faqs.map(([question, answer], index) => (
          <View
            key={question}
            style={
              index < faqs.length - 1 ? supportStyles.faqDivider : undefined
            }
          >
            <Accordion title={question} appearance="list">
              <Body style={supportStyles.answer}>{answer}</Body>
            </Accordion>
          </View>
        ))}
      </Card>
    </Page>
  );
}
