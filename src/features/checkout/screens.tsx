import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  AppHeader,
  Badge,
  BottomSheet,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Page,
  ui,
} from "../../components/ui";
import { useApp } from "../../store/AppStore";
import { useAction } from "../../hooks/useAction";
import {
  availableSlots,
  dateLabel,
  deliveryDates,
  formatMoney,
  pickupDates,
  quote,
  validateSchedule,
  walletBalance,
} from "../../domain/rules";
import { OrderItem, Schedule } from "../../domain/models";
import { AddressEditor } from "../addresses/screens";
import { Colors as C } from "../../theme/colors";
import { businessConfig } from "../../config/business";

const STEPS = ["Prendas", "Extras", "Recogida", "Entrega", "Confirmar"];
const ROUTES = ["garments", "extras", "pickup", "delivery", "confirm"];
export function Stepper({ step }: { step: number }) {
  return (
    <View
      accessibilityLabel={`Paso ${step + 1} de 5: ${STEPS[step]}`}
      style={[ui.row, { gap: 4 }]}
    >
      {STEPS.map((label, i) => (
        <View key={label} style={{ flex: 1, gap: 6, alignItems: "center" }}>
          <View
            style={{
              height: 5,
              width: "100%",
              borderRadius: 5,
              backgroundColor: i <= step ? C.primary : C.border,
            }}
          />
          <Text
            style={{
              fontSize: 10,
              color: i === step ? C.primary : C.textMuted,
              fontWeight: "700",
            }}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}
export function WizardScreen({ step }: { step: number }) {
  const { session, data, engine, online } = useApp();
  const router = useRouter();
  const customer = engine.customer(session!);
  const draft = data.draft;
  const a = useAction();
  const [editor, setEditor] = useState<OrderItem | "new" | null>(null);
  const [addressOpen, setAddressOpen] = useState(false);
  const [promo, setPromo] = useState(draft.promoCode);
  const [checkoutSuccess, setCheckoutSuccess] = useState("");
  const requestId = useRef(
    `checkout-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  const update = (patch: Partial<typeof draft>) =>
    engine.update((d) => {
      d.draft = { ...d.draft, ...patch };
    });
  let pricing;
  let priceError = "";
  try {
    pricing = quote(data, customer, draft);
  } catch (error) {
    priceError = (error as Error).message;
    pricing = quote(data, customer, {
      ...draft,
      promoCode: "",
      rewardRedemptionId: undefined,
    });
  }
  const subtotal = pricing.total;
  const schedule = step === 2 ? draft.pickup : draft.delivery;
  const dates =
    step === 2
      ? pickupDates()
      : step === 3 && draft.pickup?.date
        ? deliveryDates(data, draft.items, draft.pickup.date)
        : [];
  const updateSchedule = (patch: Partial<Schedule>) => {
    const next = {
      address: customer.addresses[0],
      date: "",
      timeSlot: "",
      notes: "",
      ...schedule,
      ...patch,
    };
    update(
      step === 2 ? { pickup: next, delivery: undefined } : { delivery: next },
    );
  };
  const next = () =>
    a.run(async () => {
      if (step === 0 && !draft.items.length)
        throw new Error("Agrega al menos una prenda.");
      if (step === 2 || step === 3) validateSchedule(schedule);
      if (step === 3 && !dates.includes(schedule!.date))
        throw new Error("Selecciona una fecha de entrega disponible.");
      if (step < 4) router.push(`/(client)/new-order/${ROUTES[step + 1]}`);
      else {
        await new Promise((r) => setTimeout(r, 700));
        const order = engine.createOrder(
          session!,
          engine.data.draft,
          requestId.current,
          online,
        );
        setCheckoutSuccess(order.id);
        router.replace(`/(client)/success/${order.id}`);
      }
    });
  return (
    <Page
      footer={
        <View style={ui.row}>
          {!!(step > 0) && (
            <Button
              title="Atrás"
              variant="secondary"
              disabled={a.busy}
              onPress={() =>
                router.replace(`/(client)/new-order/${ROUTES[step - 1]}`)
              }
            />
          )}
          <View style={{ flex: 1 }}>
            <Button
              title={
                step === 4
                  ? `Confirmar y pagar ${formatMoney(subtotal)}`
                  : "Continuar"
              }
              busy={a.busy}
              disabled={
                !!checkoutSuccess || (step === 4 && (!!priceError || !online))
              }
              onPress={next}
            />
          </View>
        </View>
      }
    >
      <Stepper step={step} />
      <AppHeader
        title={
          [
            "¿Qué vamos a lavar?",
            "Dale un toque extra",
            "¿Dónde recogemos tu ropa?",
            "¿Dónde entregamos tu ropa?",
            "Revisa tu solicitud",
          ][step]
        }
        subtitle={`Paso ${step + 1} de 5`}
      />
      {!!(
        step === 4 &&
        data.redemptions.some(
          (r) =>
            r.customerId === customer.id &&
            r.status === "APPROVED" &&
            !r.benefitApplied,
        )
      ) && (
        <Card>
          <Text style={ui.section}>Tus recompensas aprobadas</Text>
          <Chip
            title="Sin recompensa"
            selected={!draft.rewardRedemptionId}
            onPress={() => update({ rewardRedemptionId: undefined })}
          />
          {data.redemptions
            .filter(
              (r) =>
                r.customerId === customer.id &&
                r.status === "APPROVED" &&
                !r.benefitApplied,
            )
            .map((r) => (
              <Chip
                key={r.id}
                title={r.rewardName}
                selected={draft.rewardRedemptionId === r.id}
                onPress={() => update({ rewardRedemptionId: r.id })}
              />
            ))}
          {!!draft.rewardRedemptionId && (
            <Text style={ui.muted}>
              Beneficio por canje: −{formatMoney(pricing.rewardDiscount ?? 0)}.
              Se aplicará a este pedido al confirmarlo.
            </Text>
          )}
        </Card>
      )}
      {!!(step === 0) && (
        <>
          <Text style={ui.muted}>
            Agrega las prendas y selecciona el cuidado para cada una.
          </Text>
          {draft.items.map((item) => (
            <Card key={item.id}>
              <View style={ui.between}>
                <Text style={[ui.section, { flex: 1 }]}>{item.name}</Text>
                <IconButton
                  name="trash-outline"
                  label={`Eliminar ${item.name}`}
                  onPress={() =>
                    update({
                      items: draft.items.filter((i) => i.id !== item.id),
                      delivery: undefined,
                    })
                  }
                />
              </View>
              <Text style={ui.muted}>
                {item.quantity} prendas · {item.serviceName}
              </Text>
              <Text style={ui.body}>
                {formatMoney(item.unitPrice * item.quantity)}
              </Text>
              {!!item.notes && <Text style={ui.meta}>{item.notes}</Text>}
              <Button
                title="Editar prenda"
                variant="secondary"
                onPress={() => setEditor(item)}
              />
            </Card>
          ))}
          {!draft.items.length && (
            <EmptyState
              title="Aún no has agregado prendas"
              text="Elige lo que vamos a cuidar por ti."
            />
          )}
          <Button
            title="Agregar prendas"
            icon="add"
            onPress={() => setEditor("new")}
          />
        </>
      )}
      {step === 1 &&
        data.catalog
          .filter(
            (e) => e.category === "EXTRAS" && e.active && e.customerSelectable,
          )
          .map((e) => (
            <Card key={e.id}>
              <Badge
                title={
                  draft.extraIds.includes(e.id)
                    ? "Seleccionado"
                    : formatMoney(e.price)
                }
              />
              <Text style={ui.section}>{e.name}</Text>
              <Text style={ui.muted}>{e.description}</Text>
              <Button
                title={
                  draft.extraIds.includes(e.id)
                    ? "Quitar extra"
                    : `Agregar · ${formatMoney(e.price)}`
                }
                variant="secondary"
                onPress={() =>
                  update({
                    extraIds: draft.extraIds.includes(e.id)
                      ? draft.extraIds.filter((id) => id !== e.id)
                      : [...draft.extraIds, e.id],
                  })
                }
              />
            </Card>
          ))}
      {!!(step === 2 || step === 3) && (
        <>
          {!!(step === 3 && draft.pickup) && (
            <Button
              title="Misma dirección de recogida"
              variant="secondary"
              onPress={() => updateSchedule({ address: draft.pickup!.address })}
            />
          )}
          {customer.addresses.map((addr) => (
            <Card
              key={addr.id}
              style={{
                borderColor:
                  schedule?.address?.id === addr.id ? C.primary : C.border,
              }}
            >
              <Text style={ui.section}>{addr.title}</Text>
              <Text style={ui.muted}>{addr.fullAddress}</Text>
              <Button
                title={
                  schedule?.address?.id === addr.id
                    ? "Dirección seleccionada"
                    : "Elegir dirección"
                }
                variant="secondary"
                onPress={() => updateSchedule({ address: addr })}
              />
            </Card>
          ))}
          <Button
            title="Otra ubicación"
            icon="location-outline"
            variant="secondary"
            onPress={() => setAddressOpen(true)}
          />
          {!!(step === 3 && dates.length > 0) && (
            <Text style={ui.muted}>
              Primera fecha disponible: {dateLabel(dates[0])}
            </Text>
          )}
          <Text style={ui.section}>Fecha</Text>
          <View style={ui.wrap}>
            {dates.map((date) => (
              <Chip
                key={date}
                title={dateLabel(date)}
                selected={schedule?.date === date}
                onPress={() => updateSchedule({ date, timeSlot: "" })}
              />
            ))}
          </View>
          <Text style={ui.section}>Franja horaria</Text>
          {!schedule?.date ? (
            <Text style={ui.muted}>
              Selecciona una fecha para ver los horarios.
            </Text>
          ) : (
            <View style={ui.wrap}>
              {availableSlots(schedule.date).map((slot) => (
                <Chip
                  key={slot}
                  title={slot}
                  selected={schedule.timeSlot === slot}
                  onPress={() => updateSchedule({ timeSlot: slot })}
                />
              ))}
            </View>
          )}
          <Field
            label="Indicaciones para el chofer"
            value={schedule?.notes ?? ""}
            multiline
            onChangeText={(notes) => updateSchedule({ notes })}
          />
        </>
      )}
      {!!(step === 4) && (
        <>
          <Card>
            <Text style={ui.section}>Prendas y extras</Text>
            {draft.items.map((i) => (
              <Text key={i.id} style={ui.body}>
                {i.quantity} × {i.name} · {i.serviceName}
              </Text>
            ))}
            {data.catalog
              .filter((c) => draft.extraIds.includes(c.id))
              .map((c) => (
                <Text key={c.id} style={ui.muted}>
                  {c.name}
                </Text>
              ))}
            <Button
              title="Editar prendas"
              variant="secondary"
              onPress={() => router.replace("/(client)/new-order/garments")}
            />
          </Card>
          {[
            { title: "Recogida", schedule: draft.pickup, route: "pickup" },
            { title: "Entrega", schedule: draft.delivery, route: "delivery" },
          ].map((row) => (
            <Card key={row.title}>
              <Text style={ui.section}>{row.title}</Text>
              <Text style={ui.body}>
                {row.schedule
                  ? `${dateLabel(row.schedule.date)} · ${row.schedule.timeSlot}`
                  : "Falta programar"}
              </Text>
              <Text style={ui.muted}>{row.schedule?.address?.fullAddress}</Text>
              <Button
                title={`Editar ${row.title.toLowerCase()}`}
                variant="secondary"
                onPress={() =>
                  router.replace(`/(client)/new-order/${row.route}`)
                }
              />
            </Card>
          ))}
          <Card>
            <Field
              label="Código promocional"
              value={promo}
              autoCapitalize="characters"
              onChangeText={setPromo}
            />
            <Button
              title="Aplicar promoción"
              busy={a.busy}
              variant="secondary"
              onPress={() =>
                a.run(async () => {
                  await new Promise((r) => setTimeout(r, 350));
                  quote(engine.data, customer, {
                    ...engine.data.draft,
                    promoCode: promo.trim().toUpperCase(),
                  });
                  update({ promoCode: promo.trim().toUpperCase() });
                }, "Promoción aplicada")
              }
            />
            {!!draft.promoCode && (
              <>
                <Badge title={`${draft.promoCode} aplicada`} tone="success" />
                <Button
                  title="Quitar promoción"
                  variant="secondary"
                  onPress={() => {
                    update({ promoCode: "" });
                    setPromo("");
                  }}
                />
              </>
            )}
            {!!priceError && <ErrorState text={priceError} />}
          </Card>
          <Card>
            <Text style={ui.section}>Método de pago</Text>
            <Chip
              title={`Billetera · ${formatMoney(walletBalance(data, customer.id))}`}
              selected={draft.paymentMethod === "WALLET"}
              onPress={() => update({ paymentMethod: "WALLET" })}
            />
            {data.cards
              .filter((c) => c.customerId === customer.id)
              .map((card) => (
                <Chip
                  key={card.id}
                  title={`${card.brand} •••• ${card.last4}`}
                  selected={draft.paymentMethod === card.id}
                  onPress={() => update({ paymentMethod: card.id })}
                />
              ))}
            {!!(
              draft.paymentMethod === "WALLET" &&
              walletBalance(data, customer.id) < subtotal
            ) && (
              <>
                <ErrorState text="Saldo insuficiente. Recarga o elige otra tarjeta." />
                <Button
                  title="Recargar saldo"
                  variant="secondary"
                  onPress={() => router.push("/(client)/wallet")}
                />
              </>
            )}
            <Button
              title="Agregar tarjeta"
              variant="secondary"
              onPress={() => router.push("/(client)/payments")}
            />
            <Text style={ui.meta}>
              El pago es simulado; no se envían datos a una entidad bancaria.
            </Text>
          </Card>
          <Card>
            {[
              ["Subtotal", pricing.itemsSubtotal],
              ["Extras", pricing.extrasTotal],
              ["Descuento", -pricing.discount],
              ["Beneficio membresía", -pricing.membershipBenefitDiscount],
              ["Recompensa", -(pricing.rewardDiscount ?? 0)],
              ["Entrega", pricing.deliveryFee],
              ["Total", pricing.total],
            ].map(([label, amount]) => (
              <View key={label} style={ui.between}>
                <Text style={ui.body}>{label}</Text>
                <Text style={ui.section}>{formatMoney(Number(amount))}</Text>
              </View>
            ))}
            <Text style={ui.meta}>
              Pedido mínimo: {formatMoney(businessConfig.minimumOrder)}
            </Text>
          </Card>
        </>
      )}
      {!!(step < 4) && (
        <Text style={[ui.section, { color: C.primary }]}>
          Total estimado: {formatMoney(subtotal)}
        </Text>
      )}
      {!!a.error && (
        <ErrorState text={a.error} retry={step === 4 ? next : undefined} />
      )}
      {!!editor && (
        <GarmentEditor
          item={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
      {!!addressOpen && (
        <AddressEditor visible onClose={() => setAddressOpen(false)} />
      )}
    </Page>
  );
}
function GarmentEditor({
  item,
  onClose,
}: {
  item?: OrderItem;
  onClose: () => void;
}) {
  const { data, engine } = useApp();
  const a = useAction();
  const [catalogId, setCatalog] = useState(
    item?.catalogId ??
      data.catalog.find(
        (c) => c.category === "PRENDAS" && c.active && c.customerSelectable,
      )!.id,
  );
  const [serviceId, setService] = useState(item?.serviceId ?? "care");
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [notes, setNotes] = useState(item?.notes ?? "");
  return (
    <BottomSheet
      visible
      title={item ? "Editar prenda" : "Agregar prendas"}
      onClose={onClose}
    >
      <Text style={ui.section}>Tipo de prenda</Text>
      <View style={ui.wrap}>
        {data.catalog
          .filter(
            (c) => c.category !== "EXTRAS" && c.active && c.customerSelectable,
          )
          .map((g) => (
            <Chip
              key={g.id}
              title={g.name}
              selected={catalogId === g.id}
              onPress={() => setCatalog(g.id)}
            />
          ))}
      </View>
      <Text style={ui.section}>Servicio</Text>
      <View style={ui.wrap}>
        {data.services
          .filter((s) => s.active && s.customerSelectable)
          .map((s) => (
            <Chip
              key={s.id}
              title={s.name}
              selected={serviceId === s.id}
              onPress={() => setService(s.id)}
            />
          ))}
      </View>
      <View style={ui.between}>
        <Text style={ui.section}>Cantidad</Text>
        <View style={ui.row}>
          <IconButton
            name="remove"
            label="Reducir cantidad"
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
          />
          <Text style={ui.section}>{quantity}</Text>
          <IconButton
            name="add"
            label="Aumentar cantidad"
            onPress={() =>
              setQuantity(Math.min(businessConfig.maxQuantity, quantity + 1))
            }
          />
        </View>
      </View>
      <Field
        label="Notas opcionales"
        value={notes}
        multiline
        onChangeText={setNotes}
      />
      <Button
        title={item ? "Guardar cambios" : "Agregar"}
        busy={a.busy}
        onPress={() =>
          a.run(() => {
            engine.update((d) => {
              const g = d.catalog.find((c) => c.id === catalogId)!;
              const s = d.services.find((v) => v.id === serviceId)!;
              const row = {
                id: item?.id ?? engine.id(d, "item"),
                catalogId,
                serviceId,
                name: g.name,
                serviceName: s.name,
                quantity,
                unitPrice: g.price + s.price,
                notes,
              };
              d.draft.items = [
                ...d.draft.items.filter((i) => i.id !== row.id),
                row,
              ];
              d.draft.delivery = undefined;
            });
            onClose();
          })
        }
      />
      {!!a.error && <ErrorState text={a.error} />}
    </BottomSheet>
  );
}
