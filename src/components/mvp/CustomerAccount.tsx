import { useState } from "react";
import { Text, TextInput, View, Image } from "react-native";
import { useRouter } from "expo-router";
import {
  useBusinessStore,
  currentActor,
  businessService,
  flushBusiness,
  rechargeWallet,
  redeemReward,
  reservedRewardPoints,
} from "../../store/useBusinessStore";
import { Card, Action, Screen, ui } from "./ui";
export function CustomerAccount({
  section,
}: {
  section: "notifications" | "wallet" | "rewards" | "promotions";
}) {
  const state = useBusinessStore((s) => s.state)!,
    actor = currentActor(),
    router = useRouter(),
    customer = state.customers.find((c) => c.id === actor.id),
    reservedPoints = reservedRewardPoints(state, actor.id);
  const [amount, setAmount] = useState("25"),
    [error, setError] = useState("");
  if (actor.role !== "CLIENT" || !customer)
    return (
      <Screen title="Cuenta">
        <Text style={ui.error}>Esta cuenta está disponible para clientes.</Text>
      </Screen>
    );
  const run = async (fn: () => void) => {
    try {
      fn();
      await flushBusiness();
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  };
  return (
    <Screen
      title={
        {
          notifications: "Notificaciones",
          wallet: "Mi billetera",
          rewards: "Recompensas",
          promotions: "Promociones",
        }[section]
      }
    >
      {error && <Text style={ui.error}>{error}</Text>}
      {section === "notifications" && (
        <>
          <Action
            label="Marcar como leídas"
            onPress={() =>
              void run(() => businessService.markNotificationsRead())
            }
          />
          {state.notifications
            .filter((n) => n.customerId === actor.id)
            .slice()
            .reverse()
            .map((n) => (
              <Card key={n.id}>
                <Text style={ui.subtitle}>{n.orderId}</Text>
                <Text style={ui.text}>{n.message}</Text>
                <Text style={ui.muted}>
                  {n.at} · {n.read ? "Leída" : "Nueva"}
                </Text>
                <Action
                  label="Ver solicitud"
                  onPress={() =>
                    router.push({
                      pathname: "/(client)/order-detail",
                      params: { id: n.orderId },
                    })
                  }
                />
              </Card>
            ))}
        </>
      )}
      {section === "wallet" && (
        <>
          <Card>
            <Text style={ui.subtitle}>Saldo disponible</Text>
            <Text style={ui.title}>${customer.walletBalance.toFixed(2)}</Text>
            <Text style={ui.muted}>
              La recarga y los pagos de este MVP son demostraciones locales.
            </Text>
            <TextInput
              style={ui.input}
              accessibilityLabel="Importe de recarga"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />
            <Action
              label="Recargar saldo · Demo"
              onPress={() =>
                void run(() => rechargeWallet(Number(amount.replace(",", "."))))
              }
            />
          </Card>
          {state.payments
            .filter((p) => p.customerId === actor.id)
            .map((p) => (
              <Card key={p.id}>
                <Text style={ui.text}>
                  {p.orderId} · ${p.amount.toFixed(2)} · {p.method}
                </Text>
                <Text style={ui.muted}>{p.at}</Text>
              </Card>
            ))}
          {state.charges
            .filter((c) => c.customerId === actor.id)
            .map((c) => (
              <Card key={c.id}>
                <Text style={ui.text}>
                  {c.orderId} · ${c.amount.toFixed(2)} · {c.status}
                </Text>
                {c.status === "PENDING" && (
                  <Action
                    label="Pagar cargo · Demo"
                    onPress={() =>
                      void run(() => businessService.settleCharge(c.id))
                    }
                  />
                )}
              </Card>
            ))}
        </>
      )}
      {section === "rewards" && (
        <>
          <Card>
            <Text style={ui.subtitle}>Tus puntos</Text>
            <Text style={ui.title}>{customer.points}</Text>
            <Text style={ui.muted}>
              Los puntos se acreditan una sola vez cuando se completa un pedido.
              Los canjes reservan puntos hasta que el administrador los aprueba.
            </Text>
            <Text style={ui.muted}>
              {reservedPoints} reservados · {customer.points - reservedPoints}{" "}
              disponibles
            </Text>
          </Card>
          {state.rewards
            .filter((r) => r.status === "ACTIVE")
            .map((r) => (
              <Card key={r.id}>
                <Text style={ui.subtitle}>{r.name}</Text>
                <Text style={ui.text}>{r.description}</Text>
                <Text style={ui.badge}>
                  {r.pointsCost} puntos · {r.minPurchases} compras · gasto
                  mínimo ${r.minSpend}
                </Text>
                <Action
                  label="Canjear recompensa"
                  disabled={customer.points - reservedPoints < r.pointsCost}
                  onPress={() => void run(() => redeemReward(r.id))}
                />
              </Card>
            ))}
          {state.redemptions
            .filter((r) => r.customerId === actor.id)
            .map((r) => (
              <Card key={r.id}>
                <Text style={ui.subtitle}>
                  {state.rewards.find((reward) => reward.id === r.rewardId)
                    ?.name ?? r.rewardId}
                </Text>
                <Text style={ui.badge}>
                  {r.status ?? "APPROVED"} · {r.pointsSpent} puntos
                </Text>
                {r.reason && <Text style={ui.muted}>{r.reason}</Text>}
              </Card>
            ))}
          {state.pointsLedger
            .filter((p) => p.customerId === actor.id)
            .map((p) => (
              <Text key={p.id} style={ui.muted}>
                {p.points > 0 ? "+" : ""}
                {p.points} · {p.reason}
              </Text>
            ))}
        </>
      )}
      {section === "promotions" &&
        state.promotions
          .filter((p) => p.status === "ACTIVE")
          .map((p) => (
            <Card key={p.id}>
              {p.imageUrl && (
                <Image
                  source={{ uri: p.imageUrl }}
                  style={{ height: 150, borderRadius: 12 }}
                  resizeMode="contain"
                />
              )}
              <Text style={ui.subtitle}>{p.name}</Text>
              <Text style={ui.text}>{p.description}</Text>
              <Text selectable style={ui.badge}>
                {p.code}
              </Text>
              <Text style={ui.muted}>
                Mínimo ${p.minOrderAmount} · {p.startDate}–{p.endDate}
              </Text>
              <Action
                label="Solicitar con esta promoción"
                onPress={() => {
                  require("../../store/useOrderStore")
                    .useOrderStore.getState()
                    .setPromo(p.code, 0);
                  router.push("/(client)/new-order/step1-garments");
                }}
              />
            </Card>
          ))}
    </Screen>
  );
}
