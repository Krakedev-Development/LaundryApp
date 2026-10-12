import { useState } from "react";
import { Page } from "../../components/Page";
import { Body, Button, Card, Field, Icon, Title, useAction } from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { passwordHash } from "../../services/passwordHash";

export function PasswordScreen({ forced = false }: { forced?: boolean }) {
  const { execute } = useApp();
  const a = useAction();
  const [current, setCurrent] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState("");
  return (
    <Page
      footer={
        <>
          <Button
            label="Guardar contraseña"
            disabled={!password || !confirm || (!forced && !current)}
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
        </>
      }
    >
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
          help="Mínimo 8 caracteres, una mayúscula y un número."
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Field
          label="Confirmar contraseña"
          validate={(v) =>
            v !== password ? "Las contraseñas no coinciden." : undefined
          }
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />
        <Body muted>Mínimo 8 caracteres, una mayúscula y un número.</Body>
        {a.feedback}

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
