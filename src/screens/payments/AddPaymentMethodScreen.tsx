import { useState } from "react";
import { View } from "react-native";
import { Page } from "../../components/Page";
import {
  PaymentCardPreview,
  paymentStyles,
} from "../../components/PaymentsPresentation";
import { SegmentedControl } from "../../components/presentation";
import {
  Body,
  Button,
  Choice,
  Field,
  Title,
  useAction,
} from "../../components/ui";
import {
  bankAccountError,
  cardInputError,
  cardNumberError,
  digitsOnly,
  expiryError,
} from "../../domain/paymentMethods";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";
import { useApp } from "../../store/AppProvider";

export function AddPaymentMethodScreen() {
  const { execute } = useApp();
  const navigation = useLaundryNavigation();
  const action = useAction();
  const [kind, setKind] = useState<"CARD" | "TRANSFER">("CARD");
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [bank, setBank] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState<"Ahorros" | "Corriente">(
    "Ahorros",
  );
  const card = { number, holder, expiry, cvv };
  const account = { bank, holder: bankHolder, accountNumber, accountType };
  const valid = !(kind === "CARD"
    ? cardInputError(card)
    : bankAccountError(account));
  const save = () => {
    if (
      action.run(
        () =>
          execute((repo) =>
            kind === "CARD"
              ? repo.addPaymentCard(card)
              : repo.addPaymentBankAccount(account),
          ),
        "Método de pago guardado.",
      )
    ) {
      setNumber("");
      setCvv("");
      navigation.goBack();
    }
  };
  return (
    <Page
      footer={
        <Button
          label={
            kind === "CARD" ? "Guardar tarjeta" : "Guardar cuenta bancaria"
          }
          icon="checkmark-circle-outline"
          style={paymentStyles.saveButton}
          disabled={!valid}
          onPress={save}
        />
      }
    >
      <SegmentedControl<"CARD" | "TRANSFER">
        options={[
          { value: "CARD", label: "Tarjeta" },
          { value: "TRANSFER", label: "Transferencia" },
        ]}
        value={kind}
        onChange={setKind}
      />
      {kind === "CARD" ? (
        <>
          <PaymentCardPreview
            holder={holder}
            expiry={expiry}
            last4={
              digitsOnly(number).length >= 4 ? digitsOnly(number).slice(-4) : ""
            }
          />
          <View style={paymentStyles.form}>
            <Field
              label="Número de tarjeta"
              leadingIcon="card-outline"
              keyboardType="number-pad"
              value={number}
              maxLength={23}
              validate={cardNumberError}
              style={paymentStyles.input}
              onChangeText={(value) =>
                setNumber(
                  digitsOnly(value)
                    .slice(0, 19)
                    .replace(/(.{4})/g, "$1 ")
                    .trim(),
                )
              }
            />
            <Field
              label="Nombre del titular"
              leadingIcon="person-outline"
              autoCapitalize="characters"
              value={holder}
              onChangeText={setHolder}
              style={paymentStyles.input}
              validate={(value) =>
                value.trim().length < 3
                  ? "Ingresa el nombre del titular."
                  : undefined
              }
            />
            <View style={paymentStyles.splitFields}>
              <View style={paymentStyles.halfField}>
                <Field
                  label="Vencimiento"
                  leadingIcon="calendar-outline"
                  keyboardType="number-pad"
                  value={expiry}
                  placeholder="MM/AA"
                  maxLength={5}
                  validate={expiryError}
                  style={paymentStyles.input}
                  onChangeText={(value) => {
                    const digits = digitsOnly(value).slice(0, 4);
                    setExpiry(
                      digits.length > 2
                        ? digits.slice(0, 2) + "/" + digits.slice(2)
                        : digits,
                    );
                  }}
                />
              </View>
              <View style={paymentStyles.halfField}>
                <Field
                  label="CVV"
                  leadingIcon="lock-closed-outline"
                  keyboardType="number-pad"
                  secureTextEntry
                  value={cvv}
                  maxLength={4}
                  style={paymentStyles.input}
                  onChangeText={(value) =>
                    setCvv(digitsOnly(value).slice(0, 4))
                  }
                />
              </View>
            </View>
          </View>
        </>
      ) : (
        <>
          <Title style={paymentStyles.sectionTitle}>
            Cuenta bancaria para transferencia
          </Title>
          <View style={paymentStyles.form}>
            <Field
              label="Banco"
              leadingIcon="business-outline"
              value={bank}
              onChangeText={setBank}
              style={paymentStyles.input}
              validate={(value) =>
                value.trim().length < 2
                  ? "Ingresa el nombre del banco."
                  : undefined
              }
            />
            <Field
              label="Titular de la cuenta"
              leadingIcon="person-outline"
              value={bankHolder}
              onChangeText={setBankHolder}
              style={paymentStyles.input}
              validate={(value) =>
                value.trim().length < 3
                  ? "Ingresa el nombre del titular."
                  : undefined
              }
            />
            <Field
              label="Número de cuenta"
              keyboardType="number-pad"
              value={accountNumber}
              onChangeText={(value) =>
                setAccountNumber(digitsOnly(value).slice(0, 24))
              }
              maxLength={24}
              style={paymentStyles.input}
              validate={(value) =>
                !/^\d{6,24}$/.test(value)
                  ? "Ingresa un número de cuenta de 6 a 24 dígitos."
                  : undefined
              }
            />
            <Title style={paymentStyles.sectionTitle}>Tipo de cuenta</Title>
            <View style={paymentStyles.splitFields}>
              {(["Ahorros", "Corriente"] as const).map((type) => (
                <View key={type} style={paymentStyles.halfField}>
                  <Choice
                    label={type}
                    selected={accountType === type}
                    onPress={() => setAccountType(type)}
                  />
                </View>
              ))}
            </View>
          </View>
        </>
      )}
      {action.feedback}
      <Body muted>
        Registro de demostración. No se realizan cobros ni transferencias
        reales.
      </Body>
    </Page>
  );
}
