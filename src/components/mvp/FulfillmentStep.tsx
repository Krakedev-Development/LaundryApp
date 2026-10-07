import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOrderStore } from "../../store/useOrderStore";
import {
  businessService,
  currentActor,
  useBusinessStore,
} from "../../store/useBusinessStore";
import { MODE_LABELS } from "../../services/domain/BusinessService";
import { Screen, Card, Action, ui } from "./ui";
export function FulfillmentStep({ leg }: { leg: "inbound" | "outbound" }) {
  const router = useRouter(),
    draft = useOrderStore(),
    state = useBusinessStore((s) => s.state)!,
    actor = currentActor();
  const client = state.customers.find((c) => c.id === actor.id);
  const address = client?.addresses[0];
  const inbound = leg === "inbound",
    method = inbound ? draft.inboundMethod : draft.outboundMethod;
  const facility = state.facilities.find((f) => f.id === draft.facilityId);
  const [street, setStreet] = useState(
    inbound
      ? draft.pickupAddress || address?.street || ""
      : draft.deliveryAddress || draft.pickupAddress || address?.street || "",
  );
  const coords = inbound
    ? draft.pickupCoords
    : (draft.deliveryCoords ?? draft.pickupCoords);
  const [lat, setLat] = useState(
      String(coords?.latitude ?? address?.coordinates.lat ?? -2.124),
    ),
    [lng, setLng] = useState(
      String(coords?.longitude ?? address?.coordinates.lng ?? -79.867),
    );
  const slotId = inbound ? draft.inboundSlotId : draft.outboundSlotId;
  const context = inbound
    ? method === "DRIVER"
      ? "DRIVER_PICKUP"
      : "FACILITY_DROPOFF"
    : method === "DRIVER"
      ? "DRIVER_DELIVERY"
      : "FACILITY_PICKUP";
  const slots = businessService
    .availableSlots(draft.facilityId, context)
    .filter((slot) => {
      if (inbound) return true;
      const entry = state.timeSlots.find((x) => x.id === draft.inboundSlotId);
      if (!entry) return false;
      const hours =
        (draft.pricingModel === "PER_WEIGHT"
          ? state.catalog.find((c) => c.id === draft.catalogServiceId)
              ?.estimatedHours
          : undefined) ??
        Math.max(
          0,
          ...draft.garments.map(
            (g) =>
              state.catalog.find((c) => c.id === "APP-" + g.washType)
                ?.estimatedHours ?? 24,
          ),
        );
      return (
        new Date(`${slot.date}T${slot.start}:00`).getTime() >=
        new Date(`${entry.date}T${entry.start}:00`).getTime() + hours * 3600000
      );
    });
  const [error, setError] = useState("");
  useEffect(() => {
    if (!draft.facilityId) {
      draft.setBusinessDraft({
        facilityId: actor.id === "c1" ? "FAC-LEGACY" : "FAC-02",
      });
    }
  }, [draft.facilityId, actor.id]);
  useEffect(() => {
    const text = inbound ? draft.pickupAddress : draft.deliveryAddress;
    const p = inbound ? draft.pickupCoords : draft.deliveryCoords;
    if (text) setStreet(text);
    if (p) {
      setLat(String(p.latitude));
      setLng(String(p.longitude));
    }
  }, [
    draft.pickupAddress,
    draft.deliveryAddress,
    draft.pickupCoords,
    draft.deliveryCoords,
  ]);
  const next = () => {
    if (
      method === "DRIVER" &&
      (!street.trim() ||
        !Number.isFinite(Number(lat)) ||
        !Number.isFinite(Number(lng)))
    ) {
      setError("Selecciona una dirección con coordenadas válidas.");
      return;
    }
    const slot = state.timeSlots.find((s) => s.id === slotId);
    if (
      !slot &&
      (method === "DRIVER" ||
        inbound ||
        state.businessPolicy.requireStorePickupSlot)
    ) {
      setError("Selecciona una franja disponible.");
      return;
    }
    if (!facility) {
      setError("Selecciona una sede.");
      return;
    }
    const newAddress = { latitude: Number(lat), longitude: Number(lng) };
    if (inbound)
      draft.setBusinessDraft({
        pickupAddress: method === "CUSTOMER" ? facility.address : street,
        pickupCoords:
          method === "CUSTOMER"
            ? {
                latitude: facility.coordinates.lat,
                longitude: facility.coordinates.lng,
              }
            : newAddress,
        pickupDate: slot?.date ?? null,
        pickupSlot: slot ? `${slot.start}–${slot.end}` : null,
      });
    else
      draft.setBusinessDraft({
        deliveryAddress: method === "CUSTOMER" ? facility.address : street,
        deliveryCoords:
          method === "CUSTOMER"
            ? {
                latitude: facility.coordinates.lat,
                longitude: facility.coordinates.lng,
              }
            : newAddress,
        deliveryDate: slot?.date ?? null,
        deliverySlot: slot ? `${slot.start}–${slot.end}` : null,
        deliverySameAsPickup: false,
      });
    router.push(
      inbound
        ? "/(client)/new-order/step4-delivery"
        : "/(client)/new-order/step5-confirm",
    );
  };
  return (
    <Screen title={inbound ? "Entrada y modalidad" : "Salida y entrega"}>
      <Text style={ui.muted}>
        {inbound ? "Paso 3" : "Paso 4"} de 5 · Agenda con cupos locales
      </Text>
      {inbound && (
        <Card>
          <Text style={ui.subtitle}>¿Cómo prefieres el servicio?</Text>
          {Object.entries(MODE_LABELS).map(([value, label]) => {
            const selected =
              value ===
              `${draft.inboundMethod === "DRIVER" ? "HOME" : "STORE"}_${draft.outboundMethod === "DRIVER" ? "HOME" : "STORE"}`;
            return (
              <TouchableOpacity
                key={value}
                style={[ui.outline, selected && ui.selected]}
                onPress={() =>
                  draft.setBusinessDraft({
                    inboundMethod: value.startsWith("HOME")
                      ? "DRIVER"
                      : "CUSTOMER",
                    outboundMethod: value.endsWith("HOME")
                      ? "DRIVER"
                      : "CUSTOMER",
                    inboundSlotId: "",
                    outboundSlotId: "",
                  })
                }
              >
                <Text style={ui.text}>{label}</Text>
              </TouchableOpacity>
            );
          })}
          <Text style={ui.muted}>
            El pedido conserva la misma referencia durante todos los tramos.
          </Text>
        </Card>
      )}
      <Card>
        <Text style={ui.subtitle}>Sede de servicio</Text>
        {inbound ? (
          state.facilities
            .filter(
              (f) =>
                f.status === "ACTIVE" &&
                (draft.inboundMethod === "DRIVER" ||
                  f.acceptsCustomerDropoff) &&
                (draft.outboundMethod === "DRIVER" || f.allowsCustomerPickup),
            )
            .map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[ui.outline, draft.facilityId === f.id && ui.selected]}
                onPress={() => {
                  draft.setBusinessDraft({
                    facilityId: f.id,
                    inboundSlotId: "",
                    outboundSlotId: "",
                  });
                  setError("");
                }}
              >
                <Text style={ui.text}>{f.name}</Text>
                <Text style={ui.muted}>
                  {f.address} · {f.openingHours}
                </Text>
              </TouchableOpacity>
            ))
        ) : (
          <>
            <Text style={ui.text}>{facility?.name}</Text>
            <Text style={ui.muted}>
              Las transferencias entre sedes permanecen en revisión. Esta
              solicitud conserva la sede seleccionada.
            </Text>
          </>
        )}
      </Card>
      {method === "DRIVER" && (
        <Card>
          <Text style={ui.subtitle}>
            Dirección de {inbound ? "recogida" : "entrega"}
          </Text>
          <TextInput
            accessibilityLabel="Dirección de servicio"
            style={ui.input}
            value={street}
            onChangeText={setStreet}
            placeholder="Dirección"
          />
          <Text style={ui.muted}>
            Coordenadas de demostración. La cobertura se valida al confirmar.
          </Text>
          <View style={ui.row}>
            <TextInput
              accessibilityLabel="Latitud de servicio"
              style={[ui.input, { flex: 1 }]}
              value={lat}
              onChangeText={setLat}
            />
            <TextInput
              accessibilityLabel="Longitud de servicio"
              style={[ui.input, { flex: 1 }]}
              value={lng}
              onChangeText={setLng}
            />
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/(client)/select-address",
                params: { leg },
              })
            }
            style={ui.outline}
          >
            <Text style={ui.link}>Buscar o seleccionar en el mapa</Text>
          </TouchableOpacity>
        </Card>
      )}
      <Card>
        <Text style={ui.subtitle}>
          Franja de {inbound ? "entrada" : "salida"}
        </Text>
        <Text style={ui.muted}>
          Consultar no reserva cupos. La reserva se realiza al confirmar la
          solicitud.
        </Text>
        {!inbound &&
          method === "CUSTOMER" &&
          !state.businessPolicy.requireStorePickupSlot && (
            <TouchableOpacity
              style={[ui.outline, !slotId && ui.selected]}
              onPress={() => draft.setBusinessDraft({ outboundSlotId: "" })}
            >
              <Text style={ui.text}>
                Retirar al estar listo · reserva opcional en revisión
              </Text>
            </TouchableOpacity>
          )}
        {slots.map((slot) => (
          <TouchableOpacity
            key={slot.id}
            style={[ui.outline, slotId === slot.id && ui.selected]}
            onPress={() =>
              draft.setBusinessDraft(
                inbound
                  ? { inboundSlotId: slot.id }
                  : { outboundSlotId: slot.id },
              )
            }
          >
            <Text style={ui.text}>
              {slot.date} · {slot.start}–{slot.end}
            </Text>
            <Text style={ui.muted}>
              {slot.capacity - slot.reservedCount} cupos disponibles
            </Text>
          </TouchableOpacity>
        ))}
        {slots.length === 0 && (
          <Text style={ui.text}>
            No hay franjas disponibles para esta sede y modalidad.
          </Text>
        )}
      </Card>
      {error && <Text style={ui.error}>{error}</Text>}
      <Action label="Continuar" icon="arrow-forward" onPress={next} />
    </Screen>
  );
}
