import { useState } from "react";
import { Text, View } from "react-native";
import { Page } from "../../components/Page";
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
            <Field
              label="Referencia"
              labelStyle={addressStyles.label}
              style={addressStyles.input}
              value={draft.reference}
              onChangeText={(reference) => setDraft({ ...draft, reference })}
            />
            <Accordion
              title="Ubicación para la entrega"
              subtitle="Coordenadas usadas para orientar al chofer"
            >
              <Body muted>
                Este MVP no convierte la dirección a coordenadas
                automáticamente. Verifica el punto del domicilio.
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
