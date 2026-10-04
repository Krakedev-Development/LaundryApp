import React from "react";
import { Text, View } from "react-native";
import { GeoMap } from "./GeoMap";
import { useGeoRoute } from "../hooks/useGeoRoute";
import { useApp } from "../store/AppStore";
import type { Coordinates } from "../domain/models";
import { ui } from "./ui";
export function RouteMap({
  origin,
  destination,
  label,
  height = 280,
  stage = "",
}: {
  origin: Coordinates;
  destination: Coordinates;
  label: string;
  height?: number;
  stage?: string;
}) {
  const { online } = useApp();
  const { route, loading, error } = useGeoRoute(
    origin,
    destination,
    stage,
    online,
  );
  return (
    <View>
      <GeoMap
        origin={origin}
        destination={destination}
        label={label}
        route={route}
        height={height}
      />
      {loading && (
        <Text accessibilityLiveRegion="polite" style={ui.meta}>
          Calculando ruta…
        </Text>
      )}
      {!online && (
        <Text style={ui.meta}>
          Sin conexión · Última ruta disponible. Las ubicaciones no se están
          sincronizando.
        </Text>
      )}
      {!!error && <Text style={ui.meta}>{error}</Text>}
      {!!route && (
        <Text style={ui.meta}>
          {(route.distanceMeters / 1000).toFixed(1)} km ·{" "}
          {Math.ceil(route.durationSeconds / 60)} min{" "}
          {route.simulated ? "de demostración" : "estimados por carretera"}
        </Text>
      )}
    </View>
  );
}
