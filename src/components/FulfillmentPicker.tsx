import { View } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useApp } from "../store/AppProvider";
import { facilities } from "../domain/catalog";
import { fetchFacilities } from "../services/catalog/catalogService";
import {
  freeSeats,
  mapBackendSlotToTimeSlot,
  seatsLabel,
  slotService,
  type BackendSlot,
} from "../services/slots/slotService";
import {
  currentCustomer,
  slotContext,
  slotRange,
  today,
} from "../domain/repository";
import type { Facility, Leg, TimeSlot } from "../domain/models";
import { Badge, Body, Button, Card, Choice, Title } from "./ui";
import { SegmentedControl } from "./presentation";
import { ScheduleCalendar } from "./ScheduleCalendar";
import {
  FulfillmentHint,
  FulfillmentRow,
  requestStyles,
} from "./FulfillmentPresentation";
import { BottomSheet } from "./overlay/OverlayPortal";
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";
export function FulfillmentPicker({
  leg,
  value,
  onChange,
  appearance = "default",
  facilityId: lockedFacilityId,
  notBefore,
}: {
  leg: "INBOUND" | "OUTBOUND";
  value: Leg;
  onChange(value: Leg): void;
  appearance?: "default" | "request";
  /** Sede que atiende la solicitud: la entrega debe ser de la misma sede que la recogida. */
  facilityId?: string;
  /** Fecha y hora en que termina la recogida: la entrega no puede empezar antes. */
  notBefore?: { date: string; time: string };
}) {
  const facilityFilter = value.facilityId || lockedFacilityId;
  const { state } = useApp(),
    c = currentCustomer(state),
    nav = useLaundryNavigation();
  const [panel, setPanel] = useState<"place" | "time">();
  const [branches, setBranches] = useState<Facility[]>(() => [...facilities]);
  // null = el servidor aún no respondió (o no hay conexión): solo entonces se usa la agenda
  // guardada. Una lista vacía del servidor significa que de verdad no hay franjas.
  const [backendSlots, setBackendSlots] = useState<BackendSlot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotNotice, setSlotNotice] = useState("");
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  useEffect(() => {
    let active = true;
    void fetchFacilities().then((loaded) => {
      if (active) setBranches([...loaded]);
    });
    return () => {
      active = false;
    };
  }, []);
  const timeOpen = panel === "time";
  useEffect(() => {
    let active = true;
    const reqContext =
      leg === "INBOUND"
        ? "DRIVER_PICKUP"
        : value.method === "DRIVER"
          ? "DRIVER_DELIVERY"
          : "FACILITY_PICKUP";
    setLoadingSlots(true);
    // Se piden también las completas para mostrarlas como tales; se vuelve a pedir cada vez
    // que se abre la hoja para reflejar los cupos que otros clientes reservaron.
    void slotService
      .fetchSlots({
        context: reqContext,
        facilityId: facilityFilter,
        onlyAvailable: false,
      })
      .then((loaded) => {
        if (!active) return;
        const rows = loaded ?? [];
        setBackendSlots(rows);
        const { value: current, onChange: change } = latest.current;
        if (!current.timeSlotId) return;
        const chosen = rows.find((s) => s.id === current.timeSlotId);
        if (!chosen || chosen.available <= 0) {
          change({ ...current, timeSlotId: undefined, timeSlotText: "" });
          setSlotNotice(
            "La franja que elegiste ya no tiene cupo. Elige otro horario.",
          );
        }
      })
      .catch(() => {
        // Sin conexión: se mantiene la última agenda conocida.
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [leg, value.method, facilityFilter, timeOpen]);

  type PickerSlot = TimeSlot & { backendFacilityId?: string };
  const isUpcoming = (slot: TimeSlot) =>
    new Date(`${slot.date}T${slot.endTime}:00-05:00`).getTime() > Date.now();
  const slots: PickerSlot[] = (
    backendSlots
      ? backendSlots.map((bs) => ({
          ...mapBackendSlotToTimeSlot(bs),
          backendFacilityId: bs.facilityId,
        }))
      : state.timeSlots.filter(
          (s) => s.context === slotContext(leg, value.method) && s.date >= today(),
        )
  )
    .filter((s) => s.active && isUpcoming(s))
    .filter((s) => !notBefore || `${s.date} ${s.startTime}` >= `${notBefore.date} ${notBefore.time}`);
  // Las fechas con franjas aparecen aunque estén completas: el cliente ve que ese día no hay cupo.
  const dates = [...new Set(slots.map((s) => s.date))].sort();
  const [date, setDate] = useState(value.scheduledDate || dates[0]);
  const selectedDate = dates.includes(date) ? date : dates[0];
  const changeMethod = (method: Leg["method"]) =>
    onChange({
      ...value,
      method,
      addressId: undefined,
      facilityId: undefined,
      addressFull: "",
      facilityName: undefined,
      timeSlotId: undefined,
      timeSlotText: "",
      scheduledDate: "",
    });
  const driverLabel =
    leg === "INBOUND"
      ? "Chofer recoge en domicilio"
      : "Chofer entrega en domicilio";
  const customerLabel = "Pick up · retiro en sede";
  return (
    <View style={{ gap: 16 }}>
      <Card style={appearance === "request" && requestStyles.card}>
        <Title style={appearance === "request" && requestStyles.sectionTitle}>
          {leg === "INBOUND" ? "Recogida a domicilio" : "Cómo recibes tu ropa"}
        </Title>
        {leg === "INBOUND" ? (
          <FulfillmentHint active={appearance === "request"}>
            <Body style={appearance === "request" && requestStyles.hintText}>
              Chofer recoge en domicilio
            </Body>
          </FulfillmentHint>
        ) : (
          <SegmentedControl
            appearance={appearance}
            options={[
              { value: "DRIVER", label: driverLabel },
              { value: "CUSTOMER", label: customerLabel },
            ]}
            value={value.method}
            onChange={changeMethod}
          />
        )}
        <FulfillmentRow
          appearance={appearance}
          selected={!!value.addressFull}
          title={value.method === "DRIVER" ? "Elegir dirección" : "Elegir sede"}
          subtitle={value.addressFull || "Selecciona dónde"}
          icon={
            value.method === "DRIVER" ? "location-outline" : "business-outline"
          }
          onPress={() => setPanel("place")}
        />
        <FulfillmentRow
          appearance={appearance}
          selected={!!value.timeSlotId}
          title="Elegir fecha y horario"
          subtitle={
            value.timeSlotId
              ? value.scheduledDate + " · " + value.timeSlotText
              : "Selecciona una franja con cupo"
          }
          icon="calendar-outline"
          onPress={() => setPanel("time")}
        />
      </Card>
      <BottomSheet
        title={value.method === "DRIVER" ? "Dirección" : "Sede Laundry"}
        visible={panel === "place"}
        onClose={() => setPanel(undefined)}
      >
        {value.method === "DRIVER" ? (
          <>
            {c.addresses.map((address) => (
              <Choice
                key={address.id}
                style={
                  appearance === "request" && [
                    requestStyles.choice,
                    value.addressId === address.id &&
                      requestStyles.selectedChoice,
                  ]
                }
                textStyle={appearance === "request" && requestStyles.choiceText}
                label={address.title + " · " + address.fullAddress}
                selected={value.addressId === address.id}
                onPress={() => {
                  onChange({
                    ...value,
                    addressId: address.id,
                    addressFull: address.fullAddress,
                    latitude: address.latitude,
                    longitude: address.longitude,
                  });
                  setPanel(undefined);
                }}
              />
            ))}
            {!c.addresses.length && (
              <Body>Añade una dirección para continuar a domicilio.</Body>
            )}
            <Button
              label="Administrar direcciones"
              secondary
              onPress={() => {
                setPanel(undefined);
                nav.navigate("ClientAddresses");
              }}
            />
          </>
        ) : (
          branches
            .filter(
              (f) =>
                leg === "OUTBOUND" &&
                f.allowsPickup &&
                (!lockedFacilityId || f.id === lockedFacilityId),
            )
            .map((f) => (
              <View key={f.id} style={{ gap: 4 }}>
                <Choice
                  style={
                    appearance === "request" && [
                      requestStyles.choice,
                      value.facilityId === f.id && requestStyles.selectedChoice,
                    ]
                  }
                  textStyle={
                    appearance === "request" && requestStyles.choiceText
                  }
                  label={f.name + " · " + f.address}
                  selected={value.facilityId === f.id}
                  onPress={() => {
                    onChange({
                      ...value,
                      facilityId: f.id,
                      facilityName: f.name,
                      addressFull: f.address,
                      latitude: f.latitude,
                      longitude: f.longitude,
                    });
                    setPanel(undefined);
                  }}
                />
                <Body muted>{f.openingHours}</Body>
              </View>
            ))
        )}
      </BottomSheet>
      <BottomSheet
        title="Fecha y franja horaria"
        visible={panel === "time"}
        onClose={() => setPanel(undefined)}
      >
        <Body muted>La reserva se confirma al guardar.</Body>
        {appearance === "request" ? (
          <ScheduleCalendar
            dates={dates}
            value={selectedDate}
            onChange={(d) => {
              setDate(d);
              onChange({
                ...value,
                scheduledDate: d,
                timeSlotId: undefined,
                timeSlotText: "",
              });
            }}
          />
        ) : (
          dates.map((d) => (
            <Choice
              key={d}
              label={d}
              selected={d === selectedDate}
              onPress={() => {
                setDate(d);
                onChange({
                  ...value,
                  scheduledDate: d,
                  timeSlotId: undefined,
                  timeSlotText: "",
                });
              }}
            />
          ))
        )}
        {!!slotNotice && (
          <View testID="slot_notice" accessibilityRole="alert">
            <Body style={{ color: "#B45309" }}>{slotNotice}</Body>
          </View>
        )}
        {slots
          .filter((s) => s.date === selectedDate)
          .map((slot) => {
            const seats = freeSeats(slot);
            const available = seats > 0;
            return (
              <View key={slot.id} style={{ gap: 4 }}>
                <Choice
                  style={
                    appearance === "request" && [
                      requestStyles.choice,
                      value.timeSlotId === slot.id &&
                        requestStyles.selectedChoice,
                    ]
                  }
                  textStyle={
                    appearance === "request" && requestStyles.choiceText
                  }
                  label={slot.date + " · " + slotRange(slot)}
                  disabled={!available}
                  selected={value.timeSlotId === slot.id}
                  onPress={() => {
                    setSlotNotice("");
                    onChange({
                      ...value,
                      timeSlotId: slot.id,
                      scheduledDate: slot.date,
                      timeSlotText: slotRange(slot),
                      facilityId: slot.backendFacilityId || value.facilityId,
                    });
                    setPanel(undefined);
                  }}
                />
                <Badge>{available ? seatsLabel(seats) : "Completo"}</Badge>
              </View>
            );
          })}
        {!slots.length && loadingSlots && <Body muted>Cargando horarios...</Body>}
        {!slots.length && !loadingSlots && (
          <Body>No hay horarios disponibles para este tramo.</Body>
        )}
        {!!slots.length && !slots.some((s) => freeSeats(s) > 0) && (
          <Body muted>Todas las franjas están completas. Vuelve a intentarlo más tarde.</Body>
        )}
      </BottomSheet>
    </View>
  );
}
