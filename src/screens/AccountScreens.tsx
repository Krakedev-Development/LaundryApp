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
import { Linking, FlatList, Text, View } from "react-native";
import { Page } from "../components/Page";
import { AccountDemoTools } from "../components/AccountDemoTools";
import {
  BenefitIcon,
  PointsSummary,
  PromoSurface,
  benefitStyles,
  membershipTone,
  promoTone,
} from "../components/BenefitsPresentation";
import {
  ProfileDetail,
  ProfileHero,
  ProfileLogout,
  ProfileRow,
  ProfileSection,
  ProfileStats,
} from "../components/ProfilePresentation";
import {
  Badge,
  Body,
  Button,
  Card,
  Check,
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
      <ProfileHero title={c.name} email={c.email}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name="shield-checkmark-outline" size={18} />
          <Badge>Identidad verificada</Badge>
        </View>
      </ProfileHero>
      <ProfileStats
        items={[
          { label: "Membresía", text: c.membershipTier },
          { label: "Puntos", text: c.loyaltyPoints },
        ]}
      />
      <ProfileSection title="Direcciones y facturación">
        <ProfileRow
          title="Direcciones guardadas"
          icon="location-outline"
          tone="amber"
          onPress={() => navigation.navigate("ClientAddresses")}
        />
        <ProfileRow
          title="Datos de facturación"
          icon="receipt-outline"
          tone="green"
          last
          onPress={() => navigation.navigate("ClientBilling")}
        />
      </ProfileSection>
      <ProfileSection title="Saldo y beneficios">
        <ProfileRow
          title={`Billetera Laundry · ${money(c.walletBalance)}`}
          label="Billetera Laundry"
          subtitle={money(c.walletBalance)}
          icon="wallet-outline"
          onPress={() => navigation.navigate("ClientWallet")}
        />
        <ProfileRow
          title="Métodos de pago"
          icon="card-outline"
          onPress={() => navigation.navigate("ClientPaymentMethods")}
        />
        <ProfileRow
          title="Promociones, recompensas y membresía"
          icon="gift-outline"
          tone="purple"
          last
          onPress={() => navigation.navigate("ClientBenefits")}
        />
      </ProfileSection>
      <ProfileSection title="Preferencias y seguridad">
        <ProfileRow
          title="Notificaciones"
          icon="notifications-outline"
          tone="red"
          onPress={() => navigation.navigate("ClientNotifications")}
        />
        <ProfileRow
          title="Seguridad y contraseña"
          icon="lock-closed-outline"
          tone="gray"
          onPress={() => navigation.navigate("ClientSecurity")}
        />
        <ProfileRow
          title="Ayuda y soporte"
          icon="help-circle-outline"
          tone="gray"
          last
          onPress={() => navigation.navigate("ClientSupport")}
        />
      </ProfileSection>
      <AccountDemoTools />
      <ProfileLogout onPress={() => execute((r) => r.logout())} />
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
      {tab === "Promociones" && (
        <>
          <Title style={benefitStyles.sectionTitle}>Promociones</Title>
          <View style={benefitStyles.promoGrid}>
            {promos.map((p, index) => (
              <PromoSurface key={p.code} index={index}>
                <View
                  style={[
                    benefitStyles.promoHero,
                    { backgroundColor: promoTone(index).background },
                  ]}
                >
                  <View style={benefitStyles.promoHeading}>
                    <Icon name="pricetag-outline" color={promoTone(index).ink} />
                    <Title
                      style={[benefitStyles.promoTitle, { color: promoTone(index).ink }]}
                    >
                      {p.code}
                    </Title>
                  </View>
                  <Body
                    style={[benefitStyles.promoDescription, { color: promoTone(index).ink }]}
                  >
                    {p.description}
                  </Body>
                </View>
                <View style={benefitStyles.promoBody}>
                  <View style={benefitStyles.conditions}>
                    <Icon name="information-circle-outline" size={18} />
                    <Body muted style={benefitStyles.conditionText}>
                      Mínimo en prendas {money(p.minOrderAmount)} · Válido hasta{" "}
                      {p.validUntil}
                    </Body>
                  </View>
                  <Button
                    label={`Usar ${p.code}`}
                    icon="arrow-forward"
                    style={benefitStyles.promoButton}
                    onPress={() =>
                      navigation.navigate("ClientNewOrderWizard", {
                        promoCode: p.code,
                      })
                    }
                  />
                </View>
              </PromoSurface>
            ))}
          </View>
        </>
      )}
      {tab === "Recompensas" && (
        <>
          <Title style={benefitStyles.sectionTitle}>Recompensas</Title>
          <PointsSummary points={c.loyaltyPoints}>
            <Body muted style={benefitStyles.pointsExplanation}>
              Ganas 10 puntos por dólar al confirmar un servicio. Los canjes
              requieren aprobación.
            </Body>
          </PointsSummary>
          {rewards.map((r) => (
            <Card key={r.id} style={benefitStyles.rewardCard}>
              <View style={benefitStyles.rewardHeading}>
                <BenefitIcon name="gift-outline" />
                <View style={benefitStyles.rewardInfo}>
                  <Title style={benefitStyles.rewardTitle}>{r.title}</Title>
                  <Text style={benefitStyles.rewardCost}>{r.pointsCost} puntos</Text>
                </View>
              </View>
              <Body style={benefitStyles.rewardDescription}>{r.description}</Body>
              <Button
                label={`Canjear ${r.title}`}
                style={benefitStyles.rewardButton}
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
          <Title style={benefitStyles.sectionTitle}>Mis canjes</Title>
          {state.loyaltyRedemptions
            .filter((r) => r.customerId === c.id)
            .map((r) => (
              <Card key={r.id} style={benefitStyles.redemption}>
                <Title style={benefitStyles.rewardTitle}>{r.rewardTitle}</Title>
                <Body muted>
                  {r.pointsCost} puntos · {r.date}
                </Body>
                <Badge>{r.status}</Badge>
              </Card>
            ))}
        </>
      )}
      {tab === "Membresía" && (
        <>
          <Title style={benefitStyles.sectionTitle}>Membresía</Title>
          {plans.map((plan) => (
            <Card
              key={plan.id}
              style={[
                benefitStyles.planCard,
                { borderColor: membershipTone(plan.id).ink },
                c.membershipTier === plan.name && benefitStyles.currentPlan,
              ]}
            >
              {c.membershipTier === plan.name && (
                <View
                  style={[benefitStyles.planBadge, { backgroundColor: membershipTone(plan.id).soft }]}
                >
                  <Icon name="checkmark-circle" size={14} color={membershipTone(plan.id).ink} />
                  <Text style={[benefitStyles.planBadgeText, { color: membershipTone(plan.id).ink }]}>
                    Plan actual
                  </Text>
                </View>
              )}
              <View style={benefitStyles.planHeader}>
                <Title style={[benefitStyles.planName, { color: membershipTone(plan.id).ink }]}>
                  {plan.name}
                </Title>
                <View style={benefitStyles.planPriceRow}>
                  <Text style={benefitStyles.planPrice}>{money(plan.priceMonthly)}</Text>
                  <Body muted style={benefitStyles.planPeriod}>/ mes</Body>
                </View>
              </View>
              <View style={benefitStyles.features}>
                {plan.benefits.map((b) => (
                  <View key={b} style={benefitStyles.feature}>
                    <Icon name="checkmark-circle" size={15} color={membershipTone(plan.id).ink} />
                    <Body style={benefitStyles.featureText}>{b}</Body>
                  </View>
                ))}
              </View>
              <Button
                label={`Elegir plan ${plan.name} · Demo`}
                style={[benefitStyles.planButton, { backgroundColor: membershipTone(plan.id).ink }]}
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
        </>
      )}
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
      <ProfileHero title={d.name} email={d.email}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Icon name="car-outline" size={18} />
          <Badge>{operationalLabels[d.operationalStatus]}</Badge>
        </View>
      </ProfileHero>
      <ProfileSection title="Vehículo asignado">
        <ProfileDetail label="Vehículo" icon="car-outline">
          {d.vehicleModel} · {d.vehicleColor}
        </ProfileDetail>
        <ProfileDetail label="Placa" icon="pricetag-outline">
          {d.vehiclePlate}
        </ProfileDetail>
        <ProfileDetail label="Sede" icon="business-outline">
          {d.facilityName}
        </ProfileDetail>
        <ProfileDetail label="Zona" icon="location-outline" last>
          {d.zoneName}
        </ProfileDetail>
      </ProfileSection>
      <ProfileSection title="Historial de ruta">
        <View style={{ padding: 16, gap: 8 }}>
          <Title>{d.completedDeliveriesCount} entregas completadas</Title>
          <Body muted>
            Consulta los servicios finalizados en el historial de tu ruta.
          </Body>
        </View>
      </ProfileSection>
      <AccountDemoTools />
      <ProfileLogout onPress={() => execute((r) => r.logout())} />
    </Page>
  );
}
