import { contentTheme } from "../../design-system/classic";
import { BottomSheet } from "../../components/overlay/OverlayPortal";
import { useState } from "react";
import { FlatList, View } from "react-native";
import { Page } from "../../components/Page";
import {
  Badge,
  Body,
  Button,
  Card,
  Choice,
  Empty,
  Field,
  Icon,
  Title,
  useAction,
} from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { currentCustomer } from "../../domain/repository";
import { money } from "../../domain/models";

export function WalletScreen() {
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  const a = useAction();
  const [amount, setAmount] = useState("20"),
    [recharge, setRecharge] = useState(false);
  const charges = state.customerCharges.filter((ch) => ch.customerId === c.id);
  return (
    <Page scroll={false}>
      <FlatList
        data={state.walletTransactions.filter((tx) => tx.customerId === c.id)}
        keyExtractor={(tx) => tx.id}
        ListHeaderComponent={
          <View style={{ gap: 16 }}>
            <Card
              style={{
                backgroundColor: contentTheme.colors.soft,
                borderWidth: 1,
                borderColor: contentTheme.colors.border,
                borderRadius: 14,
              }}
            >
              <Icon name="wallet-outline" size={28} />
              <Title
                style={{
                  fontSize: 24,
                  lineHeight: 32,
                  color: contentTheme.colors.dark,
                }}
              >
                {money(c.walletBalance)}
              </Title>
              <Body>Saldo disponible en Billetera Laundry</Body>
              <Badge>Pagos y recargas demo</Badge>
            </Card>
            {!recharge && a.feedback}
            <Button
              label="Recargar billetera"
              icon="add"
              onPress={() => setRecharge(true)}
            />
            {charges.length > 0 && (
              <>
                <Title>Cargos de cuenta</Title>
                {charges.map((ch) => (
                  <Card key={ch.id}>
                    <Title>
                      {money(ch.amount)} ·{" "}
                      {ch.type === "LATE_CANCELLATION"
                        ? "Cancelación tardía"
                        : "Cargo de cuenta"}
                    </Title>
                    <Body>{ch.reason}</Body>
                    <Badge>
                      {ch.status === "PENDING"
                        ? "Pendiente"
                        : ch.status === "PAID"
                          ? "Pagado"
                          : "Exonerado"}
                    </Badge>
                    {ch.status === "PENDING" && (
                      <>
                        <Button
                          label="Pagar cargo con billetera"
                          onPress={() =>
                            a.run(
                              () => execute((r) => r.payCustomerCharge(ch.id)),
                              "Cargo regularizado.",
                            )
                          }
                        />
                        <Button
                          label="Pagar cargo con tarjeta · Demo"
                          secondary
                          onPress={() =>
                            a.run(
                              () =>
                                execute((r) =>
                                  r.payCustomerCharge(ch.id, "Tarjeta"),
                                ),
                              "Cargo regularizado.",
                            )
                          }
                        />
                      </>
                    )}
                  </Card>
                ))}
              </>
            )}
            <Title>Movimientos</Title>
          </View>
        }
        renderItem={({ item: tx }) => (
          <Card key={tx.id}>
            <Title>
              {tx.type === "DEBIT" ? "−" : "+"}
              {money(tx.amount)}
            </Title>
            <Body>{tx.description}</Body>
            <Body muted>
              {tx.reference} · {tx.date}
            </Body>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <Empty text="Tus recargas y pagos aparecerán aquí." />
        }
        contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
      />
      <BottomSheet
        title="Recargar billetera"
        visible={recharge}
        onClose={() => setRecharge(false)}
      >
        {["10", "20", "50", "100"].map((n) => (
          <Choice
            key={n}
            label={money(Number(n))}
            selected={amount === n}
            onPress={() => setAmount(n)}
          />
        ))}
        <Field
          label="Otro monto de recarga"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />
        {a.feedback}
        <Button
          label="Confirmar recarga · Demo"
          disabled={!Number.isFinite(Number(amount)) || Number(amount) <= 0}
          onPress={() => {
            if (
              a.run(
                () => execute((r) => r.addWalletCredit(Number(amount))),
                "Saldo recargado.",
              )
            )
              setRecharge(false);
          }}
        />
        <Body muted>
          La recarga se registra en este dispositivo. No se procesa una tarjeta
          real.
        </Body>
      </BottomSheet>
    </Page>
  );
}
