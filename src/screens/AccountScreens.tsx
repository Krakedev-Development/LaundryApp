import { SegmentedControl } from "../components/presentation";
import { useState } from "react";
import { Text, View } from "react-native";
import { Page } from "../components/Page";
import {
  BenefitIcon,
  PointsSummary,
  PromoSurface,
  benefitStyles,
  membershipTone,
  promoTone,
} from "../components/BenefitsPresentation";
import {
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
  Icon,
  Title,
  useAction,
} from "../components/ui";
import { useApp } from "../store/AppProvider";
import { currentCustomer } from "../domain/repository";
import { plans, promos, rewards } from "../domain/catalog";
import { money } from "../domain/models";
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
                    <Icon
                      name="pricetag-outline"
                      color={promoTone(index).ink}
                    />
                    <Title
                      style={[
                        benefitStyles.promoTitle,
                        { color: promoTone(index).ink },
                      ]}
                    >
                      {p.code}
                    </Title>
                  </View>
                  <Body
                    style={[
                      benefitStyles.promoDescription,
                      { color: promoTone(index).ink },
                    ]}
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
                  <Text style={benefitStyles.rewardCost}>
                    {r.pointsCost} puntos
                  </Text>
                </View>
              </View>
              <Body style={benefitStyles.rewardDescription}>
                {r.description}
              </Body>
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
                  style={[
                    benefitStyles.planBadge,
                    { backgroundColor: membershipTone(plan.id).soft },
                  ]}
                >
                  <Icon
                    name="checkmark-circle"
                    size={14}
                    color={membershipTone(plan.id).ink}
                  />
                  <Text
                    style={[
                      benefitStyles.planBadgeText,
                      { color: membershipTone(plan.id).ink },
                    ]}
                  >
                    Plan actual
                  </Text>
                </View>
              )}
              <View style={benefitStyles.planHeader}>
                <Title
                  style={[
                    benefitStyles.planName,
                    { color: membershipTone(plan.id).ink },
                  ]}
                >
                  {plan.name}
                </Title>
                <View style={benefitStyles.planPriceRow}>
                  <Text style={benefitStyles.planPrice}>
                    {money(plan.priceMonthly)}
                  </Text>
                  <Body muted style={benefitStyles.planPeriod}>
                    / mes
                  </Body>
                </View>
              </View>
              <View style={benefitStyles.features}>
                {plan.benefits.map((b) => (
                  <View key={b} style={benefitStyles.feature}>
                    <Icon
                      name="checkmark-circle"
                      size={15}
                      color={membershipTone(plan.id).ink}
                    />
                    <Body style={benefitStyles.featureText}>{b}</Body>
                  </View>
                ))}
              </View>
              <Button
                label={`Elegir plan ${plan.name} · Demo`}
                style={[
                  benefitStyles.planButton,
                  { backgroundColor: membershipTone(plan.id).ink },
                ]}
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
