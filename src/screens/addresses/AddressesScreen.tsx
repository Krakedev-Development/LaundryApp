import { useEffect, useRef, useState } from "react";
import { orderService } from "../../services/orders/orderService";
import { reverseGeocode } from "../../services/maps/geocodingService";
import { ActivityIndicator, Text, View } from "react-native";
import { Page } from "../../components/Page";
import PinMapSelector from "../../components/PinMapSelector";
import { Accordion, ListItem } from "../../components/presentation";
import {
  BottomSheet,
  ConfirmDialog,
  FullScreenOverlay,
} from "../../components/overlay/OverlayPortal";
import {
  Body,
  Button,
  Card,
  Check,
  Empty,
  Field,
  IconButton,
  Title,
  useAction,
} from "../../components/ui";
import { useApp } from "../../store/AppProvider";
import { currentCustomer } from "../../domain/repository";
import type { Address } from "../../domain/models";
import {
  AddressSurface,
  addressStyles,
} from "../../components/AddressesPresentation";

const newAddress = (): Address => ({
  id: `addr-${Date.now()}`,
  title: "",
  fullAddress: "",
  reference: "",
  isPrimary: false,
  latitude: -2.1894,
  longitude: -79.8891,
});
export function AddressesScreen() {
  const { state, execute } = useApp();
  const c = currentCustomer(state);
  useEffect(() => {
    let active = true;
    void orderService
      .getAddresses()
      .then((addresses) => {
        if (!active || !addresses?.length) return;
        execute((repo) => repo.syncAddressesFromApi(addresses));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const a = useAction();
  const [draft, setDraft] = useState<Address | null>(null),
    [lat, setLat] = useState(""),
    [lng, setLng] = useState("");
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeReqIdRef = useRef(0);
  const [options, setOptions] = useState<Address>(),
    [remove, setRemove] = useState<Address>();

  useEffect(() => {
    return () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    };
  }, []);

  const clearPendingGeocode = () => {
    if (geocodeTimerRef.current) {
      clearTimeout(geocodeTimerRef.current);
      geocodeTimerRef.current = null;
    }
    geocodeReqIdRef.current++;
    setResolvingAddress(false);
  };

  const scheduleReverseGeocode = (latitude: number, longitude: number) => {
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    const reqId = ++geocodeReqIdRef.current;
    setResolvingAddress(true);

    geocodeTimerRef.current = setTimeout(() => {
      void reverseGeocode(latitude, longitude)
        .then((resolved) => {
          if (geocodeReqIdRef.current !== reqId || !resolved) return;
          setDraft((prev) =>
            prev ? { ...prev, fullAddress: resolved } : prev,
          );
        })
        .finally(() => {
          if (geocodeReqIdRef.current === reqId) {
            setResolvingAddress(false);
          }
        });
    }, 600);
  };

  const edit = (address: Address) => {
    clearPendingGeocode();
    setDraft({ ...address });
    setLat(String(address.latitude));
    setLng(String(address.longitude));
  };
  return (
    <Page>
      {!draft && a.feedback}
      {draft && (
        <FullScreenOverlay
          title="Dirección"
          visible={!!draft}
          onClose={() => setDraft(null)}
          footer={
            <>
              <Button
                label="Guardar dirección"
                style={addressStyles.save}
                textStyle={addressStyles.saveText}
                onPress={() => {
                  if (
                    a.run(() => {
                      if (!lat.trim() || !lng.trim())
                        throw Error("Ingresa las coordenadas.");
                      const numLat = Number(lat);
                      const numLng = Number(lng);
                      if (!Number.isFinite(numLat) || !Number.isFinite(numLng))
                        throw Error("Coordenadas inválidas.");
                      execute((r) =>
                        r.saveAddress({
                          ...draft,
                          latitude: numLat,
                          longitude: numLng,
                        }),
                      );
                      void orderService
                        .createAddress({
                          title: draft.title,
                          fullAddress: draft.fullAddress,
                          reference: draft.reference,
                          latitude: numLat,
                          longitude: numLng,
                          isPrimary: draft.isPrimary,
                        })
                        .catch(() => {});
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
          <Card style={addressStyles.form}>
            <Title style={addressStyles.formTitle}>
              {c.addresses.some((addr) => addr.id === draft.id)
                ? "Editar dirección"
                : "Nueva dirección"}
            </Title>
            <Field
              label="Nombre de dirección"
              labelStyle={addressStyles.label}
              style={addressStyles.input}
              value={draft.title}
              onChangeText={(title) => setDraft({ ...draft, title })}
            />
            <Field
              label="Dirección completa"
              labelStyle={addressStyles.label}
              style={addressStyles.input}
              value={draft.fullAddress}
              onChangeText={(fullAddress) =>
                setDraft({ ...draft, fullAddress })
              }
            />
            {resolvingAddress && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: -4,
                  marginBottom: 4,
                }}
              >
                <ActivityIndicator size="small" />
                <Body muted>Obteniendo dirección desde el pin...</Body>
              </View>
            )}
            <Field
              label="Referencia"
              labelStyle={addressStyles.label}
              style={addressStyles.input}
              value={draft.reference}
              onChangeText={(reference) => setDraft({ ...draft, reference })}
            />
            <View style={{ gap: 8, marginVertical: 6 }}>
              <Body style={addressStyles.label}>
                Ubicación en el mapa de Guayaquil
              </Body>
              <PinMapSelector
                coordinate={{
                  latitude: Number(lat) || -2.1894,
                  longitude: Number(lng) || -79.8891,
                }}
                onChangeCoordinate={(coord) => {
                  setLat(String(coord.latitude));
                  setLng(String(coord.longitude));
                  scheduleReverseGeocode(coord.latitude, coord.longitude);
                }}
              />
            </View>
            <Accordion
              title="Ajuste fino de coordenadas"
              subtitle="Latitud y longitud numéricas para orientar al chofer"
            >
              <Body muted>
                Puedes usar el mapa interactivo superior o ingresar valores numéricos directamente.
              </Body>
              <Field
                label="Latitud"
                labelStyle={addressStyles.label}
                style={addressStyles.input}
                value={lat}
                onChangeText={setLat}
                keyboardType="numbers-and-punctuation"
              />
              <Field
                label="Longitud"
                labelStyle={addressStyles.label}
                style={addressStyles.input}
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
          </Card>
        </FullScreenOverlay>
      )}
      {c.addresses.length ? (
        c.addresses.map((addr) => (
          <AddressSurface
            key={addr.id}
            title={addr.title}
            isPrimary={addr.isPrimary}
            action={
              <IconButton
                label={"Opciones de " + addr.title}
                icon="ellipsis-horizontal"
                onPress={() => setOptions(addr)}
              />
            }
          >
            <View style={addressStyles.heading}>
              <Title style={addressStyles.title}>{addr.title}</Title>
              {addr.isPrimary && (
                <Text style={addressStyles.primaryBadge}>Principal</Text>
              )}
            </View>
            <Body style={addressStyles.address}>{addr.fullAddress}</Body>
            <Body muted style={addressStyles.reference}>
              {addr.reference}
            </Body>
          </AddressSurface>
        ))
      ) : (
        <Empty text="Aún no tienes direcciones guardadas." />
      )}
      <Button
        label="Añadir dirección"
        icon="add-circle-outline"
        variant="secondary"
        style={addressStyles.add}
        textStyle={addressStyles.addText}
        onPress={() => edit(newAddress())}
      />
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
