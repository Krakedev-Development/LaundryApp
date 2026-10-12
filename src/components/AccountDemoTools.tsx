import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useApp } from "../store/AppProvider";
import { ComponentCatalog } from "./ComponentCatalog";
import { ConfirmDialog } from "./overlay/OverlayPortal";
import { Accordion } from "./presentation";
import { Body, Button } from "./ui";

/** Local MVP tools, reachable from Cuenta without a second navigation menu. */
export function AccountDemoTools() {
  const { state, execute, reset } = useApp();
  const focused = useIsFocused();
  const isClient = state.session?.role === "CLIENT";
  const [resetConfirm, setResetConfirm] = useState(false);
  const [catalog, setCatalog] = useState(false);
  useEffect(() => {
    if (!focused) {
      setResetConfirm(false);
      setCatalog(false);
    }
  }, [focused]);
  return (
    <>
      <Accordion title="Herramientas de demostración">
        <Body muted>Opciones exclusivas del MVP local.</Body>
        <Button
          label={isClient ? "Cambiar a chofer demo" : "Cambiar a cliente demo"}
          secondary
          onPress={() =>
            execute((r) => r.demoLogin(isClient ? "DRIVER" : "CLIENT"))
          }
        />
        <Button
          label="Restablecer datos demo"
          secondary
          onPress={() => setResetConfirm(true)}
        />
        {__DEV__ && (
          <Button
            label="Catálogo de componentes"
            secondary
            onPress={() => setCatalog(true)}
          />
        )}
      </Accordion>
      {__DEV__ && (
        <ComponentCatalog
          visible={focused && catalog}
          onClose={() => setCatalog(false)}
        />
      )}
      <ConfirmDialog
        title="Restablecer demo"
        visible={focused && resetConfirm}
        onClose={() => setResetConfirm(false)}
        footer={
          <>
            <Button
              label="Restablecer demo"
              variant="danger"
              onPress={() => {
                setResetConfirm(false);
                reset();
              }}
            />
            <Button
              label="Conservar datos"
              secondary
              onPress={() => setResetConfirm(false)}
            />
          </>
        }
      >
        <Body>
          Se reemplazarán los pedidos, cuentas, saldo y mensajes locales por los
          ejemplos iniciales.
        </Body>
      </ConfirmDialog>
    </>
  );
}
