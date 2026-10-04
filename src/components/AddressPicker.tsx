import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import type { Coordinates } from "../domain/models";
import { GeoMap } from "./GeoMap";
import { geoProvider } from "../services/geo";
import { geoConfig } from "../services/geo/geo.config";
import { ui } from "./ui";
export function AddressPinMap({
  coordinates,
  onPick,
  onAddress,
}: {
  coordinates: Coordinates;
  onPick: (position: Coordinates) => void;
  onAddress?: (address: string) => void;
}) {
  const [edited, setEdited] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (!edited || !geoConfig.permanentGeocoding) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      geoProvider
        .reverseGeocode(coordinates, {
          permanent: true,
          signal: controller.signal,
        })
        .then((address) => {
          if (!controller.signal.aborted && address)
            onAddress?.(address.formattedAddress);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError(e.message);
        });
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [coordinates.lat, coordinates.lng, edited]);
  return (
    <View>
      <GeoMap
        destination={coordinates}
        label="Tu dirección"
        onPick={(position) => {
          setEdited(true);
          setError("");
          onPick(position);
        }}
      />
      {!!error && <Text style={ui.meta}>{error}</Text>}
    </View>
  );
}
