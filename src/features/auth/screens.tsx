import React, { useState } from "react";
import { Image, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  AppHeader,
  Badge,
  BottomSheet,
  Button,
  Card,
  ErrorState,
  Field,
  Page,
  PasswordField,
  ui,
} from "../../components/ui";
import { useApp } from "../../store/AppStore";
import { useAction } from "../../hooks/useAction";
import { Colors as C } from "../../theme/colors";
import { businessConfig } from "../../config/business";

export function LoginScreen() {
  const { store, session, data } = useApp();
  const router = useRouter();
  const a = useAction();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [demo, setDemo] = useState(false);
  if (session) return <Redirect href="/" />;
  return (
    <Page>
      <Image
        source={require("../../../assets/logo-laundry.png")}
        accessibilityLabel="Laundry Clean & Fresh"
        style={{ width: "100%", height: 100, marginTop: 16 }}
        resizeMode="contain"
      />
      <View style={[ui.heroCard, { marginTop: 24, paddingVertical: 36 }]}>
        <Badge title="Laundry Clean & Fresh" />
        <Text style={[ui.hero, { color: C.surface }]}>
          Tu lavandería,{"\n"}más fácil.
        </Text>
        <Text style={{ color: C.surface, lineHeight: 22 }}>
          Ropa impecable. Más tiempo para ti.
        </Text>
      </View>
      <Card>
        <Text style={ui.section}>Bienvenido de nuevo</Text>
        <Field
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <PasswordField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
        />
        {!!a.error && <ErrorState text={a.error} />}
        <Button
          title="Iniciar sesión"
          busy={a.busy}
          onPress={() =>
            a.run(async () => {
              await store.login(email, password);
              router.replace("/");
            })
          }
        />
        <Button
          title="¿Olvidaste tu contraseña?"
          variant="secondary"
          onPress={() => router.push("/(auth)/recover")}
        />
      </Card>
      <Button
        title="Crear cuenta"
        variant="secondary"
        onPress={() => router.push("/(auth)/register")}
      />
      <Button
        title="Cuentas de demostración"
        variant="secondary"
        icon="flask-outline"
        onPress={() => setDemo(true)}
      />
      <Text style={[ui.meta, { textAlign: "center" }]}>
        Prototipo · Los pagos y la operación de planta son simulados.
      </Text>
      <BottomSheet
        visible={demo}
        title="Explora el prototipo"
        onClose={() => setDemo(false)}
      >
        <Text style={ui.muted}>
          Selecciona una cuenta para rellenar sus credenciales. El rol está
          asociado a la cuenta.
        </Text>
        {[
          data.customers[0],
          data.customers.find((c) => c.id === "CUST-DEMO"),
          data.customers.find((c) => c.kycStatus === "PENDING"),
          data.customers.find((c) => c.kycStatus === "REJECTED"),
          data.drivers[0],
          data.drivers.find((d) => d.id === "DRV-102"),
          data.drivers.find((d) => d.id === "DRV-103"),
          data.drivers.find((d) => d.id === "DRV-105"),
        ]
          .filter((user) => user != null)
          .map((user) => (
            <Card key={user.id}>
              <Text style={ui.section}>{user.name}</Text>
              <Text style={ui.meta}>{user.email}</Text>
              <Badge
                title={
                  "mustChangePassword" in user
                    ? user.mustChangePassword
                      ? "Chofer · Contraseña temporal"
                      : "Chofer · Ruta asignada"
                    : user.id === "CUST-DEMO"
                      ? "Cliente · Sin pedidos"
                      : `Cliente · ${user.kycStatus === "APPROVED" ? "Verificado" : user.kycStatus === "PENDING" ? "Pendiente" : "Rechazado"}`
                }
              />
              <Button
                title="Usar esta cuenta"
                variant="secondary"
                onPress={() => {
                  setEmail(user.email);
                  setPassword(
                    "mustChangePassword" in user && user.mustChangePassword
                      ? businessConfig.temporaryPassword
                      : businessConfig.demoPassword,
                  );
                  setDemo(false);
                }}
              />
            </Card>
          ))}
      </BottomSheet>
    </Page>
  );
}
export function RegisterScreen() {
  const { store } = useApp();
  const router = useRouter();
  const a = useAction();
  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const change = (key: keyof typeof form) => (value: string) =>
    setForm({ ...form, [key]: value });
  return (
    <Page>
      <AppHeader title="Crea tu cuenta" subtitle="Paso 1 de 3 · Tus datos" />
      <Text style={ui.muted}>
        Tu ropa limpia sin salir de casa. Comencemos por conocerte.
      </Text>
      <Card>
        <Field label="Nombre" value={form.name} onChangeText={change("name")} />
        <Field
          label="Apellido"
          value={form.surname}
          onChangeText={change("surname")}
        />
        <Field
          label="Email"
          value={form.email}
          onChangeText={change("email")}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Field
          label="Teléfono"
          value={form.phone}
          onChangeText={change("phone")}
          keyboardType="phone-pad"
        />
        <PasswordField
          label="Contraseña"
          value={form.password}
          onChangeText={change("password")}
        />
        <PasswordField
          label="Confirmar contraseña"
          value={form.confirm}
          onChangeText={change("confirm")}
        />
        <Text style={ui.meta}>
          Mínimo 8 caracteres, una mayúscula, una minúscula y un número.
        </Text>
      </Card>
      {!!a.error && <ErrorState text={a.error} />}
      <Button
        title="Continuar"
        busy={a.busy}
        onPress={() =>
          a.run(async () => {
            if (!form.name.trim()) throw new Error("Completa tu nombre.");
            if (!form.surname.trim()) throw new Error("Completa tu apellido.");
            if (form.password !== form.confirm)
              throw new Error("Las contraseñas no coinciden.");
            await store.register(
              `${form.name} ${form.surname}`,
              form.email,
              form.phone,
              form.password,
            );
            router.replace("/(auth)/kyc");
          })
        }
      />
    </Page>
  );
}
export function RecoverScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const a = useAction();
  return (
    <Page>
      <AppHeader title="Recupera tu acceso" icon="key-outline" />
      <Card>
        {sent ? (
          <>
            <Badge title="Revisa tu correo" tone="success" />
            <Text style={ui.body}>
              En una cuenta conectada recibirías un enlace para recuperar tu
              acceso. Esta demo no envía correos.
            </Text>
            <Button
              title="Volver al inicio de sesión"
              onPress={() => router.replace("/(auth)/login")}
              variant="secondary"
            />
          </>
        ) : (
          <>
            <Text style={ui.muted}>
              Ingresa el correo asociado a tu cuenta.
            </Text>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              title="Enviar enlace"
              busy={a.busy}
              onPress={() =>
                a.run(() => {
                  if (!/^\S+@\S+\.\S+$/.test(email))
                    throw new Error("Ingresa un correo válido.");
                  setSent(true);
                })
              }
            />
          </>
        )}
        {!!a.error && <ErrorState text={a.error} />}
      </Card>
    </Page>
  );
}
export async function captureImage(camera: boolean) {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted)
      throw new Error(
        "Necesitamos permiso de cámara. Puedes subir una imagen o habilitarlo en configuración.",
      );
  }
  const result = camera
    ? await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.5,
      })
    : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.5,
      });
  return result.canceled ? undefined : result.assets[0].uri;
}
export function KycScreen() {
  const { session, data, store } = useApp();
  const router = useRouter();
  const a = useAction();
  const [step, setStep] = useState(2);
  const [document, setDocument] = useState("");
  const [selfie, setSelfie] = useState("");
  const [docId, setDocId] = useState("");
  if (!session || session.role !== "CLIENTE") return <Redirect href="/" />;
  const customer = data.customers.find((c) => c.id === session.userId)!;
  if (customer.kycStatus === "APPROVED") return <Redirect href="/" />;
  if (customer.kycStatus === "PENDING")
    return <Redirect href="/(auth)/pending" />;
  const choose = (camera: boolean) =>
    a.run(async () => {
      const uri = await captureImage(camera);
      if (uri) step === 2 ? setDocument(uri) : setSelfie(uri);
    });
  return (
    <Page>
      <AppHeader
        title={step === 2 ? "Verifica tu identidad" : "Una selfie y listo"}
        subtitle={`Paso ${step} de 3`}
        icon="shield-checkmark-outline"
      />
      <Text style={ui.muted}>
        {step === 2
          ? "Necesitamos verificar tu identidad antes de habilitar solicitudes."
          : "Buena iluminación, rostro completo y sin accesorios que oculten tu cara."}
      </Text>
      {!!customer.kycRejectionReason && (
        <ErrorState text={customer.kycRejectionReason} />
      )}
      <Card>
        {!!(step === 2) && (
          <Field
            label="Número de cédula / documento"
            value={docId}
            onChangeText={setDocId}
          />
        )}
        <Button
          title={step === 2 ? "Tomar foto del documento" : "Tomar selfie"}
          icon="camera-outline"
          onPress={() => choose(true)}
        />
        <Button
          title="Subir imagen"
          icon="image-outline"
          variant="secondary"
          onPress={() => choose(false)}
        />
        {(step === 2 ? document : selfie) ? (
          <Image
            accessibilityLabel={
              step === 2
                ? "Vista previa del documento"
                : "Vista previa de la selfie"
            }
            source={{ uri: step === 2 ? document : selfie }}
            style={{ width: "100%", height: 220, borderRadius: 12 }}
            resizeMode="contain"
          />
        ) : (
          <Text style={ui.meta}>La vista previa aparecerá aquí.</Text>
        )}
      </Card>
      {!!a.error && <ErrorState text={a.error} />}
      <Button
        title={step === 2 ? "Continuar" : "Enviar verificación"}
        busy={a.busy}
        disabled={step === 2 ? !document || docId.trim().length < 5 : !selfie}
        onPress={() =>
          a.run(async () => {
            if (step === 2) setStep(3);
            else {
              await store.submitKyc(document, selfie, docId);
              router.replace("/(auth)/pending");
            }
          })
        }
      />
      {!!(step === 3) && (
        <Button
          title="Revisar documento"
          variant="secondary"
          onPress={() => setStep(2)}
        />
      )}
      <Button
        title="Cerrar sesión"
        variant="secondary"
        onPress={() => a.run(() => store.logout())}
      />
    </Page>
  );
}
export function PendingScreen() {
  const { session, data, store } = useApp();
  const router = useRouter();
  const a = useAction();
  if (!session || session.role !== "CLIENTE") return <Redirect href="/" />;
  const c = data.customers.find((c) => c.id === session.userId)!;
  if (c.kycStatus === "APPROVED") return <Redirect href="/" />;
  const rejected = c.kycStatus === "REJECTED";
  return (
    <Page>
      <AppHeader
        title={
          rejected
            ? "Necesitamos nueva información"
            : "Estamos verificando tu cuenta"
        }
        icon="shield-outline"
      />
      <Card>
        <Badge
          title={
            rejected ? "Documentación rechazada" : "Pendiente de aprobación"
          }
          tone={rejected ? "danger" : "warning"}
        />
        <Text style={ui.body}>
          {rejected
            ? c.kycRejectionReason
            : "Te avisaremos cuando tu identidad sea aprobada."}
        </Text>
        <Text style={ui.muted}>
          {rejected
            ? "Envía una imagen legible de ambos datos del documento y una selfie con el rostro completo."
            : "Tus solicitudes se habilitarán después de la revisión."}
        </Text>
        {rejected ? (
          <Button
            title="Reenviar documentos"
            onPress={() => router.replace("/(auth)/kyc")}
          />
        ) : (
          <Button
            title="Ver estado"
            busy={a.busy}
            onPress={() =>
              a.run(async () => {
                await new Promise((r) => setTimeout(r, 900));
                store.reviewKyc(c.id, true);
              }, "Verificación aprobada en la simulación")
            }
          />
        )}
      </Card>
      <Text style={ui.meta}>
        Demo: consultar el estado simula la respuesta de revisión
        administrativa.
      </Text>
      {!!a.error && <ErrorState text={a.error} />}
      <Button
        title="Cerrar sesión"
        variant="secondary"
        onPress={() => a.run(() => store.logout())}
      />
    </Page>
  );
}
