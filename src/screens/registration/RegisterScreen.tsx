import { useState } from "react";
import { Page } from "../../components/Page";
import { Body, Button, Card, Field, Title, useAction } from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { passwordHash } from "../../services/passwordHash";
import { authService } from "../../services/auth/authService";
import { syncFullCatalog } from "../../services/catalog/catalogService";

export function RegisterScreen() {
  const { execute } = useApp();
  const a = useAction();
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [phone, setPhone] = useState(""),
    [password, setPassword] = useState("");
  return (
    <Page
      footer={
        <>
          <Button
            label="Continuar a verificación"
            disabled={
              !name.trim() || !email.trim() || !phone.trim() || !password
            }
            busy={a.busy}
            onPress={() => {
              void a.asyncRun(async () => {
                if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password))
                  throw Error(
                    "La contraseña debe tener 8 caracteres, una mayúscula y un número.",
                  );
                const cleanEmail = email.trim().toLowerCase();
                if (
                  !name.trim() ||
                  !/^\S+@\S+\.\S+$/.test(cleanEmail) ||
                  phone.replace(/\D/g, "").length < 8
                )
                  throw Error("Revisa nombre, correo y teléfono.");
                const hash = await passwordHash(password);
                const response = await authService.register({
                  name: name.trim(),
                  email: cleanEmail,
                  phone: phone.trim(),
                  password,
                });
                await syncFullCatalog(response.tokens.accessToken);
                execute((r) =>
                  r.authenticateFromApi(response.user, hash, "APPROVED"),
                );
              });
            }}
          />
        </>
      }
    >
      <Body>
        Primero crea tu cuenta. Después verificaremos tu documento y selfie para
        habilitar tus solicitudes.
      </Body>
      <Card>
        <Title>Tu información</Title>
        <Field
          label="Nombre completo"
          value={name}
          onChangeText={setName}
          validate={(v) =>
            v.trim().length < 2 ? "Ingresa tu nombre completo." : undefined
          }
          autoComplete="name"
        />
        <Field
          label="Correo electrónico"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Field
          label="Teléfono"
          validate={(v) =>
            v.replace(/\D/g, "").length < 8
              ? "Ingresa al menos 8 dígitos."
              : undefined
          }
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Field
          label="Contraseña nueva"
          help="Mínimo 8 caracteres, una mayúscula y un número."
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {a.feedback}
      </Card>
    </Page>
  );
}
