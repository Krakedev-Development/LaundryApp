import { useState } from "react";
import { Text, View } from "react-native";
import { Page } from "../../components/Page";
import { Body, Button, Card, Field, useAction } from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";
import { LoginBrand, loginStyles } from "../../components/LoginPresentation";
import { passwordHash } from "../../services/passwordHash";

export function LoginScreen() {
  const navigation = useLaundryNavigation();
  const { execute } = useApp();
  const a = useAction();
  const [email, setEmail] = useState("maria.torres@gmail.com"),
    [password, setPassword] = useState("123456");
  return (
    <Page
      backgroundColor="#F7F8FD"
      contentContainerStyle={loginStyles.page}
    >
      <View style={loginStyles.content}>
        <LoginBrand />
        <Body muted style={loginStyles.subtitle}>
         Tu ropa siempre limpia, fresca y natural.
        </Body>
        <Card style={loginStyles.form}>
          <Field
            label="Correo electrónico"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            testID="login_email_input"
            leadingIcon="mail-outline"
            labelAccessory={<Text style={loginStyles.required}>Requerido</Text>}
            style={loginStyles.input}
          />
          <Field
            label="Contraseña"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            testID="login_password_input"
            leadingIcon="lock-closed-outline"
            style={loginStyles.input}
            labelAccessory={
              <Button
                label="¿Olvidaste tu contraseña?"
                variant="ghost"
                style={loginStyles.forgot}
                textStyle={loginStyles.forgotText}
                onPress={() =>
                  a.run(
                    () => {},
                    "Para recuperar el acceso, contacta a soporte@laundryfresh.com. En esta demo no se envían correos.",
                  )
                }
              />
            }
          />
          {a.feedback}
          <Button
            label="Iniciar sesión"
            icon="arrow-forward"
            disabled={!email.trim() || !password}
            busy={a.busy}
            testID="login_submit_button"
            style={loginStyles.submit}
            onPress={() => {
              void a.asyncRun(async () => {
                const hash = await passwordHash(password);
                execute((r) => r.login(email, hash));
              });
            }}
          />
          <View style={loginStyles.divider} />
        </Card>
        <View style={loginStyles.registration}>
          <Text style={loginStyles.registrationPrompt}>¿Aún no tienes cuenta?</Text>
          <Button
            label="Crear cuenta"
            secondary
            variant="ghost"
            style={loginStyles.register}
            textStyle={loginStyles.registerText}
            testID="login_register_button"
            onPress={() => navigation.navigate("RegisterStep1")}
          />
        </View>
        <View style={loginStyles.demo}>
          <Text style={loginStyles.demoTitle}>Acceso rápido demo</Text>
          <View style={loginStyles.demoRow}>
            <Button
              label="Cliente demo"
              secondary
              style={loginStyles.demoButton}
              onPress={() => execute((r) => r.demoLogin("CLIENT"))}
            />
            <Button
              label="Chofer demo"
              secondary
              style={loginStyles.demoButton}
              onPress={() => execute((r) => r.demoLogin("DRIVER"))}
            />
          </View>
        </View>
      </View>
    </Page>
  );
}
