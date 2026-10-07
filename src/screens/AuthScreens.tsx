import { useState } from "react";
import { Text } from "react-native";
import * as Crypto from "expo-crypto";
import { Page, Logo } from "../components/Page";
import {
  Badge,
  Body,
  Button,
  Card,
  Choice,
  Field,
  Icon,
  Title,
  ui,
  useAction,
} from "../components/ui";
import { PhotoAttachment } from "../components/PhotoAttachment";
import { useApp } from "../store/AppProvider";
import { currentCustomer } from "../domain/repository";
import type { ScreenProps } from "../navigation/routes";

export const passwordHash = (password: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
export function SplashScreen({ navigation }: ScreenProps<"Splash">) {
  return (
    <Page>
      <Card>
        <Logo />
        <Text style={ui.title}>Tu ropa limpia, sin complicaciones.</Text>
        <Body>Lavado, cuidado y entrega con Laundry Clean & Fresh.</Body>
        <Button label="Comenzar" onPress={() => navigation.replace("Login")} />
      </Card>
    </Page>
  );
}
export function LoginScreen({ navigation }: ScreenProps<"Login">) {
  const { execute } = useApp();
  const a = useAction();
  const [email, setEmail] = useState("maria.torres@gmail.com"),
    [password, setPassword] = useState("123456");
  return (
    <Page>
      <Text style={ui.title}>Tu lavandería, más fácil.</Text>
      <Body muted>Ingresa tus credenciales para continuar.</Body>
      <Card>
        <Field
          label="Correo electrónico"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          testID="login_email_input"
        />
        <Field
          label="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          testID="login_password_input"
        />
        {a.feedback}
        <Button
          label="Iniciar sesión"
          busy={a.busy}
          testID="login_submit_button"
          onPress={() => {
            void a.asyncRun(async () => {
              const hash = await passwordHash(password);
              execute((r) => r.login(email, hash));
            });
          }}
        />
        <Button
          label="Crear cuenta"
          secondary
          testID="login_register_button"
          onPress={() => navigation.navigate("RegisterStep1")}
        />
        <Button
          label="¿Olvidaste tu contraseña?"
          secondary
          onPress={() =>
            a.run(
              () => {},
              "Para recuperar el acceso, contacta a soporte@laundryfresh.com. En esta demo no se envían correos.",
            )
          }
        />
      </Card>
      <Card>
        <Title>Acceso rápido del prototipo</Title>
        <Body muted>Contraseña de las cuentas demo: 123456.</Body>
        <Button
          label="Cliente demo"
          secondary
          onPress={() => execute((r) => r.demoLogin("CLIENT"))}
        />
        <Button
          label="Chofer demo"
          secondary
          onPress={() => execute((r) => r.demoLogin("DRIVER"))}
        />
        <Button
          label="Chofer con contraseña temporal · Demo"
          secondary
          onPress={() => execute((r) => r.simulateTemporaryPassword())}
        />
        <Button
          label="Conocer Laundry"
          secondary
          onPress={() => navigation.navigate("Splash")}
        />
      </Card>
    </Page>
  );
}
export function RegisterScreen() {
  const { execute } = useApp();
  const a = useAction();
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [phone, setPhone] = useState(""),
    [password, setPassword] = useState("");
  return (
    <Page>
      <Body>
        Primero crea tu cuenta. Después verificaremos tu documento y selfie para
        habilitar tus solicitudes.
      </Body>
      <Card>
        <Field label="Nombre completo" value={name} onChangeText={setName} />
        <Field
          label="Correo electrónico"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Field
          label="Teléfono"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Field
          label="Contraseña nueva"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Body muted>Mínimo 8 caracteres, una mayúscula y un número.</Body>
        {a.feedback}
        <Button
          label="Continuar a verificación"
          busy={a.busy}
          onPress={() => {
            void a.asyncRun(async () => {
              if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password))
                throw Error(
                  "La contraseña debe tener 8 caracteres, una mayúscula y un número.",
                );
              const hash = await passwordHash(password);
              execute((r) => r.register(name, email, phone, hash));
            });
          }}
        />
      </Card>
    </Page>
  );
}
export function KycUploadScreen({ navigation }: ScreenProps<"KycUpload">) {
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  const a = useAction();
  const [type, setType] = useState(c.kycDocumentType),
    [number, setNumber] = useState(c.kycDocumentId ?? ""),
    [uri, setUri] = useState(c.documentUri);
  return (
    <Page>
      <Badge>Paso 1 de 2</Badge>
      <Body>Verifica tu identidad antes de solicitar recogidas.</Body>
      <Card>
        <Icon name="document-text-outline" size={42} />
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
            onPress={() => setType(t)}
          />
        ))}
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
        <Button
          label="Adjuntar documento simulado · Demo"
          secondary
          onPress={() => {
            setUri("demo://document");
            if (!number) setNumber("72819234");
          }}
        />
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
export function KycSelfieScreen() {
  const { execute } = useApp();
  const a = useAction();
  const [uri, setUri] = useState<string>();
  return (
    <Page>
      <Badge>Paso 2 de 2</Badge>
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
        <Button
          label="Adjuntar selfie simulada · Demo"
          secondary
          onPress={() => setUri("demo://selfie")}
        />
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
export function KycPendingScreen() {
  const { execute } = useApp();
  const a = useAction();
  return (
    <Page>
      <Card>
        <Icon name="hourglass-outline" size={48} />
        <Title>Estamos revisando tu identidad</Title>
        <Body>
          Tu documento y selfie fueron recibidos. Podrás solicitar servicios
          cuando se apruebe tu verificación.
        </Body>
        <Badge>Pendiente de revisión</Badge>
        {a.feedback}
        <Button
          label="Simular aprobación · Demo"
          onPress={() => a.run(() => execute((r) => r.simulateKyc(true)))}
        />
        <Button
          label="Simular rechazo · Demo"
          secondary
          onPress={() => a.run(() => execute((r) => r.simulateKyc(false)))}
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
export function KycRejectedScreen({ navigation }: ScreenProps<"KycRejected">) {
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
export function PasswordScreen({ forced = false }: { forced?: boolean }) {
  const { execute } = useApp();
  const a = useAction();
  const [current, setCurrent] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState("");
  return (
    <Page>
      <Card>
        <Icon name="lock-closed-outline" size={38} />
        <Title>
          {forced ? "Crea tu contraseña definitiva" : "Actualizar contraseña"}
        </Title>
        <Body>
          {forced
            ? "Tu cuenta tiene una contraseña temporal. Debes cambiarla antes de ingresar a la ruta."
            : "Ingresa tu contraseña actual y una nueva contraseña."}
        </Body>
        {!forced && (
          <Field
            label="Contraseña actual"
            secureTextEntry
            value={current}
            onChangeText={setCurrent}
          />
        )}
        <Field
          label="Nueva contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Field
          label="Confirmar contraseña"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />
        <Body muted>Mínimo 8 caracteres, una mayúscula y un número.</Body>
        {a.feedback}
        <Button
          label="Guardar contraseña"
          busy={a.busy}
          onPress={() => {
            void a.asyncRun(async () => {
              if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password))
                throw Error(
                  "La contraseña debe tener 8 caracteres, una mayúscula y un número.",
                );
              if (password !== confirm)
                throw Error("Las contraseñas no coinciden.");
              const [currentHash, hash] = await Promise.all([
                passwordHash(current),
                passwordHash(password),
              ]);
              execute((r) => r.changePassword(currentHash, hash, forced));
              setCurrent("");
              setPassword("");
              setConfirm("");
            }, "Contraseña actualizada.");
          }}
        />
        {forced && (
          <Button
            label="Cerrar sesión"
            secondary
            onPress={() => execute((r) => r.logout())}
          />
        )}
      </Card>
    </Page>
  );
}
