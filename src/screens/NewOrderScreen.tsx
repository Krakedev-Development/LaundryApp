import { Accordion, ListItem, Stepper } from "../components/presentation";
import { BottomSheet } from "../components/overlay/OverlayPortal";
import { MotionSection } from "../design-system/MotionProvider";
import { tactile } from "../design-system/interaction";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
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
  Icon,
  Title,
  ui,
  useAction,
  type IconName,
} from "../components/ui";
import { FulfillmentPicker } from "../components/FulfillmentPicker";
import { requestStyles } from "../components/FulfillmentPresentation";
import { ScheduledCheck, ScheduledInfo, scheduledStyles } from "../components/ScheduledPresentation";
import { ConfirmationGroup, confirmationStyles } from "../components/ConfirmationPresentation";
import { ExtraContent, GarmentSurface, extraTone, garmentStyles } from "../components/GarmentsExtrasPresentation";
import { useApp } from "../store/AppProvider";
import {
  calculatePricing,
  currentCustomer,
  today,
} from "../domain/repository";
import { slotService } from "../services/slots/slotService";
import { orderService } from "../services/orders/orderService";
import { getStoredAuthSession } from "../services/auth/authService";
import { fetchFacilities } from "../services/catalog/catalogService";
import {
  extras,
  garments,
  services,
  type CatalogGarment,
  type CatalogService,
} from "../domain/catalog";
import {
  fetchExtras,
  fetchGarments,
  fetchServices,
} from "../services/catalog/catalogService";
import {
  modeFor,
  modeLabels,
  money,
  round,
  type Leg,
  type OrderExtra,
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
  appearance = "default",
}: {
  pricing: ReturnType<typeof calculatePricing>;
  unknown?: boolean;
  appearance?: "default" | "confirmation";
}) {
  const confirmation = appearance === "confirmation";
  return (
    <Card style={confirmation && confirmationStyles.card}>
      <Title style={confirmation && confirmationStyles.title}>
        Resumen de valor
      </Title>
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
        <View
          key={label}
          style={
            confirmation
              ? confirmationStyles.priceRow
              : [ui.row, { justifyContent: "space-between" }]
          }
        >
          <Body style={confirmation && confirmationStyles.priceLabel}>
            {label}
          </Body>
          <Body
            style={[
              { fontVariant: ["tabular-nums"] },
              confirmation && [
                confirmationStyles.priceValue,
                (label === "Promoción" || label === "Beneficio de membresía") &&
                  confirmationStyles.discount,
              ],
            ]}
          >
            {value}
          </Body>
        </View>
      ))}
      <View
        style={
          confirmation
            ? [confirmationStyles.priceRow, confirmationStyles.totalRow]
            : [ui.row, { justifyContent: "space-between" }]
        }
      >
        <Title style={confirmation && confirmationStyles.totalLabel}>
          {unknown ? "Valor final" : "Total"}
        </Title>
        <Title
          style={[
            { fontVariant: ["tabular-nums"] },
            confirmation && confirmationStyles.totalAmount,
          ]}
        >
          {unknown ? "Por determinar" : money(pricing.total)}
        </Title>
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

