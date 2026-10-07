import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import {
  currentActor,
  useBusinessStore,
  saveCustomerAddresses,
  flushBusiness,
} from '../../store/useBusinessStore';
import { geoProvider } from '../../services/geo';
import TrackingMap from '../map/TrackingMap';
import type { Address } from '../../domain/models';
import { Screen, Card, Action, ui } from './ui';
export function CustomerAddresses() {
  const state = useBusinessStore((s) => s.state)!,
    customer = state.customers.find((c) => c.id === currentActor().id)!;
  const [query, setQuery] = useState(''),
    [label, setLabel] = useState('Casa'),
    [selected, setSelected] = useState<Address>(),
    [editing, setEditing] = useState<number>(),
    [results, setResults] = useState<
      {
        id: string;
        address: string;
        coordinates: { lat: number; lng: number };
      }[]
    >([]),
    [error, setError] = useState('');
  const run = async (work: () => void) => {
    setError('');
    try {
      work();
      await flushBusiness();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.');
    }
  };
  const search = async () => {
    try {
      const value = await geoProvider.searchAddress(query);
      setResults(
        value.map((p, index) => ({
          id: p.id ?? String(index),
          address: p.formattedAddress,
          coordinates: p.coordinates,
        })),
      );
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo buscar.');
    }
  };
  const center =
    selected?.coordinates ??
    customer.addresses[0]?.coordinates ??
    state.facilities[0].coordinates;
  return (
    <Screen title="Mis direcciones">
      {error && <Text style={ui.error}>{error}</Text>}
      {customer.addresses.map((address, index) => (
        <Card key={index}>
          <Text style={ui.subtitle}>
            {address.label ?? `Dirección ${index + 1}`}
            {index === 0 ? ' · Principal' : ''}
          </Text>
          <Text style={ui.text}>{address.street}</Text>
          <Action
            label="Editar ubicación"
            onPress={() => {
              setSelected(address);
              setEditing(index);
              setLabel(address.label ?? 'Casa');
              setQuery(address.street);
            }}
          />
          <Action
            label="Usar como principal"
            disabled={index === 0}
            onPress={() =>
              void run(() =>
                saveCustomerAddresses([
                  address,
                  ...customer.addresses.filter((_, i) => i !== index),
                ]),
              )
            }
          />
          <Action
            label="Eliminar dirección"
            onPress={() =>
              void run(() =>
                saveCustomerAddresses(
                  customer.addresses.filter((_, i) => i !== index),
                ),
              )
            }
          />
        </Card>
      ))}
      <Card>
        <Text style={ui.subtitle}>
          {editing === undefined ? 'Agregar dirección' : 'Editar dirección'}
        </Text>
        <TextInput
          style={ui.input}
          value={label}
          onChangeText={setLabel}
          placeholder="Nombre: Casa, Trabajo…"
        />
        <TextInput
          style={ui.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Busca una dirección"
        />
        <Action label="Buscar en mapa" onPress={() => void search()} />
        {results.map((result) => (
          <Action
            key={result.id}
            label={result.address}
            onPress={() => {
              setSelected({
                street: result.address,
                number: '',
                neighborhood: '',
                city: '',
                coordinates: result.coordinates,
              });
              setQuery(result.address);
            }}
          />
        ))}
        <View style={{ height: 240, borderRadius: 14, overflow: 'hidden' }}>
          <TrackingMap
            center={{ latitude: center.lat, longitude: center.lng }}
            stops={
              selected
                ? [
                    {
                      id: 'SELECTED',
                      label: 'Dirección seleccionada',
                      coordinates: {
                        latitude: center.lat,
                        longitude: center.lng,
                      },
                    },
                  ]
                : []
            }
            onCoordinateSelected={(point) => {
              setSelected({
                street: query.trim() || 'Ubicación seleccionada',
                number: '',
                city: '',
                neighborhood: '',
                coordinates: { lat: point.latitude, lng: point.longitude },
              });
            }}
          />
        </View>
        <Text style={ui.muted}>
          Selecciona el resultado de búsqueda o toca el mapa. La cobertura se
          comprueba al solicitar el servicio.
        </Text>
        {selected && (
          <Text style={ui.text}>
            {selected.street} · {selected.coordinates.lat.toFixed(5)},{' '}
            {selected.coordinates.lng.toFixed(5)}
          </Text>
        )}
        <Action
          label="Guardar dirección"
          disabled={!selected || !label.trim()}
          onPress={() =>
            void run(() => {
              const address = { ...selected!, label: label.trim() };
              const addresses = [...customer.addresses];
              if (editing === undefined) addresses.push(address);
              else addresses[editing] = address;
              saveCustomerAddresses(addresses);
              setSelected(undefined);
              setEditing(undefined);
              setQuery('');
            })
          }
        />
        {editing !== undefined && (
          <Action
            label="Cancelar edición"
            onPress={() => {
              setSelected(undefined);
              setEditing(undefined);
              setQuery('');
            }}
          />
        )}
      </Card>
    </Screen>
  );
}
