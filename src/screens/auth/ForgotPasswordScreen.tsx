import { useState } from "react";
import { View } from "react-native";
import { Page } from "../../components/Page";
import { Body, Button, Card, Field, useAction } from "../../components/ui";
import {
  PasswordHint,
  passwordStyles,
} from "../../components/PasswordPresentation";
import { authService } from "../../services/auth/authService";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";

type Step = "email" | "code" | "done";

const EMAIL_RULE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Misma regla que el registro: 8 a 12 caracteres, una mayúscula y un número.
export function newPasswordError(value: string): string | undefined {
  if (value.length < 8 || value.length > 12)
    return "Debe tener entre 8 y 12 caracteres.";
  if (!/[A-Z]/.test(value) || !/\d/.test(value))
    return "Debe incluir al menos una mayúscula y un número.";
  return undefined;
}

// Recuperación de contraseña del cliente: correo -> código de 6 dígitos -> nueva clave.
export function ForgotPasswordScreen() {
  const navigation = useLaundryNavigation();
  const a = useAction();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");

  const cleanEmail = email.trim().toLowerCase();
  const emailValid = EMAIL_RULE.test(cleanEmail);
  const codeValid = /^\d{6}$/.test(code);
  const formValid =
    codeValid && !newPasswordError(password) && confirm === password;

  const sendCode = () =>
    a.asyncRun(async () => {
      if (!emailValid) throw Error("Ingresa un correo electrónico válido.");
      setNotice(await authService.requestPasswordReset(cleanEmail));
      setStep("code");
    });

  const reset = () =>
    a.asyncRun(async () => {
      if (!codeValid) throw Error("El código tiene 6 dígitos.");
      const invalid = newPasswordError(password);
      if (invalid) throw Error(invalid);
      if (password !== confirm) throw Error("Las contraseñas no coinciden.");
      setNotice(
        await authService.confirmPasswordReset({
          email: cleanEmail,
          code,
          newPassword: password,
        }),
      );
      setCode("");
      setPassword("");
      setConfirm("");
      setStep("done");
    });

  const backToLogin = () => navigation.navigate("Login");

  if (step === "done")
    return (
      <Page>
        <PasswordHint title="Contraseña actualizada">{notice}</PasswordHint>
        <Button
          label="Iniciar sesión"
          icon="arrow-forward"
          testID="reset_back_to_login"
          onPress={backToLogin}
        />
      </Page>
    );

  return (
    <Page>
      {step === "email" ? (
        <>
          <PasswordHint title="Restablecer contraseña">
            Escribe el correo de tu cuenta. Te enviaremos un código de 6
            dígitos para crear una nueva contraseña.
          </PasswordHint>
          <Card style={passwordStyles.card}>
            <Field
              label="Correo electrónico"
              labelStyle={passwordStyles.label}
              style={passwordStyles.input}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              leadingIcon="mail-outline"
              maxLength={50}
              value={email}
              onChangeText={setEmail}
              testID="reset_email_input"
            />
            {a.feedback}
            <Button
              label="Enviar código"
              icon="mail-outline"
              disabled={!emailValid}
              busy={a.busy}
              testID="reset_send_code"
              onPress={() => void sendCode()}
            />
          </Card>
        </>
      ) : (
        <>
          <PasswordHint title="Revisa tu correo">
            {notice} El código vence en 15 minutos.
          </PasswordHint>
          <Card style={passwordStyles.card}>
            <Body muted>Correo: {cleanEmail}</Body>
            <Field
              label="Código de 6 dígitos"
              labelStyle={passwordStyles.label}
              style={passwordStyles.input}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              maxLength={6}
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
              validate={(v) =>
                /^\d{6}$/.test(v) ? undefined : "El código tiene 6 dígitos."
              }
              testID="reset_code_input"
            />
            <Field
              label="Nueva contraseña"
              labelStyle={passwordStyles.label}
              style={passwordStyles.input}
              help="Entre 8 y 12 caracteres, con una mayúscula y un número."
              secureTextEntry
              maxLength={12}
              value={password}
              onChangeText={setPassword}
              validate={newPasswordError}
              testID="reset_password_input"
            />
            <Field
              label="Confirmar contraseña"
              labelStyle={passwordStyles.label}
              style={passwordStyles.input}
              secureTextEntry
              maxLength={12}
              value={confirm}
              onChangeText={setConfirm}
              validate={(v) =>
                v !== password ? "Las contraseñas no coinciden." : undefined
              }
              testID="reset_confirm_input"
            />
            {a.feedback}
            <Button
              label="Cambiar contraseña"
              icon="lock-closed-outline"
              disabled={!formValid}
              busy={a.busy}
              testID="reset_submit"
              onPress={() => void reset()}
            />
            <View>
              <Button
                label="Enviar otro código"
                variant="ghost"
                disabled={a.busy}
                testID="reset_resend"
                onPress={() => void sendCode()}
              />
              <Button
                label="Usar otro correo"
                variant="ghost"
                disabled={a.busy}
                onPress={() => {
                  setCode("");
                  setStep("email");
                }}
              />
            </View>
          </Card>
        </>
      )}
      <Button label="Volver a iniciar sesión" variant="ghost" onPress={backToLogin} />
    </Page>
  );
}
