import { Accordion, ListItem, Stepper } from "../components/presentation";
import { BottomSheet } from "../components/overlay/OverlayPortal";
import { MotionSection } from "../design-system/MotionProvider";
import { useRef, useState } from "react";
import { View } from "react-native";
import { Page } from "../components/Page";
import {
  Badge,
  Body,
  Button,
  Card,
  Check,
  Choice,
  Field,
  IconButton,
  Title,
  ui,
  useAction,
} from "../components/ui";
import { FulfillmentPicker } from "../components/FulfillmentPicker";
import { useApp } from "../store/AppProvider";
import { calculatePricing, currentCustomer } from "../domain/repository";
import { extras, garments, services } from "../domain/catalog";
import {
  modeFor,
  modeLabels,
  money,
  round,
  type Leg,
  type OrderItem,
  type PricingModel,
} from "../domain/models";
import type { ScreenProps } from "../navigation/routes";
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";

const blankLeg = (): Leg => ({
  method: "DRIVER",
  addressFull: "",
  scheduledDate: "",
  timeSlotText: "",
  status: "SCHEDULED",
  latitude: 0,
  longitude: 0,
});
export function PricingSummary({
  pricing,
  unknown = false,
}: {
  pricing: ReturnType<typeof calculatePricing>;
  unknown?: boolean;
}) {
  return (
    <Card>
      <Title>Resumen de valor</Title>
      {(
        [
          [
            "Prendas",
            unknown ? "Pendiente de pesaje" : money(pricing.itemsSubtotal),
          ],
          ["Extras", money(pricing.extrasTotal)],
          ["Promoción", `−${money(pricing.discount)}`],
          [
            "Beneficio de membresía",
            `−${money(pricing.membershipBenefitDiscount)}`,
          ],
          ["Envío", money(pricing.deliveryFee)],
        ] as const
      ).map(([label, value]) => (
        <View key={label} style={[ui.row, { justifyContent: "space-between" }]}>
          <Body>{label}</Body>
          <Body>{value}</Body>
        </View>
      ))}
      <View style={[ui.row, { justifyContent: "space-between" }]}>
        <Title>{unknown ? "Valor final" : "Total"}</Title>
        <Title>{unknown ? "Por determinar" : money(pricing.total)}</Title>
      </View>
      {unknown && (
        <Body muted>
          El peso estimado es orientativo. Planta certificará las libras y
          podrás confirmar el valor antes de pagar.
        </Body>
      )}
    </Card>
  );
}
export function NewOrderScreen({ route }: ScreenProps<"ClientNewOrderWizard">) {
  const navigation = useLaundryNavigation();
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  const a = useAction();
  const submitted = useRef(false);
  const [panel, setPanel] = useState<"service" | "payment">();
  const [step, setStep] = useState(1),
    [inbound, setInbound] = useState<Leg>(blankLeg),
    [outbound, setOutbound] = useState<Leg>(blankLeg);
  const [model, setModel] = useState<PricingModel>("FIXED"),
    [weight, setWeight] = useState("15"),
    [service, setService] = useState("Lavado + Planchado");
  const [items, setItems] = useState<OrderItem[]>([
    {
      id: "g-1",
      garmentType: "Camisas / Blusas",
      quantity: 3,
      serviceType: "Lavado + Planchado",
      unitPrice: 4,
      notes: "",
      iconName: "shirt-outline",
    },
    {
      id: "g-2",
      garmentType: "Pantalones / Jeans",
      quantity: 2,
      serviceType: "Lavado ecológico",
      unitPrice: 3,
      notes: "",
      iconName: "shirt-outline",
    },
  ]);
  const [extraIds, setExtraIds] = useState(["ext-2"]),
    [notes, setNotes] = useState(""),
    [promoInput, setPromoInput] = useState(
      route.params?.promoCode ?? "FRESH10",
    ),
    [appliedPromo, setAppliedPromo] = useState<string>(),
    [payment, setPayment] = useState("Billetera"),
    [confirmedId, setConfirmedId] = useState<string>();
  const blocked = state.customerCharges.some(
    (ch) => ch.customerId === c.id && ch.status === "PENDING",
  );
  let pricing = calculatePricing(items, extraIds, model, c.membershipTier);
  try {
    pricing = calculatePricing(
      items,
      extraIds,
      model,
      c.membershipTier,
      appliedPromo,
    );
  } catch {
    /* Submission shows the promotion validation error. */
  }
  const changeCount = (id: string, delta: number) => {
    const garment = garments.find((g) => g.id === id)!;
    const existing = items.find((i) => i.id === id);
    const quantity = (existing?.quantity ?? 0) + delta;
    if (quantity < 0) return;
    if (quantity === 0) setItems(items.filter((i) => i.id !== id));
    else if (existing)
      setItems(items.map((i) => (i.id === id ? { ...i, quantity } : i)));
    else
      setItems([
        ...items,
        {
          id,
          garmentType: garment.name,
          quantity,
          serviceType: service,
          unitPrice: round(
            garment.basePrice +
              services.find((s) => s.name === service)!.extraPrice,
          ),
          notes: "",
          iconName: garment.iconKey,
        },
      ]);
    setAppliedPromo(undefined);
  };
  const next = () =>
    a.run(() => {
      if (step === 1 && (!inbound.addressFull || !inbound.timeSlotId))
        throw Error("Selecciona dirección o sede y una franja de entrada.");
      if (step === 2 && (!outbound.addressFull || !outbound.timeSlotId))
        throw Error("Selecciona dirección o sede y una franja de salida.");
      if (
        step === 3 &&
        (model === "FIXED"
          ? !items.length
          : !Number.isFinite(Number(weight)) || Number(weight) <= 0)
      )
        throw Error("Agrega prendas o un peso orientativo válido.");
      if (step < 5) setStep(step + 1);
      else {
        if (submitted.current) return;
        const order = execute((r) =>
          r.createOrder({
            items,
            extraIds,
            inbound,
            outbound,
            pricingModel: model,
            estimatedWeightLb:
              model === "PER_WEIGHT" ? Number(weight) : undefined,
            promoCode: appliedPromo,
            paymentMethod: payment,
            notes,
          }),
        );
        submitted.current = true;
        setConfirmedId(order.id);
      }
    });
  const canContinue =
    step === 1
      ? !!inbound.addressFull && !!inbound.timeSlotId
      : step === 2
        ? !!outbound.addressFull && !!outbound.timeSlotId
        : step === 3
          ? model === "FIXED"
            ? items.length > 0
            : Number.isFinite(Number(weight)) && Number(weight) > 0
          : true;
  if (blocked)
    return (
      <Page>
        <Card>
          <Title>Regulariza tu cuenta</Title>
          <Body>
            Tienes cargos pendientes. Puedes volver a solicitar cuando los
            pagues en tu billetera.
          </Body>
          <Button
            label="Ir a billetera"
            onPress={() => navigation.navigate("ClientWallet")}
          />
        </Card>
      </Page>
    );
  if (confirmedId)
    return (
      <Page>
        <Card>
          <Title>Solicitud agendada</Title>
          <Badge>{confirmedId}</Badge>
          <Body>{modeLabels[modeFor(inbound.method, outbound.method)]}</Body>
          <Body>
            {inbound.scheduledDate} · {inbound.timeSlotText}
          </Body>
          <Body>
            {model === "PER_WEIGHT"
              ? "El pago se confirma después del pesaje certificado."
              : `Pago demo confirmado: ${money(pricing.total)}.`}
          </Body>
          <Button
            label="Ver mi solicitud"
            onPress={() =>
              navigation.replace("ClientOrderDetail", { orderId: confirmedId })
            }
          />
          <Button
            label="Volver al inicio"
            secondary
            onPress={() => navigation.navigate("ClientHome")}
          />
        </Card>
      </Page>
    );
  return (
    <Page
      scrollResetKey={step}
      onBack={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
      footer={
        <>
          <Button
            label={step === 5 ? "Confirmar solicitud" : "Continuar"}
            disabled={!canContinue}
            onPress={next}
          />
          <Button
            label={step > 1 ? "Volver al paso anterior" : "Cancelar y volver"}
            secondary
            onPress={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
          />
        </>
      }
    >
      <Stepper
        step={step}
        labels={["Entrada", "Salida", "Prendas", "Extras", "Confirmación"]}
      />
      <Badge>{modeLabels[modeFor(inbound.method, outbound.method)]}</Badge>
      {a.feedback}
      {!canContinue && (
        <Body muted>
          {step < 3
            ? "Elige una dirección o sede y un horario para continuar."
            : "Agrega prendas o un peso estimado válido para continuar."}
        </Body>
      )}
      <MotionSection key={step}>
        {step === 1 && (
          <>
            <FulfillmentPicker
              leg="INBOUND"
              value={inbound}
              onChange={setInbound}
            />
            <Accordion title="Instrucciones de recogida (opcional)">
              <Field
                label="Instrucciones de recogida"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </Accordion>
          </>
        )}
        {step === 2 && (
          <FulfillmentPicker
            leg="OUTBOUND"
            value={outbound}
            onChange={setOutbound}
          />
        )}
        {step === 3 && (
          <>
            <Card>
              <Title>Cómo calculamos el servicio</Title>
              <Choice
                label="Por prenda · Precio fijo"
                selected={model === "FIXED"}
                onPress={() => setModel("FIXED")}
              />
              <Choice
                label="Ropa por peso · $2.20 / lb"
                selected={model === "PER_WEIGHT"}
                onPress={() => setModel("PER_WEIGHT")}
              />
            </Card>
            {model === "PER_WEIGHT" ? (
              <Card>
                <Field
                  label="Peso estimado en libras"
                  validate={(value) =>
                    !Number.isFinite(Number(value)) || Number(value) <= 0
                      ? "Ingresa un peso mayor a cero."
                      : undefined
                  }
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
                <Body>
                  El monto exacto se determina en planta. No se cobra ahora.
                </Body>
              </Card>
            ) : (
              <>
                <Card>
                  <ListItem
                    title="Elegir servicio"
                    subtitle={service}
                    icon="shirt-outline"
                    onPress={() => setPanel("service")}
                  />
                  <BottomSheet
                    title="Servicio de las prendas"
                    visible={panel === "service"}
                    onClose={() => setPanel(undefined)}
                  >
                    {services.map((s) => (
                      <Choice
                        key={s.id}
                        label={`${s.name} · adicional ${money(s.extraPrice)}`}
                        selected={service === s.name}
                        onPress={() => {
                          setService(s.name);
                          setPanel(undefined);
                          setItems(
                            items.map((i) => ({
                              ...i,
                              serviceType: s.name,
                              unitPrice: round(
                                garments.find((g) => g.id === i.id)!.basePrice +
                                  s.extraPrice,
                              ),
                            })),
                          );
                          setAppliedPromo(undefined);
                        }}
                      />
                    ))}
                  </BottomSheet>
                </Card>
                <Card>
                  <Title>Catálogo completo</Title>
                  {garments.map((g) => {
                    const selected = items.find((i) => i.id === g.id);
                    return (
                      <View
                        key={g.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                          borderBottomWidth: 1,
                          borderBottomColor: ui.card.borderColor,
                          paddingVertical: 8,
                        }}
                      >
                        <View style={{ flex: 1, gap: 4 }}>
                          <Body>{g.name}</Body>
                          <Body muted>
                            {g.category} · {g.estimatedHours} h ·{" "}
                            {money(
                              selected?.unitPrice ??
                                round(
                                  g.basePrice +
                                    services.find((s) => s.name === service)!
                                      .extraPrice,
                                ),
                            )}{" "}
                            por unidad
                          </Body>
                          {selected && (
                            <Body muted>{selected.serviceType}</Body>
                          )}
                        </View>
                        <IconButton
                          label={"Quitar " + g.name}
                          icon="remove"
                          onPress={() => changeCount(g.id, -1)}
                          disabled={!selected}
                        />
                        <Badge>{selected?.quantity ?? 0}</Badge>
                        <IconButton
                          label={"Agregar " + g.name}
                          icon="add"
                          onPress={() => changeCount(g.id, 1)}
                        />
                      </View>
                    );
                  })}
                </Card>
              </>
            )}
          </>
        )}
        {step === 4 && (
          <Card>
            <Title>Personaliza tu cuidado</Title>
            {extras.map((e) => (
              <View key={e.id} style={{ gap: 4 }}>
                <Check
                  label={`${e.name} · ${money(e.price)}`}
                  checked={extraIds.includes(e.id)}
                  onChange={(selected) =>
                    setExtraIds(
                      selected
                        ? [...extraIds, e.id]
                        : extraIds.filter((id) => id !== e.id),
                    )
                  }
                />
                <Body muted>{e.description}</Body>
              </View>
            ))}
          </Card>
        )}
        {step === 5 && (
          <>
            <Card>
              <Title>Revisa tu agenda</Title>
              <Body>Entrada: {inbound.addressFull}</Body>
              <Body muted>
                {inbound.scheduledDate} · {inbound.timeSlotText}
              </Body>
              <Body>Salida: {outbound.addressFull}</Body>
              <Body muted>
                {outbound.scheduledDate} · {outbound.timeSlotText}
              </Body>
              <Body muted>
                Cancelación y reprogramación: corte de 60 minutos. Cargo por
                cancelación tardía: $5.00.
              </Body>
            </Card>
            <Card>
              <Field
                label="Código promocional"
                autoCapitalize="characters"
                value={promoInput}
                onChangeText={setPromoInput}
              />
              <Button
                label="Aplicar promoción"
                secondary
                onPress={() =>
                  a.run(() => {
                    calculatePricing(
                      items,
                      extraIds,
                      model,
                      c.membershipTier,
                      promoInput,
                    );
                    setAppliedPromo(
                      promoInput.trim().toUpperCase() || undefined,
                    );
                  }, "Promoción aplicada.")
                }
              />
              {appliedPromo && <Badge>{appliedPromo}</Badge>}
            </Card>
            <PricingSummary
              pricing={pricing}
              unknown={model === "PER_WEIGHT"}
            />
            <Card>
              <ListItem
                title="Elegir método de pago"
                subtitle={
                  payment === "Billetera"
                    ? "Billetera Laundry · " + money(c.walletBalance)
                    : "Tarjeta · Demo"
                }
                icon="card-outline"
                onPress={() => setPanel("payment")}
              />
              <BottomSheet
                title="Método de pago"
                visible={panel === "payment"}
                onClose={() => setPanel(undefined)}
              >
                <Body muted>Pagos de demostración local.</Body>
                {["Billetera", "Tarjeta"].map((method) => (
                  <Choice
                    key={method}
                    label={
                      method === "Billetera"
                        ? `Billetera Laundry · ${money(c.walletBalance)}`
                        : "Tarjeta · Demo"
                    }
                    selected={payment === method}
                    onPress={() => {
                      setPayment(method);
                      setPanel(undefined);
                    }}
                  />
                ))}
              </BottomSheet>
            </Card>
          </>
        )}
      </MotionSection>
    </Page>
  );
}
