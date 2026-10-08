import {
  Accordion,
  ListItem,
  SegmentedControl,
} from "../components/presentation";
import {
  BottomSheet,
  ConfirmDialog,
  FullScreenOverlay,
} from "../components/overlay/OverlayPortal";
import { useState } from "react";
import { Linking, FlatList, View } from "react-native";
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
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";

export function ClientProfileScreen() {
  const navigation = useLaundryNavigation();
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
        <ListItem
          title="Direcciones guardadas"
          icon="location-outline"
          onPress={() => navigation.navigate("ClientAddresses")}
        />
        <ListItem
          title="Datos de facturación"
          icon="receipt-outline"
          onPress={() => navigation.navigate("ClientBilling")}
        />
      </Card>
      <Card>
        <Title>Saldo y beneficios</Title>
        <ListItem
          title={`Billetera Laundry · ${money(c.walletBalance)}`}
          icon="wallet-outline"
          onPress={() => navigation.navigate("ClientWallet")}
        />
        <ListItem
          title="Métodos de pago"
          icon="card-outline"
          onPress={() => navigation.navigate("ClientWallet")}
        />
        <ListItem
          title="Promociones, recompensas y membresía"
          icon="gift-outline"
          onPress={() => navigation.navigate("ClientBenefits")}
        />
      </Card>
      <Card>
        <Title>Preferencias y seguridad</Title>
        <ListItem
          title="Notificaciones"
          onPress={() => navigation.navigate("ClientNotifications")}
        />
        <ListItem
          title="Seguridad y contraseña"
          onPress={() => navigation.navigate("ClientSecurity")}
        />
        <ListItem
          title="Ayuda y soporte"
          onPress={() => navigation.navigate("ClientSupport")}
        />
      </Card>
      <ListItem
        title="Cerrar sesión"
        onPress={() => execute((r) => r.logout())}
      />
    </Page>
  );
}
export function BenefitsScreen() {
  const navigation = useLaundryNavigation();
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  const a = useAction();
  const [tab, setTab] = useState("Promociones");
  return (
    <Page>
      <SegmentedControl
        options={["Promociones", "Recompensas", "Membresía"].map((t) => ({
          value: t,
          label: t,
        }))}
        value={tab}
        onChange={setTab}
      />
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
            <Card>
              <Icon name="wallet-outline" size={38} />
              <Title>{money(c.walletBalance)}</Title>
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
            <Accordion title="Métodos de pago">
              <Body>Tarjeta Visa · •••• 4242 · Demo</Body>
              <Body>Billetera Laundry</Body>
              <Body muted>Selecciona el método al confirmar tu solicitud.</Body>
            </Accordion>
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
  const [options, setOptions] = useState<Address>(),
    [remove, setRemove] = useState<Address>();
  const edit = (address: Address) => {
    setDraft({ ...address });
    setLat(String(address.latitude));
    setLng(String(address.longitude));
  };
  return (
    <Page>
      {!draft && a.feedback}
      <Button
        label="Añadir dirección"
        icon="add"
        onPress={() => edit(newAddress())}
      />
      {draft && (
        <FullScreenOverlay
          title="Dirección"
          visible={!!draft}
          onClose={() => setDraft(null)}
          footer={
            <>
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
            </>
          }
        >
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
          <Accordion
            title="Ubicación para la entrega"
            subtitle="Coordenadas usadas para orientar al chofer"
          >
            <Body muted>
              Este MVP no convierte la dirección a coordenadas automáticamente.
              Verifica el punto del domicilio.
            </Body>
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
          </Accordion>
          <Check
            label="Usar como dirección principal"
            checked={draft.isPrimary}
            onChange={(isPrimary) => setDraft({ ...draft, isPrimary })}
          />
          {a.feedback}
        </FullScreenOverlay>
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
              label={"Opciones de " + addr.title}
              secondary
              icon="ellipsis-horizontal"
              onPress={() => setOptions(addr)}
            />
          </Card>
        ))
      ) : (
        <Empty text="Aún no tienes direcciones guardadas." />
      )}
      <BottomSheet
        title={options?.title ?? "Dirección"}
        visible={!!options}
        onClose={() => setOptions(undefined)}
      >
        {options && (
          <>
            <ListItem
              title={"Editar " + options.title}
              icon="create-outline"
              onPress={() => {
                setOptions(undefined);
                edit(options);
              }}
            />
            {!options.isPrimary && (
              <ListItem
                title={"Usar " + options.title + " como principal"}
                icon="star-outline"
                onPress={() => {
                  a.run(
                    () => execute((r) => r.setDefaultAddress(options.id)),
                    "Dirección principal actualizada.",
                  );
                  setOptions(undefined);
                }}
              />
            )}
            <ListItem
              title={"Eliminar " + options.title}
              icon="trash-outline"
              onPress={() => {
                setOptions(undefined);
                setRemove(options);
              }}
            />
          </>
        )}
      </BottomSheet>
      <ConfirmDialog
        title="Eliminar dirección"
        visible={!!remove}
        onClose={() => setRemove(undefined)}
        footer={
          <>
            <Button
              label="Confirmar eliminación"
              variant="danger"
              onPress={() => {
                if (remove)
                  a.run(
                    () => execute((r) => r.removeAddress(remove.id)),
                    "Dirección eliminada.",
                  );
                setRemove(undefined);
              }}
            />
            <Button
              label="Conservar dirección"
              secondary
              onPress={() => setRemove(undefined)}
            />
          </>
        }
      >
        <Body>Se eliminará {remove?.title} de tus direcciones guardadas.</Body>
      </ConfirmDialog>
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
    <Page
      footer={
        <>
          <Button
            label="Guardar datos de facturación"
            onPress={() =>
              a.run(
                () => execute((r) => r.updateBillingData(draft)),
                "Datos de facturación guardados.",
              )
            }
          />
        </>
      }
    >
      <Card>
        <Title>Datos fiscales</Title>
        <Body muted>
          Se usarán en tus comprobantes. Revisa el correo y número tributario.
        </Body>
        {(Object.keys(fields) as (keyof typeof fields)[]).map((key) => (
          <Field
            key={key}
            label={fields[key]}
            keyboardType={
              key === "billingEmail"
                ? "email-address"
                : key === "billingPhone"
                  ? "phone-pad"
                  : "default"
            }
            autoCapitalize={key === "billingEmail" ? "none" : "sentences"}
            value={draft[key]}
            onChangeText={(value) => setDraft({ ...draft, [key]: value })}
          />
        ))}
        {a.feedback}
      </Card>
    </Page>
  );
}
export function NotificationsScreen() {
  const navigation = useLaundryNavigation(),
    { state, execute } = useApp(),
    c = currentCustomer(state);
  const [filter, setFilter] = useState("Todas");
  const notifications = state.notifications.filter(
    (n) => n.customerId === c.id && (filter === "Todas" || !n.isRead),
  );
  return (
    <Page scroll={false}>
      <SegmentedControl
        value={filter}
        onChange={setFilter}
        options={[
          { value: "Todas", label: "Todas" },
          { value: "Sin leer", label: "Sin leer" },
        ]}
      />
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <Empty text="No tienes notificaciones en esta vista." />
        }
        renderItem={({ item: n }) => (
          <Card>
            <ListItem
              title={n.title}
              subtitle={n.timeAgo}
              icon={n.isRead ? "notifications-outline" : "notifications"}
              trailing={!n.isRead && <Badge>Sin leer</Badge>}
            />
            <Body>{n.body}</Body>
            <Button
              label={
                n.relatedOrderId
                  ? "Ver solicitud " + n.relatedOrderId
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
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
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
  const a = useAction();
  return (
    <Page>
      <Title>Preguntas frecuentes</Title>
      {faqs.map(([question, answer]) => (
        <Accordion key={question} title={question}>
          <Body>{answer}</Body>
        </Accordion>
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
