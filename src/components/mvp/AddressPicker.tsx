import { useState } from 'react';
import { Text, TextInput, View, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { geoProvider, geoIsDemo } from '../../services/geo';
import type { GeoAddress } from '../../services/geo/geo.types';
import { useOrderStore } from '../../store/useOrderStore';
import { useBusinessStore } from '../../store/useBusinessStore';
import TrackingMap from '../map/TrackingMap';
import { Screen, Card, Action, ui } from './ui';
export function AddressPicker() {
  const { leg = 'inbound' } = useLocalSearchParams<{ leg: string }>(),
    draft = useOrderStore(),
    router = useRouter(),
    state = useBusinessStore((s) => s.state)!;
  const f =
    state.facilities.find((f) => f.id === draft.facilityId) ??
    state.facilities[0];
  const [query, setQuery] = useState(''),
    [results, setResults] = useState<GeoAddress[]>([]),
    [selected, setSelected] = useState<GeoAddress>(),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const search = async () => {
    setBusy(true);
    setError('');
    try {
      setResults(await geoProvider.searchAddress(query));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo buscar.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen title="Seleccionar dirección">
      <Text style={ui.muted}>
        {geoIsDemo
          ? 'Direcciones de demostración de Samborondón.'
          : 'Busca una dirección o selecciona un punto en el mapa.'}
      </Text>
      <Card>
        <TextInput
          accessibilityLabel="Buscar dirección"
          style={ui.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Dirección o lugar"
        />
        <Action
          label={busy ? 'Buscando…' : 'Buscar'}
          disabled={busy}
          onPress={() => void search()}
        />
        {results.map((a, i) => (
          <TouchableOpacity
            key={a.id ?? i}
            style={[ui.outline, a === selected && ui.selected]}
            onPress={() => {
              setSelected(a);
              setQuery(a.formattedAddress);
            }}
          >
            <Text style={ui.text}>{a.formattedAddress}</Text>
          </TouchableOpacity>
        ))}
      </Card>
      <View style={{ height: 320, overflow: 'hidden', borderRadius: 18 }}>
        <TrackingMap
          center={{
            latitude: selected?.coordinates.lat ?? f.coordinates.lat,
            longitude: selected?.coordinates.lng ?? f.coordinates.lng,
          }}
          stops={
            selected
              ? [
                  {
                    id: 'selection',
                    label: 'Dirección',
                    coordinates: {
                      latitude: selected.coordinates.lat,
                      longitude: selected.coordinates.lng,
                    },
                  },
                ]
              : []
          }
          onCoordinateSelected={(p) => {
            setSelected({
              formattedAddress: query || 'Ubicación seleccionada',
              coordinates: { lat: p.latitude, lng: p.longitude },
              persistence: 'user',
            });
          }}
        />
      </View>
      {selected && (
        <Card>
          <Text style={ui.text}>{selected.formattedAddress}</Text>
          <Text style={ui.muted}>
            {selected.coordinates.lat}, {selected.coordinates.lng}
          </Text>
          <Action
            label="Usar esta dirección"
            onPress={() => {
              if (!query.trim()) {
                setError(
                  'Escribe la dirección para identificar el punto seleccionado.',
                );
                return;
              }
              const coords = {
                latitude: selected.coordinates.lat,
                longitude: selected.coordinates.lng,
              };
              draft.setBusinessDraft(
                leg === 'inbound'
                  ? { pickupAddress: query, pickupCoords: coords }
                  : { deliveryAddress: query, deliveryCoords: coords },
              );
              router.back();
            }}
          />
        </Card>
      )}
      {error && <Text style={ui.error}>{error}</Text>}
    </Screen>
  );
}
