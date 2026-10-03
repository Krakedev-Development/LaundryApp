import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  AppHeader,
  Badge,
  BottomSheet,
  Button,
  Card,
  Chip,
  ConfirmationSheet,
  ErrorState,
  Field,
  Page,
  ui,
} from "../../components/ui";
import { useApp } from "../../store/AppStore";
import { useAction } from "../../hooks/useAction";
import {
  addDays,
  dateLabel,
  formatMoney,
  membershipRemaining,
  pointsBalance,
  reservedPoints,
  today,
  walletBalance,
} from "../../domain/rules";
import { PaymentCard, Reward } from "../../domain/models";
import { Colors as C } from "../../theme/colors";

export function BenefitsScreen({
  initial = "Promociones",
}: {
  initial?: string;
}) {
  const [tab, setTab] = useState(initial);
  return (
    <Page>
      <AppHeader
        title="Más beneficios para ti"
        subtitle="Cada pedido suma frescura"
        icon="gift-outline"
      />
      <View style={ui.wrap}>
        {["Promociones", "Recompensas", "Membresía"].map((t) => (
          <Chip
            key={t}
            title={t}
            selected={tab === t}
            onPress={() => setTab(t)}
          />
        ))}
      </View>
      {tab === "Promociones" ? (
        <PromotionsContent />
      ) : tab === "Recompensas" ? (
        <RewardsContent />
      ) : (
        <MembershipContent />
      )}
    </Page>
  );
}
function PromotionsContent() {
  const { data, engine } = useApp();
  const router = useRouter();
  const [detail, setDetail] = useState<string | null>(null);
  const selected = data.promotions.find((p) => p.id === detail);
  return (
    <>
      {data.promotions
        .filter(
          (p) =>
            p.status === "ACTIVE" &&
            p.startDate <= today() &&
            p.endDate >= today(),
        )
        .map((p) => (
          <Card key={p.id} style={{ backgroundColor: C.limeSoft }}>
            <Badge title={p.code} />
            <Text style={ui.section}>{p.name}</Text>
            <Text style={ui.body}>{p.description}</Text>
            <Text style={ui.meta}>
              Hasta {dateLabel(p.endDate)} · Compra mínima{" "}
              {formatMoney(p.minOrderAmount)}
            </Text>
            <Button
              title="Ver condiciones"
              variant="secondary"
              onPress={() => setDetail(p.id)}
            />
            <Button
              title="Usar promoción"
              onPress={() => {
                engine.update((d) => {
                  d.draft.promoCode = p.code;
                });
                router.push("/(client)/new-order/garments");
              }}
            />
          </Card>
        ))}
      <BottomSheet
        visible={!!selected}
        title={selected?.name ?? ""}
        onClose={() => setDetail(null)}
      >
        {!!selected && (
          <>
            <Text style={ui.body}>{selected.description}</Text>
            <Text style={ui.muted}>
              Servicios: {selected.applicableServices.join(", ")}
            </Text>
            <Text style={ui.body}>
              Mínimo: {formatMoney(selected.minOrderAmount)}. Máximo{" "}
              {selected.perCustomerLimit} usos por cliente.
              {selected.firstOrderOnly ? " Solo primer pedido." : ""}
            </Text>
            <Text style={ui.meta}>
              Del {dateLabel(selected.startDate)} al{" "}
              {dateLabel(selected.endDate)}. Sujeto a vigencia y cupos.
            </Text>
          </>
        )}
      </BottomSheet>
    </>
  );
}
function RewardsContent() {
  const { data, session, engine, online } = useApp();
  const c = engine.customer(session!);
  const a = useAction();
  const [reward, setReward] = useState<Reward | null>(null);
  const balance = pointsBalance(data, c.id);
  const reserved = reservedPoints(data, c.id);
  const pending = data.redemptions.filter((r) => r.customerId === c.id);
  return (
    <>
      <Card style={{ backgroundColor: C.purpleSoft }}>
        <Badge title="Puntos Fresh" tone="purple" />
        <Text style={[ui.hero, { color: C.purple }]}>
          {balance.toLocaleString()} pts
        </Text>
        <Text style={ui.muted}>
          Disponibles para canje: {(balance - reserved).toLocaleString()}
          {reserved > 0 ? ` · ${reserved} reservados` : ""}
        </Text>
        <View style={{ height: 6, borderRadius: 8, backgroundColor: C.border }}>
          <View
            style={{
              height: 6,
              borderRadius: 8,
              width: `${Math.min(100, (balance / 2000) * 100)}%`,
              backgroundColor: C.purple,
            }}
          />
        </View>
        <Text style={ui.meta}>Tu progreso hacia 2,000 puntos.</Text>
      </Card>
      {data.rewards
        .filter((r) => r.active)
        .map((r) => (
          <Card key={r.id}>
            <Text style={ui.section}>{r.name}</Text>
            <Text style={ui.muted}>{r.description}</Text>
            <Badge title={`${r.pointsCost} puntos`} tone="purple" />
            <Text style={ui.meta}>
              Desde {r.minPurchases} compras y {formatMoney(r.minSpend)}{" "}
              acumulados. Vigencia: {r.validityDays} días tras aprobar.
            </Text>
            <Button
              title="Canjear"
              variant="secondary"
              disabled={balance - reserved < r.pointsCost || !online}
              onPress={() => setReward(r)}
            />
          </Card>
        ))}
      {!!(pending.length > 0) && (
        <Text style={ui.section}>Tus solicitudes de canje</Text>
      )}
      {pending.map((r) => (
        <Card key={r.id}>
          <Text style={ui.body}>{r.rewardName}</Text>
          <Badge
            title={
              r.status === "PENDING"
                ? "Pendiente de aprobación"
                : r.status === "APPROVED"
                  ? r.benefitApplied
                    ? "Beneficio aplicado"
                    : "Aprobado · Disponible"
                  : "Rechazado"
            }
            tone={
              r.status === "PENDING"
                ? "warning"
                : r.status === "APPROVED"
                  ? "success"
                  : "danger"
            }
          />
          <Text style={ui.meta}>
            {r.points} puntos · {dateLabel(r.date)}
          </Text>
          {!!r.reason && <Text style={ui.muted}>{r.reason}</Text>}
          {!!(r.status === "PENDING") && (
            <>
              <Text style={ui.meta}>
                Demo: consulta para recibir la respuesta administrativa
                simulada.
              </Text>
              <Button
                title="Consultar estado del canje"
                variant="secondary"
                busy={a.busy}
                onPress={() =>
                  a.run(async () => {
                    await new Promise((resolve) => setTimeout(resolve, 700));
                    engine.reviewReward(r.id, true);
                  }, "Respuesta de revisión recibida")
                }
              />
            </>
          )}
        </Card>
      ))}
      <Card>
        <Text style={ui.section}>Movimientos de puntos</Text>
        {data.pointsLedger
          .filter((p) => p.customerId === c.id)
          .slice()
          .reverse()
          .map((p) => (
            <View key={p.id} style={ui.between}>
              <View style={{ flex: 1 }}>
                <Text style={ui.body}>
                  {p.type === "EARN"
                    ? "Puntos por tu pedido"
                    : p.type === "REDEEM"
                      ? "Canje aprobado"
                      : "Saldo inicial / ajuste"}
                </Text>
                <Text style={ui.meta}>{p.reference}</Text>
              </View>
              <Text style={ui.section}>
                {p.points > 0 ? "+" : ""}
                {p.points}
              </Text>
            </View>
          ))}
      </Card>
      <ConfirmationSheet
        visible={!!reward}
        title="Solicitar canje"
        text={
          reward
            ? `¿Canjear ${reward.pointsCost} puntos por ${reward.name}? Saldo disponible: ${balance - reserved}. Restante: ${balance - reserved - reward.pointsCost}. Quedará pendiente de aprobación.`
            : ""
        }
        onClose={() => setReward(null)}
        confirm={() =>
          a.run(() => {
            engine.requestReward(session!, reward!.id, online);
            setReward(null);
          }, "Solicitud enviada · Pendiente de aprobación")
        }
      />
      {!!a.error && <ErrorState text={a.error} />}
    </>
  );
}
function MembershipContent() {
  const { data, session, engine, online } = useApp();
  const c = engine.customer(session!);
  const a = useAction();
  const [selected, setSelected] = useState<string | null>(null);
  const current = data.plans.find((p) => p.id === c.membershipId);
  return (
    <>
      <Card style={{ backgroundColor: C.purpleSoft }}>
        <Badge
          title={current ? `Tu plan ${current.name}` : "Sin membresía activa"}
          tone="purple"
        />
        {!!current && (
          <>
            <Text style={ui.hero}>
              {formatMoney(current.priceMonthly)} / mes
            </Text>
            <Text style={ui.body}>
              Próxima renovación: {dateLabel(c.membershipRenewal)}
            </Text>
            <Text style={ui.muted}>
              {membershipRemaining(data, c)} recogidas disponibles de{" "}
              {current.weeklyPickups} esta semana
            </Text>
            <Text style={ui.meta}>
              La facturación mensual está simulada en este prototipo.
            </Text>
          </>
        )}
      </Card>
      {data.plans.map((p) => (
        <Card key={p.id}>
          <View style={ui.between}>
            <Text style={ui.section}>{p.name}</Text>
            {!!(p.id === c.membershipId) && (
              <Badge title="Actual" tone="purple" />
            )}
          </View>
          <Text style={ui.title}>{formatMoney(p.priceMonthly)} / mes</Text>
          {p.benefits.map((b) => (
            <Text key={b} style={ui.body}>
              ✓ {b}
            </Text>
          ))}
          <Text style={ui.meta}>
            {p.garmentLimit
              ? `${p.garmentLimit} prendas por recogida`
              : "Sin límite de prendas por recogida"}
          </Text>
          <Button
            title={p.id === c.membershipId ? "Plan actual" : "Seleccionar plan"}
            variant="secondary"
            disabled={p.id === c.membershipId || !online}
            onPress={() => setSelected(p.id)}
          />
        </Card>
      ))}
      <ConfirmationSheet
        visible={!!selected}
        title="Confirmar membresía"
        text="Actualizaremos tu plan en la demo. La renovación y el cobro recurrente requieren conectar la pasarela de pagos."
        onClose={() => setSelected(null)}
        confirm={() =>
          a.run(() => {
            if (!online) throw new Error("Conéctate para cambiar de plan.");
            engine.update((d) => {
              const user = d.customers.find((v) => v.id === c.id)!;
              user.membershipId = selected!;
              user.membershipRenewal = addDays(today(), 30);
            });
            setSelected(null);
          }, "Membresía actualizada")
        }
      />
      {!!a.error && <ErrorState text={a.error} />}
    </>
  );
}
export function WalletScreen() {
  const { data, engine, session, online } = useApp();
  const c = engine.customer(session!);
  const a = useAction();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("20");
  const [cardId, setCard] = useState(
    data.cards.find((v) => v.customerId === c.id && v.primary)?.id ?? "",
  );
  const txs = data.walletTransactions.filter((t) => t.walletId === c.walletId);
  return (
    <Page>
      <AppHeader title="Billetera" icon="wallet-outline" />
      <View style={ui.heroCard}>
        <Text style={{ color: C.surface }}>Saldo disponible</Text>
        <Text style={[ui.hero, { color: C.surface }]}>
          {formatMoney(walletBalance(data, c.id))}
        </Text>
        <Button
          title="Recargar"
          icon="add"
          variant="lime"
          onPress={() => setOpen(true)}
        />
      </View>
      <Text style={ui.section}>Movimientos</Text>
      {txs
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((t) => (
          <Card key={t.id}>
            <View style={ui.between}>
              <View style={{ flex: 1 }}>
                <Text style={ui.body}>{t.description}</Text>
                <Text style={ui.meta}>
                  {t.reference} · {dateLabel(t.date)}
                </Text>
              </View>
              <Text
                style={[
                  ui.section,
                  { color: t.type === "DEBIT" ? C.text : C.primary },
                ]}
              >
                {t.type === "DEBIT" ? "−" : "+"}
                {formatMoney(t.amount)}
              </Text>
            </View>
          </Card>
        ))}
      {!txs.length && (
        <Text style={ui.muted}>Aún no tienes movimientos.</Text>
      )}
      <BottomSheet
        visible={open}
        title="Recargar saldo"
        onClose={() => setOpen(false)}
      >
        <View style={ui.wrap}>
          {[10, 20, 30, 50, 100].map((n) => (
            <Chip
              key={n}
              title={formatMoney(n)}
              selected={Number(amount) === n}
              onPress={() => setAmount(String(n))}
            />
          ))}
        </View>
        <Field
          label="Otro monto"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        <Text style={ui.section}>Método</Text>
        {data.cards
          .filter((v) => v.customerId === c.id)
          .map((card) => (
            <Chip
              key={card.id}
              title={`${card.brand} •••• ${card.last4}`}
              selected={cardId === card.id}
              onPress={() => setCard(card.id)}
            />
          ))}
        <Button
          title="Agregar tarjeta"
          variant="secondary"
          onPress={() => {
            setOpen(false);
            router.push("/(client)/payments");
          }}
        />
        <Text style={ui.body}>
          Recarga simulada: {formatMoney(Number(amount) || 0)}
        </Text>
        <Button
          title="Recargar"
          busy={a.busy}
          disabled={!online}
          onPress={() =>
            a.run(async () => {
              const card = engine.data.cards.find(
                (v) => v.id === cardId && v.customerId === c.id,
              );
              if (!card)
                throw new Error("Selecciona una tarjeta para recargar.");
              await new Promise((r) => setTimeout(r, 600));
              if (card.last4 === "0002")
                throw new Error(
                  "No pudimos procesar el pago con esta tarjeta de prueba. Elige otra.",
                );
              engine.walletCredit(session!, Number(amount), online);
              setOpen(false);
            }, "Saldo actualizado")
          }
        />
        {!!a.error && <ErrorState text={a.error} />}
      </BottomSheet>
    </Page>
  );
}
export function PaymentsScreen() {
  const { session, engine, data } = useApp();
  const c = engine.customer(session!);
  const a = useAction();
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState("Visa");
  const [last4, setLast4] = useState("");
  const [expiry, setExpiry] = useState("");
  const [deleting, setDeleting] = useState<PaymentCard | null>(null);
  return (
    <Page>
      <AppHeader title="Métodos de pago" icon="card-outline" />
      <Text style={ui.muted}>
        Tarjetas de prueba. Guarda solamente una marca y cuatro dígitos; no
        ingreses datos bancarios reales.
      </Text>
      {data.cards
        .filter((v) => v.customerId === c.id)
        .map((card) => (
          <Card key={card.id}>
            <Text style={ui.title}>
              {card.brand} •••• {card.last4}
            </Text>
            <Text style={ui.meta}>Vence {card.expiry}</Text>
            {!!card.primary && <Badge title="Principal" />}
            <View style={ui.wrap}>
              {!card.primary && (
                <Button
                  title="Establecer principal"
                  variant="secondary"
                  onPress={() =>
                    a.run(
                      () =>
                        engine.update((d) => {
                          d.cards
                            .filter((v) => v.customerId === c.id)
                            .forEach((v) => {
                              v.primary = v.id === card.id;
                            });
                        }),
                      "Tarjeta principal actualizada",
                    )
                  }
                />
              )}
              <Button
                title="Eliminar"
                variant="secondary"
                onPress={() => setDeleting(card)}
              />
            </View>
          </Card>
        ))}
      <Button
        title="Agregar tarjeta de prueba"
        icon="add"
        onPress={() => setOpen(true)}
      />
      <BottomSheet
        visible={open}
        title="Agregar tarjeta de prueba"
        onClose={() => setOpen(false)}
      >
        <View style={ui.wrap}>
          {["Visa", "Mastercard"].map((b) => (
            <Chip
              key={b}
              title={b}
              selected={brand === b}
              onPress={() => setBrand(b)}
            />
          ))}
        </View>
        <Field
          label="Últimos cuatro dígitos"
          value={last4}
          onChangeText={setLast4}
          maxLength={4}
          keyboardType="number-pad"
        />
        <Field
          label="Vencimiento MM/AA"
          value={expiry}
          onChangeText={setExpiry}
          placeholder="12/28"
          maxLength={5}
        />
        <Text style={ui.meta}>
          Usa 4242 para pago aprobado o 0002 para simular un rechazo.
        </Text>
        <Button
          title="Guardar tarjeta"
          busy={a.busy}
          onPress={() =>
            a.run(() => {
              if (
                !/^\d{4}$/.test(last4) ||
                !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)
              )
                throw new Error("Revisa los cuatro dígitos y la fecha MM/AA.");
              const [month, year] = expiry.split("/").map(Number);
              if (new Date(2000 + year, month, 1).getTime() <= Date.now())
                throw new Error("La tarjeta de prueba está vencida.");
              engine.update((d) => {
                d.cards.push({
                  id: engine.id(d, "card"),
                  customerId: c.id,
                  brand,
                  last4,
                  expiry,
                  primary: !d.cards.some((v) => v.customerId === c.id),
                });
              });
              setOpen(false);
            }, "Tarjeta guardada")
          }
        />
        {!!a.error && <ErrorState text={a.error} />}
      </BottomSheet>
      <ConfirmationSheet
        visible={!!deleting}
        title="Eliminar tarjeta"
        text="Podrás agregar otra tarjeta de prueba cuando la necesites."
        danger
        onClose={() => setDeleting(null)}
        confirm={() =>
          a.run(() => {
            engine.update((d) => {
              d.cards = d.cards.filter((v) => v.id !== deleting?.id);
              const cards = d.cards.filter((v) => v.customerId === c.id);
              if (cards.length && !cards.some((v) => v.primary))
                cards[0].primary = true;
            });
            setDeleting(null);
          }, "Tarjeta eliminada")
        }
      />
      {!!a.error && <ErrorState text={a.error} />}
    </Page>
  );
}
