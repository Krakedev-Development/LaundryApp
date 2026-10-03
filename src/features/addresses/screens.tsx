import React, { useState } from "react";
import { Linking, Text, View } from "react-native";
import * as Location from "expo-location";
import { Address } from "../../domain/models";
import { validCoordinates } from "../../domain/rules";
import {
  AppHeader,
  Badge,
  BottomSheet,
  Button,
  Card,
  ConfirmationSheet,
  ErrorState,
  Field,
  Page,
  ui,
} from "../../components/ui";
import { AddressPinMap } from "../../components/AddressPinMap";
import { useApp } from "../../store/AppStore";
import { useAction } from "../../hooks/useAction";

export function AddressEditor({
  visible,
  onClose,
  address,
}: {
  visible: boolean;
  onClose: () => void;
  address?: Address;
}) {
  const { session, engine, data } = useApp();
  const a = useAction();
  const c = engine.customer(session!);
  const [title, setTitle] = useState(address?.title ?? "");
  const [full, setFull] = useState(address?.fullAddress ?? "");
  const [reference, setReference] = useState(address?.reference ?? "");
  const [lat, setLat] = useState(
    address ? String(address.coordinates.lat) : "",
  );
  const [lng, setLng] = useState(
    address ? String(address.coordinates.lng) : "",
  );
  const [search, setSearch] = useState("");
  const coordinates = { lat: Number(lat), lng: Number(lng) };
  const places = data.facilities.filter(
    (f) =>
      search.length > 1 &&
      `${f.address} ${f.name}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <BottomSheet
      visible={visible}
      title={address ? "Editar dirección" : "Nueva dirección"}
      onClose={onClose}
    >
      <Field
        label="Buscar ubicación de referencia"
        value={search}
        onChangeText={setSearch}
        placeholder="Miraflores, San Isidro o Industrial"
      />
      {places.map((p) => (
        <Button
          key={p.id}
          title={p.address}
          variant="secondary"
          onPress={() => {
            setFull(p.address);
            setLat(String(p.coordinates.lat));
            setLng(String(p.coordinates.lng));
            setSearch("");
          }}
        />
      ))}
      <Button
        title="Usar ubicación actual"
        icon="locate-outline"
        variant="secondary"
        busy={a.busy}
        onPress={() =>
          a.run(async () => {
            const permission =
              await Location.requestForegroundPermissionsAsync();
            if (!permission.granted)
              throw new Error(
                "No tenemos permiso de ubicación. Habilítalo en configuración o selecciona una referencia.",
              );
            const position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            setLat(String(position.coords.latitude));
            setLng(String(position.coords.longitude));
          })
        }
      />
      {!!validCoordinates(coordinates) && (
        <AddressPinMap
          coordinates={coordinates}
          onPick={(position) => {
            setLat(String(position.lat));
            setLng(String(position.lng));
          }}
        />
      )}
      <Field
        label="Nombre de dirección"
        value={title}
        onChangeText={setTitle}
        placeholder="Casa, trabajo, departamento"
      />
      <Field
        label="Dirección completa"
        value={full}
        onChangeText={setFull}
        placeholder="Calle, número, departamento y ciudad"
      />
      <Field
        label="Referencia / indicaciones"
        value={reference}
        onChangeText={setReference}
        multiline
      />
      <Text style={ui.meta}>
        Las búsquedas de esta demo incluyen ubicaciones de referencia del
        catálogo local. Verifica el pin y la dirección antes de guardar.
      </Text>
      {!!a.error && <ErrorState text={a.error} />}
      <Button
        title="Guardar dirección"
        busy={a.busy}
        onPress={() =>
          a.run(() => {
            if (
              !title.trim() ||
              full.trim().length < 8 ||
              !validCoordinates(coordinates)
            )
              throw new Error(
                "Completa nombre, dirección y coordenadas válidas.",
              );
            engine.update((d) => {
              const customer = d.customers.find((v) => v.id === c.id)!;
              const saved: Address = {
                id: address?.id ?? engine.id(d, "address"),
                title: title.trim(),
                fullAddress: full.trim(),
                reference: reference.trim(),
                coordinates,
                isPrimary:
                  address?.isPrimary ?? customer.addresses.length === 0,
              };
              customer.addresses = [
                ...customer.addresses.filter((v) => v.id !== saved.id),
                saved,
              ];
            });
            onClose();
          }, "Dirección guardada")
        }
      />
    </BottomSheet>
  );
}
export function AddressesScreen() {
  const { session, engine } = useApp();
  const c = engine.customer(session!);
  const a = useAction();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);
  return (
    <Page>
      <AppHeader title="Tus direcciones" icon="location-outline" />
      {c.addresses.map((addr) => (
        <Card key={addr.id}>
          <View style={ui.between}>
            <Text style={ui.section}>{addr.title}</Text>
            {!!addr.isPrimary && <Badge title="Principal" />}
          </View>
          <Text style={ui.body}>{addr.fullAddress}</Text>
          <Text style={ui.muted}>{addr.reference}</Text>
          <View style={ui.wrap}>
            <Button
              title="Editar"
              variant="secondary"
              onPress={() => setEditing(addr)}
            />
            {!addr.isPrimary && (
              <Button
                title="Principal"
                variant="secondary"
                onPress={() =>
                  a.run(
                    () =>
                      engine.update((d) => {
                        d.customers
                          .find((v) => v.id === c.id)!
                          .addresses.forEach((v) => {
                            v.isPrimary = v.id === addr.id;
                          });
                      }),
                    "Dirección principal actualizada",
                  )
                }
              />
            )}
            <Button
              title="Eliminar"
              variant="secondary"
              onPress={() => setDeleting(addr)}
            />
          </View>
        </Card>
      ))}
      {!c.addresses.length && (
        <Text style={ui.muted}>
          Guarda tu primera dirección para programar una recogida.
        </Text>
      )}
      <Button
        title="Agregar dirección"
        icon="add"
        onPress={() => setEditing("new")}
      />
      {!!editing && (
        <AddressEditor
          key={typeof editing === "string" ? "new" : editing.id}
          visible
          onClose={() => setEditing(null)}
          address={typeof editing === "string" ? undefined : editing}
        />
      )}
      <ConfirmationSheet
        visible={!!deleting}
        title="Eliminar dirección"
        text="La dirección guardada se eliminará. Los pedidos anteriores conservarán su dirección original."
        danger
        onClose={() => setDeleting(null)}
        confirm={() =>
          a.run(() => {
            engine.update((d) => {
              const customer = d.customers.find((v) => v.id === c.id)!;
              customer.addresses = customer.addresses.filter(
                (v) => v.id !== deleting?.id,
              );
              if (
                customer.addresses.length &&
                !customer.addresses.some((v) => v.isPrimary)
              )
                customer.addresses[0].isPrimary = true;
            });
            setDeleting(null);
          }, "Dirección eliminada")
        }
      />
      {!!a.error && <ErrorState text={a.error} />}
    </Page>
  );
}
