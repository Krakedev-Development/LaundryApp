import { useState } from "react";
import { Page } from "../../components/Page";
import { Body, Button, Card, Field, useAction } from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { currentCustomer } from "../../domain/repository";
import type { Customer } from "../../domain/models";
import {
  BillingIntro,
  billingStyles,
} from "../../components/BillingPresentation";

export function BillingScreen() {
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  const a = useAction();
  const [draft, setDraft] = useState<
    Pick<
      Customer,
      | "billingName"
      | "billingTaxId"
      | "billingEmail"
      | "billingPhone"
      | "billingAddress"
    >
  >({
    billingName: c.billingName,
    billingTaxId: c.billingTaxId,
    billingEmail: c.billingEmail,
    billingPhone: c.billingPhone,
    billingAddress: c.billingAddress,
  });
  const fields = {
    billingName: "Nombre o razón social",
    billingTaxId: "Número tributario",
    billingEmail: "Correo de facturación",
    billingPhone: "Teléfono de facturación",
    billingAddress: "Dirección fiscal",
  } as const;
  return (
    <Page
      footer={
        <>
          <Button
            label="Guardar datos de facturación"
            icon="checkmark-circle-outline"
            style={billingStyles.saveAction}
            textStyle={billingStyles.saveText}
            onPress={() =>
              a.run(
                () => execute((r) => r.updateBillingData(draft)),
                "Datos de facturación guardados.",
              )
            }
          />
        </>
      }
    >
      <BillingIntro>
        <Body muted style={billingStyles.introText}>
          Se usarán en tus comprobantes. Revisa el correo y número tributario.
        </Body>
      </BillingIntro>
      <Card style={billingStyles.card}>
        {(Object.keys(fields) as (keyof typeof fields)[]).map((key) => (
          <Field
            key={key}
            label={fields[key]}
            labelStyle={billingStyles.label}
            style={billingStyles.input}
            keyboardType={
              key === "billingEmail"
                ? "email-address"
                : key === "billingPhone"
                  ? "phone-pad"
                  : "default"
            }
            autoCapitalize={key === "billingEmail" ? "none" : "sentences"}
            value={draft[key]}
            onChangeText={(value) => setDraft({ ...draft, [key]: value })}
          />
        ))}
        {a.feedback}
      </Card>
    </Page>
  );
}
