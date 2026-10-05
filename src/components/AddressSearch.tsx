import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Field, Button, ui } from "./ui";
import { geoProvider } from "../services/geo";
import { geoConfig } from "../services/geo/geo.config";
import { DEMO_ADDRESSES } from "../services/geo/demo";
import type { GeoAddress } from "../services/geo/geo.types";
export function AddressSearch({
  onSelect,
}: {
  onSelect: (address: GeoAddress) => void;
}) {
  const [query, setQuery] = useState(""),
    [results, setResults] = useState<GeoAddress[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setResults([]);
    setError("");
    setLoading(false);
    if (query.trim().length < 3) return () => controller.abort();
    const timer = setTimeout(() => {
      setLoading(true);
      geoProvider
        .searchAddress(query, {
          permanent: true,
          proximity: geoConfig.center,
          signal: controller.signal,
        })
        .then((value) => {
          if (!controller.signal.aborted) setResults(value);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  return (
    <View>
      <Field
        label="Buscar dirección"
        value={query}
        onChangeText={setQuery}
        placeholder="Escribe una dirección en Samborondón"
      />
      {loading && <Text style={ui.meta}>Buscando direcciones…</Text>}
      {!!error && <Text style={ui.meta}>{error}</Text>}
      {results.map((address, i) => (
        <Button
          key={address.providerPlaceId ?? address.id ?? i}
          title={address.formattedAddress}
          variant="secondary"
          onPress={() => {
            onSelect(address);
            setQuery("");
          }}
        />
      ))}
      {!loading && !error && query.length >= 3 && !results.length && (
        <Text style={ui.meta}>
          Sin resultados. Ingresa la dirección y confirma el pin.
        </Text>
      )}
      <Text style={ui.meta}>Direcciones preparadas para la demostración</Text>
      {DEMO_ADDRESSES.filter((a) => a.id?.startsWith("demo-home")).map(
        (address) => (
          <Button
            key={address.id}
            title={address.formattedAddress}
            variant="secondary"
            onPress={() => {
              onSelect(address);
              setQuery("");
            }}
          />
        ),
      )}
    </View>
  );
}