function buildDefaultSelection(
  catalogGarments: CatalogGarment[],
  catalogServices: CatalogService[],
): { defaultService: string; defaultItems: OrderItem[] } {
  const preferredSvc =
    catalogServices.find((s) => /planchado/i.test(s.name)) ??
    catalogServices[0];
  const secondarySvc =
    catalogServices.find((s) => s.id !== preferredSvc?.id) ?? preferredSvc;
  const serviceName = preferredSvc?.name ?? "Lavado + Planchado";
  const defaultItems: OrderItem[] = [];
  if (catalogGarments[0] && preferredSvc) {
    defaultItems.push({
      id: catalogGarments[0].id,
      garmentType: catalogGarments[0].name,
      quantity: 3,
      serviceType: preferredSvc.name,
      unitPrice: round(catalogGarments[0].basePrice + preferredSvc.extraPrice),
      notes: "",
      iconName: catalogGarments[0].iconKey,
    });
  }
  if (catalogGarments[1] && secondarySvc) {
    defaultItems.push({
      id: catalogGarments[1].id,
      garmentType: catalogGarments[1].name,
      quantity: 2,
      serviceType: secondarySvc.name,
      unitPrice: round(catalogGarments[1].basePrice + secondarySvc.extraPrice),
      notes: "",
      iconName: catalogGarments[1].iconKey,
    });
  }
  return { defaultService: serviceName, defaultItems };
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
  const [catalogGarments, setCatalogGarments] = useState<CatalogGarment[]>(() => [
      ...garments,
    ]),
    [catalogServices, setCatalogServices] = useState<CatalogService[]>(() => [
      ...services,
    ]),
    [catalogExtras, setCatalogExtras] = useState<OrderExtra[]>(() => [
      ...extras,
    ]);
  const initialSelection = buildDefaultSelection(
    catalogGarments,
    catalogServices,
  );
  const [model, setModel] = useState<PricingModel>("FIXED"),
    [weight, setWeight] = useState("15"),
    [service, setService] = useState(initialSelection.defaultService);
  const [items, setItems] = useState<OrderItem[]>(
    initialSelection.defaultItems,
  );
  const [extraIds, setExtraIds] = useState<string[]>(() => {
      const preferred =
        catalogExtras.find((e) => e.id === "ext-2") ??
        catalogExtras.find((e) => /perfum/i.test(e.name)) ??
        catalogExtras[0];
      return preferred ? [preferred.id] : [];
    }),
    [notes, setNotes] = useState(""),
    [promoInput, setPromoInput] = useState(
      route.params?.promoCode ?? "FRESH10",
    ),
    [appliedPromo, setAppliedPromo] = useState<string>(),
    [payment, setPayment] = useState("Billetera"),
    [confirmedId, setConfirmedId] = useState<string>();

  useEffect(() => {
    let active = true;
    void Promise.all([fetchGarments(), fetchServices(), fetchExtras()]).then(
      ([loadedGarments, loadedServices, loadedExtras]) => {
        if (!active) return;
        setCatalogGarments([...loadedGarments]);
        setCatalogServices([...loadedServices]);
        setCatalogExtras([...loadedExtras]);

        setService((prevService) => {
          if (loadedServices.some((s) => s.name === prevService))
            return prevService;
          return (
            loadedServices.find((s) => /planchado/i.test(s.name))?.name ??
            loadedServices[0]?.name ??
            prevService
          );
        });

        setItems((prevItems) => {
          const allExist =
            prevItems.length > 0 &&
            prevItems.every(
              (item) =>
                loadedGarments.some((g) => g.id === item.id) &&
                loadedServices.some((s) => s.name === item.serviceType),
            );
          if (allExist) return prevItems;
          return buildDefaultSelection(loadedGarments, loadedServices)
            .defaultItems;
        });

        setExtraIds((prevExtraIds) => {
          const validIds = prevExtraIds.filter((id) =>
            loadedExtras.some((e) => e.id === id),
          );
          if (validIds.length > 0 || prevExtraIds.length === 0) return validIds;
          const fallbackExtra =
            loadedExtras.find((e) => /perfum/i.test(e.name)) ?? loadedExtras[0];
          return fallbackExtra ? [fallbackExtra.id] : [];
        });
      },
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void orderService
      .ensureGuayaquilAddress()
      .then((address) => {
        if (!active) return;
        execute((repo) => repo.syncAddressesFromApi([address]));
        setInbound((prev) => {
          if (prev.addressId) return prev;
          return {
            ...prev,
            addressId: address.id,
            addressFull: address.fullAddress,
            latitude: Number(address.latitude),
            longitude: Number(address.longitude),
          };
        });
        setOutbound((prev) => {
          if (prev.addressId || prev.method !== "DRIVER") return prev;
          return {
            ...prev,
            addressId: address.id,
            addressFull: address.fullAddress,
            latitude: Number(address.latitude),
            longitude: Number(address.longitude),
          };
        });
      })
      .catch(() => {
        // Fallback to local addresses
      });
    return () => {
      active = false;
    };
  }, []);

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
  const activeServiceObj =
    catalogServices.find((s) => s.name === service) ?? catalogServices[0];

  const changeCount = (id: string, delta: number) => {
    const garment = catalogGarments.find((g) => g.id === id);
    if (!garment) return;
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
          serviceType: activeServiceObj?.name ?? service,
          unitPrice: round(
            garment.basePrice + (activeServiceObj?.extraPrice ?? 0),
          ),
          notes: "",
          iconName: garment.iconKey,
        },
      ]);
    setAppliedPromo(undefined);
  };
  const next = () => {
    if (step === 1 && (!inbound.addressFull || !inbound.timeSlotId)) {
      a.run(() => {
        throw Error("Selecciona dirección o sede y una franja de entrada.");
      });
      return;
    }
    if (step === 2 && (!outbound.addressFull || !outbound.timeSlotId)) {
      a.run(() => {
        throw Error("Selecciona dirección o sede y una franja de salida.");
      });
      return;
    }
    if (
      step === 3 &&
      (model === "FIXED"
        ? !items.length
        : !Number.isFinite(Number(weight)) || Number(weight) <= 0)
    ) {
      a.run(() => {
        throw Error("Agrega prendas o un peso orientativo válido.");
      });
      return;
    }
    if (step < 5) {
      setStep(step + 1);
      return;
    }

    // Paso 5: Confirmar orden asíncronamente con el backend
    void a.asyncRun(async () => {
      if (submitted.current) return;
      let createdCode: string | undefined;

      const facilityId =
        inbound.facilityId ||
        outbound.facilityId ||
        (await fetchFacilities())[0]?.id ||
        "3ab2f9fd-2f25-4c12-9f50-03c5d25417d5";

      let pickupAddressId = inbound.addressId;
      if (!pickupAddressId) {
        const ensured = await orderService.ensureGuayaquilAddress();
        pickupAddressId = ensured.id;
        execute((r) => r.syncAddressesFromApi([ensured]));
      }

      let pickupSlotId = inbound.timeSlotId;
      if (!pickupSlotId) {
        const slots = await slotService.fetchPickupSlots(facilityId);
        const future =
          slots.find((s) => s.date >= today() && s.available > 0) ??
          slots[0];
        if (future) pickupSlotId = future.id;
      }

      const orderItemsPayload = items.map((it) => {
        const serviceObj =
          catalogServices.find((s) => s.name === it.serviceType) ??
          catalogServices[0];
        return {
          garmentId: it.id,
          serviceId: serviceObj?.id ?? "4db170b3-944b-442b-8542-bf771476b4a6",
          quantity: it.quantity,
          notes: it.notes?.trim() || undefined,
        };
      });

      try {
        const apiOrder = await orderService.createOrder({
          facilityId,
          mode: "HOME_HOME",
          pickupAddressId: pickupAddressId!,
          pickupSlotId: pickupSlotId!,
          items: orderItemsPayload,
          extraIds: extraIds.length > 0 ? extraIds : undefined,
          promotionCode: appliedPromo || undefined,
          notes: notes.trim() || undefined,
          paymentMethodKind: "WALLET",
        });

        const registered = execute((r) =>
          r.registerApiOrder(apiOrder, {
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

        createdCode = registered.id;
      } catch (apiError) {
        const session = await getStoredAuthSession();
        if (!session.accessToken) {
          const localOrder = execute((r) =>
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
          createdCode = localOrder.id;
        } else {
          throw apiError;
        }
      }

      if (createdCode) {
        submitted.current = true;
        tactile("success");
        setConfirmedId(createdCode);
      }
    });
  };

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
      <Page
        backgroundColor="#F9FAFB"
        contentContainerStyle={scheduledStyles.page}
      >
        <Card style={scheduledStyles.card}>
          <ScheduledCheck />
          <Title style={scheduledStyles.title}>Solicitud agendada</Title>
          <View style={scheduledStyles.id}>
            <Badge>{confirmedId}</Badge>
          </View>
          <View style={scheduledStyles.info}>
            <ScheduledInfo icon="location-outline">
              <Body style={scheduledStyles.text}>
                {modeLabels[modeFor(inbound.method, outbound.method)]}
              </Body>
            </ScheduledInfo>
            <View style={scheduledStyles.divider} />
            <ScheduledInfo icon="calendar-outline">
              <Body style={scheduledStyles.text}>
                {inbound.scheduledDate} · {inbound.timeSlotText}
              </Body>
            </ScheduledInfo>
            <View style={scheduledStyles.divider} />
            <ScheduledInfo icon="wallet-outline">
              <Body style={scheduledStyles.text}>
                {model === "PER_WEIGHT"
                  ? "El pago se confirma después del pesaje certificado."
                  : `Pago confirmado: ${money(pricing.total)}.`}
              </Body>
            </ScheduledInfo>
          </View>
          <Button
            label="Ver mi solicitud"
            icon="arrow-forward"
            style={scheduledStyles.action}
            onPress={() =>
              navigation.replace("ClientOrderDetail", { orderId: confirmedId })
            }
          />
          <Button
            label="Volver al inicio"
            secondary
            style={scheduledStyles.secondary}
            textStyle={scheduledStyles.secondaryText}
            onPress={() => navigation.navigate("ClientHome")}
          />
        </Card>
      </Page>
    );
  return (
    <Page
      scrollResetKey={step}
      backgroundColor={step < 5 ? "#FFFFFF" : "#F9FAFB"}
      onBack={() => (step > 1 ? setStep(step - 1) : navigation.goBack())}
      footer={
        <>
          <Button
            label={step === 5 ? "Confirmar solicitud" : "Continuar"}
            disabled={!canContinue || a.busy}
            busy={a.busy}
            style={
              step < 3
                ? requestStyles.next
                : step < 5
                  ? garmentStyles.next
                  : confirmationStyles.confirm
            }
            icon={step < 5 ? "arrow-forward" : "checkmark-circle-outline"}
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
              appearance="request"
              value={inbound}
              onChange={setInbound}
            />
            <Card style={requestStyles.noteCard}>
              <Accordion
                title="Instrucciones de recogida (opcional)"
                appearance="list"
              >
                <Field
                  label="Instrucciones de recogida"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </Accordion>
            </Card>
          </>
        )}
        {step === 2 && (
          <FulfillmentPicker
            leg="OUTBOUND"
            appearance="request"
            value={outbound}
            onChange={setOutbound}
          />
        )}
        {step === 3 && (
          <>
            <Card style={garmentStyles.card}>
              <Title style={garmentStyles.sectionTitle}>
                Cómo calculamos el servicio
              </Title>
              <Choice
                label="Por prenda · Precio fijo"
                style={[
                  garmentStyles.choice,
                  model === "FIXED" && garmentStyles.selectedChoice,
                ]}
                textStyle={garmentStyles.choiceText}
                selected={model === "FIXED"}
                onPress={() => setModel("FIXED")}
              />
              <Choice
                label="Ropa por peso · $2.20 / lb"
                style={[
                  garmentStyles.choice,
                  model === "PER_WEIGHT" && garmentStyles.selectedChoice,
                ]}
                textStyle={garmentStyles.choiceText}
                selected={model === "PER_WEIGHT"}
                onPress={() => setModel("PER_WEIGHT")}
              />
            </Card>
            {model === "PER_WEIGHT" ? (
              <Card style={garmentStyles.card}>
                <Field
                  label="Peso estimado en libras"
                  style={garmentStyles.input}
                  labelStyle={garmentStyles.label}
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
                <Card style={garmentStyles.card}>
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
                    {catalogServices.map((s) => (
                      <Choice
                        key={s.id}
                        label={`${s.name} · adicional ${money(s.extraPrice)}`}
                        style={[
                          garmentStyles.choice,
                          service === s.name && garmentStyles.selectedChoice,
                        ]}
                        textStyle={garmentStyles.choiceText}
                        selected={service === s.name}
                        onPress={() => {
                          setService(s.name);
                          setPanel(undefined);
                          setItems(
                            items.map((i) => {
                              const garment = catalogGarments.find(
                                (g) => g.id === i.id,
                              );
                              return {
                                ...i,
                                serviceType: s.name,
                                unitPrice: round(
                                  (garment?.basePrice ?? i.unitPrice) +
                                    s.extraPrice,
                                ),
                              };
                            }),
                          );
                          setAppliedPromo(undefined);
                        }}
                      />
                    ))}
                  </BottomSheet>
                </Card>
                <Card style={garmentStyles.catalog}>
                  <Title style={garmentStyles.sectionTitle}>
                    Catálogo completo
                  </Title>
                  {catalogGarments.length === 0 && (
                    <Body muted>
                      Todavía no hay prendas disponibles en el catálogo. Puedes
                      elegir la opción de ropa por peso para continuar, o
                      intentarlo más tarde.
                    </Body>
                  )}
                  {catalogGarments.map((g) => {
                    const selected = items.find((i) => i.id === g.id);
                    const unitPrice =
                      selected?.unitPrice ??
                      round(g.basePrice + (activeServiceObj?.extraPrice ?? 0));
                    return (
                      <GarmentSurface
                        key={g.id}
                        icon={g.iconKey as IconName}
                        controls={
                          <>
                            <View style={garmentStyles.quantityButton}>
                              <IconButton
                                label={"Quitar " + g.name}
                                icon="remove"
                                haptic="light"
                                onPress={() => changeCount(g.id, -1)}
                                disabled={!selected}
                              />
                            </View>
                            <Text style={garmentStyles.quantity}>
                              {selected?.quantity ?? 0}
                            </Text>
                            <View style={garmentStyles.quantityButton}>
                              <IconButton
                                label={"Agregar " + g.name}
                                icon="add"
                                haptic="light"
                                onPress={() => changeCount(g.id, 1)}
                              />
                            </View>
                          </>
                        }
                      >
                        <View style={{ flex: 1, gap: 4 }}>
                          <Body style={garmentStyles.name}>{g.name}</Body>
                          <Body muted style={garmentStyles.description}>
                            {g.category} · {g.estimatedHours} h ·{" "}
                            {money(unitPrice)} por unidad
                          </Body>
                          {selected && (
                            <Body muted style={garmentStyles.service}>
                              {selected.serviceType}
                            </Body>
                          )}
                        </View>
                      </GarmentSurface>
                    );
                  })}
                </Card>
              </>
            )}
          </>
        )}
        {step === 4 && (
          <Card style={garmentStyles.catalog}>
            <Title style={garmentStyles.sectionTitle}>
              Personaliza tu cuidado
            </Title>
            {catalogExtras.map((e) => (
              <View key={e.id} style={{ gap: 4 }}>
                <Check
                  label={`${e.name} · ${money(e.price)}`}
                  style={[
                    garmentStyles.extra,
                    extraIds.includes(e.id) && garmentStyles.selectedExtra,
                    extraIds.includes(e.id) && {
                      borderColor: extraTone(e.id, e.name).color,
                    },
                  ]}
                  checked={extraIds.includes(e.id)}
                  onChange={(selected) =>
                    setExtraIds(
                      selected
                        ? [...extraIds, e.id]
                        : extraIds.filter((id) => id !== e.id),
                    )
                  }
                >
                  <ExtraContent
                    id={e.id}
                    name={e.name}
                    description={e.description}
                    price={money(e.price)}
                    checked={extraIds.includes(e.id)}
                  />
                </Check>
              </View>
            ))}
          </Card>
        )}
        {step === 5 && (
          <>
            <Card style={confirmationStyles.card}>
              <Title style={confirmationStyles.title}>Revisa tu agenda</Title>
              <ConfirmationGroup icon="location-outline">
                <Body style={confirmationStyles.address}>
                  Entrada: {inbound.addressFull}
                </Body>
                <Body muted style={confirmationStyles.caption}>
                  {inbound.scheduledDate} · {inbound.timeSlotText}
                </Body>
              </ConfirmationGroup>
              <ConfirmationGroup icon="location-outline">
                <Body style={confirmationStyles.address}>
                  Salida: {outbound.addressFull}
                </Body>
                <Body muted style={confirmationStyles.caption}>
                  {outbound.scheduledDate} · {outbound.timeSlotText}
                </Body>
              </ConfirmationGroup>
              <Body muted style={confirmationStyles.notice}>
                Cancelación y reprogramación: corte de 60 minutos. Cargo por
                cancelación tardía: $5.00.
              </Body>
            </Card>
            <Card style={confirmationStyles.card}>
              <View style={confirmationStyles.promoRow}>
                <View style={confirmationStyles.promoField}>
                  <Field
                    label="Código promocional"
                    style={confirmationStyles.input}
                    labelStyle={confirmationStyles.label}
                    autoCapitalize="characters"
                    value={promoInput}
                    onChangeText={setPromoInput}
                  />
                </View>
                <Button
                  label="Aplicar promoción"
                  secondary
                  variant="primary"
                  style={confirmationStyles.apply}
                  textStyle={confirmationStyles.applyText}
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
              </View>
              {appliedPromo && (
                <View style={confirmationStyles.promoApplied}>
                  <Icon name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={confirmationStyles.promoText}>
                    {appliedPromo}
                  </Text>
                </View>
              )}
            </Card>
            <PricingSummary
              pricing={pricing}
              unknown={model === "PER_WEIGHT"}
              appearance="confirmation"
            />
            <Card style={confirmationStyles.card}>
              <ListItem
                title="Elegir método de pago"
                subtitle={
                  payment === "Billetera"
                    ? "Billetera Laundry · " + money(c.walletBalance)
                    : "Tarjeta"
                }
                icon="card-outline"
                onPress={() => setPanel("payment")}
              />
              <BottomSheet
                title="Método de pago"
                visible={panel === "payment"}
                onClose={() => setPanel(undefined)}
              >
                <Body muted>Los pagos se registran solo en este dispositivo.</Body>
                {["Billetera", "Tarjeta"].map((method) => (
                  <Choice
                    key={method}
                    style={[
                      confirmationStyles.paymentChoice,
                      payment === method && confirmationStyles.paymentSelected,
                    ]}
                    textStyle={confirmationStyles.paymentText}
                    label={
                      method === "Billetera"
                        ? `Billetera Laundry · ${money(c.walletBalance)}`
                        : "Tarjeta"
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
