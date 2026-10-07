import { useState } from "react";
import { Linking } from "react-native";
import { Page } from "../components/Page";
import {
  Badge,
  Body,
  Button,
  Card,
  Check,
  Choice,
  Empty,
  Field,
  Icon,
  Title,
  useAction,
} from "../components/ui";
import { useApp } from "../store/AppProvider";
import { currentCustomer } from "../domain/repository";
import { plans, promos, rewards } from "../domain/catalog";
import {
  money,
  operationalLabels,
  type Address,
  type Customer,
} from "../domain/models";
import type { ScreenProps } from "../navigation/routes";

export function ClientProfileScreen({
  navigation,
}: ScreenProps<"ClientProfile">) {
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  return (
    <Page>
      <Card>
        <Icon name="shield-checkmark-outline" size={36} />
        <Title>Tu cuenta Laundry</Title>
        <Badge>Identidad verificada</Badge>
        <Body>
          Membresía {c.membershipTier} · {c.loyaltyPoints} puntos
        </Body>
        <Body muted>Los datos de tu perfil están en el menú lateral.</Body>
      </Card>
      <Card>
        <Title>Direcciones y facturación</Title>
        <Button
          label="Direcciones guardadas"
          icon="location-outline"
          secondary
          onPress={() => navigation.navigate("ClientAddresses")}
        />
        <Button
          label="Datos de facturación"
          icon="receipt-outline"
          secondary
          onPress={() => navigation.navigate("ClientBilling")}
        />
      </Card>
      <Card>
        <Title>Saldo y beneficios</Title>
        <Button
          label={`Billetera Laundry · ${money(c.walletBalance)}`}
          icon="wallet-outline"
          secondary
          onPress={() => navigation.navigate("ClientWallet")}
        />
        <Button
          label="Métodos de pago"
          icon="card-outline"
          secondary
          onPress={() => navigation.navigate("ClientWallet")}
        />
        <Button
          label="Promociones, recompensas y membresía"
          icon="gift-outline"
          secondary
          onPress={() => navigation.navigate("ClientBenefits")}
        />
      </Card>
      <Card>
        <Title>Preferencias y seguridad</Title>
        <Button
          label="Notificaciones"
          secondary
          onPress={() => navigation.navigate("ClientNotifications")}
        />
        <Button
          label="Seguridad y contraseña"
          secondary
          onPress={() => navigation.navigate("ClientSecurity")}
        />
        <Button
          label="Ayuda y soporte"
          secondary
          onPress={() => navigation.navigate("ClientSupport")}
        />
      </Card>
      <Button
        label="Cerrar sesión"
        secondary
        onPress={() => execute((r) => r.logout())}
      />
    </Page>
  );
}
export function BenefitsScreen({ navigation }: ScreenProps<"ClientBenefits">) {
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  const a = useAction();
  const [tab, setTab] = useState("Promociones");
  return (
    <Page>
      <Card>
        {["Promociones", "Recompensas", "Membresía"].map((t) => (
          <Choice
            key={t}
            label={t}
            selected={tab === t}
            onPress={() => setTab(t)}
          />
        ))}
      </Card>
      {a.feedback}
      {tab === "Promociones" &&
        promos.map((p) => (
          <Card key={p.code}>
            <Icon name="pricetag-outline" />
            <Title>{p.code}</Title>
            <Body>{p.description}</Body>
            <Body muted>
              Mínimo en prendas {money(p.minOrderAmount)} · Válido hasta{" "}
              {p.validUntil}
            </Body>
            <Button
              label={`Usar ${p.code}`}
              onPress={() =>
                navigation.navigate("ClientNewOrderWizard", {
                  promoCode: p.code,
                })
              }
            />
          </Card>
        ))}
      {tab === "Recompensas" && (
        <>
          <Card>
            <Title>{c.loyaltyPoints} puntos disponibles</Title>
            <Body muted>
              Ganas 10 puntos por dólar al confirmar un servicio. Los canjes
              requieren aprobación.
            </Body>
          </Card>
          {rewards.map((r) => (
            <Card key={r.id}>
              <Title>{r.title}</Title>
              <Badge>{r.pointsCost} puntos</Badge>
              <Body>{r.description}</Body>
              <Button
                label={`Canjear ${r.title}`}
                disabled={c.loyaltyPoints < r.pointsCost}
                onPress={() =>
                  a.run(
                    () => execute((repo) => repo.redeemReward(r.id)),
                    "Canje solicitado. Pendiente de aprobación.",
                  )
                }
              />
            </Card>
          ))}
          <Title>Mis canjes</Title>
          {state.loyaltyRedemptions
            .filter((r) => r.customerId === c.id)
            .map((r) => (
              <Card key={r.id}>
                <Title>{r.rewardTitle}</Title>
                <Body>
                  {r.pointsCost} puntos · {r.date}
                </Body>
                <Badge>{r.status}</Badge>
              </Card>
            ))}
        </>
      )}
      {tab === "Membresía" &&
        plans.map((plan) => (
          <Card key={plan.id}>
            <Title>
              {plan.name} · {money(plan.priceMonthly)} / mes
            </Title>
            {c.membershipTier === plan.name && <Badge>Plan actual</Badge>}
            {plan.benefits.map((b) => (
              <Body key={b}>{b}</Body>
            ))}
            <Button
              label={`Elegir plan ${plan.name} · Demo`}
              secondary
              disabled={c.membershipTier === plan.name}
              onPress={() =>
                a.run(
                  () => execute((r) => r.changeMembershipPlan(plan.name)),
                  `Membresía ${plan.name} seleccionada.`,
                )
              }
            />
          </Card>
        ))}
    </Page>
  );
}
export function WalletScreen() {
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  const a = useAction();
  const [amount, setAmount] = useState("20");
  const charges = state.customerCharges.filter((ch) => ch.customerId === c.id);
  return (
    <Page>
      <Card>
        <Icon name="wallet-outline" size={38} />
        <Title>{money(c.walletBalance)}</Title>
        <Body>Saldo disponible en Billetera Laundry</Body>
        <Badge>Pagos y recargas demo</Badge>
      </Card>
      {a.feedback}
      <Card>
        <Title>Recargar billetera</Title>
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
        <Button
          label="Confirmar recarga · Demo"
          onPress={() =>
            a.run(
              () => execute((r) => r.addWalletCredit(Number(amount))),
              "Saldo recargado.",
            )
          }
        />
        <Body muted>
          La recarga se registra en este dispositivo. No se procesa una tarjeta
          real.
        </Body>
      </Card>
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
                          execute((r) => r.payCustomerCharge(ch.id, "Tarjeta")),
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
      <Card>
        <Title>Métodos de pago</Title>
        <Body>Tarjeta Visa · •••• 4242 · Demo</Body>
        <Body>Billetera Laundry</Body>
        <Body muted>Selecciona el método al confirmar tu solicitud.</Body>
      </Card>
      <Title>Movimientos</Title>
      {state.walletTransactions
        .filter((tx) => tx.customerId === c.id)
        .map((tx) => (
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
        ))}
    </Page>
  );
}
const newAddress = (): Address => ({
  id: `addr-${Date.now()}`,
  title: "",
  fullAddress: "",
  reference: "",
  isPrimary: false,
  latitude: -12.0965,
  longitude: -77.0354,
});
export function AddressesScreen() {
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  const a = useAction();
  const [draft, setDraft] = useState<Address | null>(null),
    [lat, setLat] = useState(""),
    [lng, setLng] = useState("");
  const edit = (address: Address) => {
    setDraft({ ...address });
    setLat(String(address.latitude));
    setLng(String(address.longitude));
  };
  return (
    <Page>
      {a.feedback}
      <Button
        label="Añadir dirección"
        icon="add"
        onPress={() => edit(newAddress())}
      />
      {draft && (
        <Card>
          <Title>
            {c.addresses.some((addr) => addr.id === draft.id)
              ? "Editar dirección"
              : "Nueva dirección"}
          </Title>
          <Field
            label="Nombre de dirección"
            value={draft.title}
            onChangeText={(title) => setDraft({ ...draft, title })}
          />
          <Field
            label="Dirección completa"
            value={draft.fullAddress}
            onChangeText={(fullAddress) => setDraft({ ...draft, fullAddress })}
          />
          <Field
            label="Referencia"
            value={draft.reference}
            onChangeText={(reference) => setDraft({ ...draft, reference })}
          />
          <Field
            label="Latitud"
            value={lat}
            onChangeText={setLat}
            keyboardType="numbers-and-punctuation"
          />
          <Field
            label="Longitud"
            value={lng}
            onChangeText={setLng}
            keyboardType="numbers-and-punctuation"
          />
          <Check
            label="Usar como dirección principal"
            checked={draft.isPrimary}
            onChange={(isPrimary) => setDraft({ ...draft, isPrimary })}
          />
          <Button
            label="Guardar dirección"
            onPress={() => {
              if (
                a.run(() => {
                  if (!lat.trim() || !lng.trim())
                    throw Error("Ingresa las coordenadas.");
                  execute((r) =>
                    r.saveAddress({
                      ...draft,
                      latitude: Number(lat),
                      longitude: Number(lng),
                    }),
                  );
                }, "Dirección guardada.")
              )
                setDraft(null);
            }}
          />
          <Button
            label="Cancelar edición"
            secondary
            onPress={() => setDraft(null)}
          />
        </Card>
      )}
      {c.addresses.length ? (
        c.addresses.map((addr) => (
          <Card key={addr.id}>
            <Icon name="location-outline" />
            <Title>{addr.title}</Title>
            {addr.isPrimary && <Badge>Principal</Badge>}
            <Body>{addr.fullAddress}</Body>
            <Body muted>{addr.reference}</Body>
            <Button
              label={`Editar ${addr.title}`}
              secondary
              onPress={() => edit(addr)}
            />
            {!addr.isPrimary && (
              <Button
                label={`Usar ${addr.title} como principal`}
                secondary
                onPress={() =>
                  a.run(() => execute((r) => r.setDefaultAddress(addr.id)))
                }
              />
            )}
            <Button
              label={`Eliminar ${addr.title}`}
              secondary
              onPress={() =>
                a.run(
                  () => execute((r) => r.removeAddress(addr.id)),
                  "Dirección eliminada.",
                )
              }
            />
          </Card>
        ))
      ) : (
        <Empty text="Aún no tienes direcciones guardadas." />
      )}
    </Page>
  );
}
export function BillingScreen() {
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  const a = useAction();
  const [draft, setDraft] = useState<
    Pick<
      Customer,
      | "billingName"
      | "billingTaxId"
      | "billingEmail"
      | "billingPhone"
      | "billingAddress"
    >
  >({
    billingName: c.billingName,
    billingTaxId: c.billingTaxId,
    billingEmail: c.billingEmail,
    billingPhone: c.billingPhone,
    billingAddress: c.billingAddress,
  });
  const fields = {
    billingName: "Nombre o razón social",
    billingTaxId: "Número tributario",
    billingEmail: "Correo de facturación",
    billingPhone: "Teléfono de facturación",
    billingAddress: "Dirección fiscal",
  } as const;
  return (
    <Page>
      <Card>
        <Icon name="receipt-outline" size={34} />
        {(Object.keys(fields) as (keyof typeof fields)[]).map((key) => (
          <Field
            key={key}
            label={fields[key]}
            value={draft[key]}
            onChangeText={(value) => setDraft({ ...draft, [key]: value })}
          />
        ))}
        {a.feedback}
        <Button
          label="Guardar datos de facturación"
          onPress={() =>
            a.run(
              () => execute((r) => r.updateBillingData(draft)),
              "Datos de facturación guardados.",
            )
          }
        />
      </Card>
    </Page>
  );
}
export function NotificationsScreen({
  navigation,
}: ScreenProps<"ClientNotifications">) {
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  const notifications = state.notifications.filter(
    (n) => n.customerId === c.id,
  );
  return (
    <Page>
      {notifications.length ? (
        notifications.map((n) => (
          <Card key={n.id}>
            <Icon name="notifications-outline" />
            <Title>{n.title}</Title>
            <Body>{n.body}</Body>
            <Body muted>{n.timeAgo}</Body>
            {!n.isRead && <Badge>Sin leer</Badge>}
            <Button
              label={
                n.relatedOrderId
                  ? `Ver solicitud ${n.relatedOrderId}`
                  : "Marcar como leída"
              }
              secondary
              onPress={() => {
                execute((r) => r.markNotificationRead(n.id));
                if (n.relatedOrderId)
                  navigation.navigate("ClientOrderDetail", {
                    orderId: n.relatedOrderId,
                  });
              }}
            />
          </Card>
        ))
      ) : (
        <Empty text="No tienes notificaciones." />
      )}
    </Page>
  );
}
const faqs = [
  [
    "¿Cómo solicito un servicio?",
    "Elige entrada y salida en domicilio o sede, añade prendas o peso estimado, selecciona extras y confirma tu agenda.",
  ],
  [
    "¿Cuándo pago la ropa por peso?",
    "Después del pesaje certificado en planta. Revisa el peso y valor final en el detalle de tu solicitud.",
  ],
  [
    "¿Puedo cambiar mi horario?",
    "Puedes reprogramar un tramo que aún no haya iniciado, con al menos 60 minutos de anticipación y sujeto a cupos.",
  ],
  [
    "¿Qué pasa si cancelo tarde?",
    "Se genera un cargo de $5.00. Debes regularizarlo para crear nuevas solicitudes.",
  ],
  [
    "¿Para qué sirve mi código QR?",
    "Identifica la transferencia de tus prendas al chofer o en sede. También puedes mostrar el código manual de seis dígitos.",
  ],
  [
    "¿Cómo funcionan los puntos?",
    "Ganas 10 puntos por dólar pagado en servicios. Puedes solicitar canjes que quedan pendientes de aprobación.",
  ],
];
export function SupportScreen() {
  const [open, setOpen] = useState<string>();
  const a = useAction();
  return (
    <Page>
      <Title>Preguntas frecuentes</Title>
      {faqs.map(([question, answer]) => (
        <Card key={question}>
          <Button
            label={question}
            secondary
            onPress={() => setOpen(open === question ? undefined : question)}
          />
          {open === question && <Body>{answer}</Body>}
        </Card>
      ))}
      <Card>
        <Title>Contacta a soporte</Title>
        <Body muted>Atención mediante correo electrónico.</Body>
        {a.feedback}
        <Button
          label="Escribir a soporte"
          icon="mail-outline"
          onPress={() => {
            void a.asyncRun(() =>
              Linking.openURL("mailto:soporte@laundryfresh.com"),
            );
          }}
        />
      </Card>
    </Page>
  );
}
export function DriverProfileScreen() {
  const { state, execute } = useApp();
  const d = state.driver;
  return (
    <Page>
      <Card>
        <Icon name="car-outline" size={36} />
        <Title>Tu operación Laundry</Title>
        <Badge>{operationalLabels[d.operationalStatus]}</Badge>
        <Body muted>Los datos de tu perfil están en el menú lateral.</Body>
      </Card>
      <Card>
        <Title>Vehículo asignado</Title>
        <Body>
          {d.vehicleModel} · {d.vehicleColor}
        </Body>
        <Badge>{d.vehiclePlate}</Badge>
        <Body>{d.facilityName}</Body>
        <Body muted>{d.zoneName}</Body>
      </Card>
      <Card>
        <Title>{d.completedDeliveriesCount} entregas completadas</Title>
        <Body>
          Consulta los servicios finalizados en el historial de tu ruta.
        </Body>
      </Card>
      <Button
        label="Cerrar sesión"
        secondary
        onPress={() => execute((r) => r.logout())}
      />
    </Page>
  );
}
