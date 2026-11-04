import { useState } from "react";
import { Page } from "../../components/Page";
import {
  PaymentMethodCard,
  paymentMethodLabel,
  paymentStyles,
} from "../../components/PaymentsPresentation";
import { ConfirmDialog } from "../../components/overlay/OverlayPortal";
import { Body, Button, Empty, Title, useAction } from "../../components/ui";
import type { PaymentMethod } from "../../domain/models";
import { currentCustomer } from "../../domain/repository";
import { useLaundryNavigation } from "../../navigation/useLaundryNavigation";
import { useApp } from "../../store/AppProvider";

export function PaymentMethodsScreen() {
  const { state, execute } = useApp();
  const navigation = useLaundryNavigation();
  const action = useAction();
  const [removing, setRemoving] = useState<PaymentMethod>();
  const customer = currentCustomer(state);
  const methods = state.paymentMethods.filter(
    (method) => method.customerId === customer.id,
  );
  return (
    <Page>
      <Title style={paymentStyles.sectionTitle}>
        Mis tarjetas y cuentas bancarias
      </Title>
      {action.feedback}
      {methods.length === 0 && (
        <Empty text="Agrega una tarjeta o una cuenta bancaria para transferencia." />
      )}
      {methods.map((method) => (
        <PaymentMethodCard
          key={method.id}
          method={method}
          onDelete={() => setRemoving(method)}
          onMakeDefault={() =>
            action.run(
              () => execute((repo) => repo.setDefaultPaymentMethod(method.id)),
              "Método principal actualizado.",
            )
          }
        />
      ))}
      <Button
        label="Agregar método de pago"
        secondary
        icon="add-circle-outline"
        style={paymentStyles.addButton}
        onPress={() => navigation.navigate("ClientAddPaymentMethod")}
      />
      <Body muted>
        Métodos de demostración guardados en este dispositivo. No se realizan
        cobros ni transferencias reales.
      </Body>
      <ConfirmDialog
        title="Eliminar método de pago"
        visible={!!removing}
        onClose={() => setRemoving(undefined)}
        footer={
          <>
            <Button
              label="Conservar método"
              secondary
              onPress={() => setRemoving(undefined)}
            />
            <Button
              label="Confirmar eliminación del método"
              variant="danger"
              onPress={() => {
                if (
                  removing &&
                  action.run(
                    () =>
                      execute((repo) => repo.removePaymentMethod(removing.id)),
                    "Método de pago eliminado.",
                  )
                )
                  setRemoving(undefined);
              }}
            />
          </>
        }
      >
        <Body>
          ¿Deseas eliminar{" "}
          {removing ? paymentMethodLabel(removing) : "este método"}?
        </Body>
        {action.feedback}
      </ConfirmDialog>
    </Page>
  );
}
