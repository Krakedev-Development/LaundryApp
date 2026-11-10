import { useState } from "react";
import { Page } from "../../components/Page";
import { Body, Button, Card, Field, Title, useAction } from "../../components/ui";
import { Stepper } from "../../components/presentation";
import { useApp } from "../../store/AppProvider";
import { passwordHash } from "../../services/passwordHash";
import { authService } from "../../services/auth/authService";
import { syncFullCatalog } from "../../services/catalog/catalogService";

const STEPS = ["Tu nombre", "Tu teléfono", "Tu correo", "Tu contraseña"] as const;
// Misma regla que el servidor: 10 a 72 caracteres con letras y números.
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{10,72}$/;
const PASSWORD_HELP = "De 10 a 72 caracteres, con letras y números.";

// Registro por partes: nombre y apellido, teléfono, correo y contraseña (confirmada).
// La cuenta se crea al terminar; la verificación de identidad continúa después.
export function RegisterScreen() {
  const { execute } = useApp();
  const a = useAction();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState(""),
    [lastName, setLastName] = useState(""),
    [phone, setPhone] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState("");

  const cleanEmail = email.trim().toLowerCase();
  const problem = (n: number): string | undefined => {
    if (n === 1 && (firstName.trim().length < 2 || lastName.trim().length < 2))
      return "Ingresa tu nombre y tu apellido.";
    if (n === 2 && phone.replace(/\D/g, "").length < 8)
      return "Ingresa un teléfono de al menos 8 dígitos.";
    if (n === 3 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
      return "Revisa el formato del correo.";
    if (n === 4 && !PASSWORD_RULE.test(password)) return PASSWORD_HELP;
    if (n === 4 && password !== confirmation)
      return "Las contraseñas no coinciden.";
    return undefined;
  };
  const complete = (n: number) => !problem(n);

  const next = () => {
    if (complete(step)) setStep(step + 1);
  };

  const create = () =>
    a.asyncRun(async () => {
      const issue = problem(4);
      if (issue) throw Error(issue);
      const hash = await passwordHash(password);
      const response = await authService.register({
        firstName,
        lastName,
        email: cleanEmail,
        phone,
        password,
      });
      // El catálogo no condiciona la cuenta ya creada: si falla, se reintenta más adelante.
      await syncFullCatalog(response.tokens.accessToken).catch(() => undefined);
      // Sin verificación aprobada, la navegación lleva a cargar selfie y cédula.
      execute((r) => r.authenticateFromApi(response.user, hash));
    });

  return (
    <Page
      onBack={step > 1 ? () => setStep(step - 1) : undefined}
      footer={
        step < STEPS.length ? (
          <Button
            label="Continuar"
            disabled={!complete(step)}
            onPress={next}
            testID="register_next_button"
          />
        ) : (
          <Button
            label="Crear cuenta y continuar"
            disabled={!complete(step)}
            busy={a.busy}
            onPress={() => void create()}
            testID="register_submit_button"
          />
        )
      }
    >
      <Stepper step={step} labels={STEPS} />
      <Body>
        Crea tu cuenta en pocos pasos. Después verificaremos tu identidad con
        una selfie y tu cédula para habilitar tus solicitudes.
      </Body>
      <Card>
        {step === 1 && (
          <>
            <Title>¿Cómo te llamas?</Title>
            <Field
              label="Nombre"
              value={firstName}
              onChangeText={setFirstName}
              autoComplete="given-name"
              textContentType="givenName"
              validate={(v) =>
                v.trim().length < 2 ? "Ingresa tu nombre." : undefined
              }
              testID="register_first_name"
            />
            <Field
              label="Apellido"
              value={lastName}
              onChangeText={setLastName}
              autoComplete="family-name"
              textContentType="familyName"
              validate={(v) =>
                v.trim().length < 2 ? "Ingresa tu apellido." : undefined
              }
              testID="register_last_name"
            />
          </>
        )}
        {step === 2 && (
          <>
            <Title>¿Cuál es tu número de teléfono?</Title>
            <Field
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              validate={(v) =>
                v.replace(/\D/g, "").length < 8
                  ? "Ingresa al menos 8 dígitos."
                  : undefined
              }
              testID="register_phone"
            />
          </>
        )}
        {step === 3 && (
          <>
            <Title>¿Cuál es tu correo electrónico?</Title>
            <Field
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              testID="register_email"
            />
          </>
        )}
        {step === 4 && (
          <>
            <Title>Crea tu contraseña</Title>
            <Field
              label="Contraseña"
              help={PASSWORD_HELP}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              validate={(v) => (PASSWORD_RULE.test(v) ? undefined : PASSWORD_HELP)}
              testID="register_password"
            />
            <Field
              label="Confirmar contraseña"
              secureTextEntry
              value={confirmation}
              onChangeText={setConfirmation}
              validate={(v) =>
                v === password ? undefined : "Las contraseñas no coinciden."
              }
              testID="register_password_confirmation"
            />
          </>
        )}
        {a.feedback}
      </Card>
    </Page>
  );
}
