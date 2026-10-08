import { View } from "react-native";
import { useState } from "react";
import { useApp } from "../store/AppProvider";
import { facilities } from "../domain/catalog";
import {
  currentCustomer,
  slotContext,
  slotRange,
  today,
} from "../domain/repository";
import type { Leg } from "../domain/models";
import { Badge, Body, Button, Card, Choice, Title } from "./ui";
import { ListItem, SegmentedControl } from "./presentation";
import { BottomSheet } from "./overlay/OverlayPortal";
import { useLaundryNavigation } from "../navigation/useLaundryNavigation";
export function FulfillmentPicker({
  leg,
  value,
  onChange,
}: {
  leg: "INBOUND" | "OUTBOUND";
  value: Leg;
  onChange(value: Leg): void;
}) {
  const { state } = useApp(),
    c = currentCustomer(state),
    nav = useLaundryNavigation();
  const [panel, setPanel] = useState<"place" | "time">();
  const slots = state.timeSlots.filter(
    (s) => s.context === slotContext(leg, value.method) && s.date >= today(),
  );
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
  const customerLabel =
    leg === "INBOUND" ? "Entrego en sede" : "Retiro en sede";
  return (
    <View style={{ gap: 16 }}>
      <Card>
        <Title>
          {leg === "INBOUND" ? "Cómo entregas tu ropa" : "Cómo recibes tu ropa"}
        </Title>
        <SegmentedControl
          options={[
            { value: "DRIVER", label: driverLabel },
            { value: "CUSTOMER", label: customerLabel },
          ]}
          value={value.method}
          onChange={changeMethod}
        />
        <ListItem
          title={value.method === "DRIVER" ? "Elegir dirección" : "Elegir sede"}
          subtitle={value.addressFull || "Selecciona dónde"}
          icon={
            value.method === "DRIVER" ? "location-outline" : "business-outline"
          }
          onPress={() => setPanel("place")}
        />
        <ListItem
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
          facilities
            .filter((f) =>
              leg === "INBOUND" ? f.acceptsDropoff : f.allowsPickup,
            )
            .map((f) => (
              <View key={f.id} style={{ gap: 4 }}>
                <Choice
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
        {dates.map((d) => (
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
        ))}
        {slots
          .filter((s) => s.date === selectedDate)
          .map((slot) => {
            const available =
              slot.active &&
              slot.reservedCount < slot.capacity &&
              new Date(slot.date + "T" + slot.endTime + ":00-05:00").getTime() >
                Date.now();
            return (
              <View key={slot.id} style={{ gap: 4 }}>
                <Choice
                  label={slot.date + " · " + slotRange(slot)}
                  disabled={!available && slot.id !== value.timeSlotId}
                  selected={value.timeSlotId === slot.id}
                  onPress={() => {
                    onChange({
                      ...value,
                      timeSlotId: slot.id,
                      scheduledDate: slot.date,
                      timeSlotText: slotRange(slot),
                    });
                    setPanel(undefined);
                  }}
                />
                <Badge>
                  {available
                    ? slot.capacity - slot.reservedCount + " cupos disponibles"
                    : "Completo"}
                </Badge>
              </View>
            );
          })}
        {!slots.length && (
          <Body>No hay horarios disponibles para este tramo.</Body>
        )}
      </BottomSheet>
    </View>
  );
}
