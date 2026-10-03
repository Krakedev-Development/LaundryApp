import React from "react";
import { Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Coordinates } from "../domain/models";
import { Colors } from "../theme/colors";
import { ui } from "./ui";
import { nativeMapsEnabled } from "../services/maps";
import { RouteSchematic } from "./RouteSchematic";
export function RouteMap({
  origin,
  destination,
  label,
  height = 280,
}: {
  origin: Coordinates;
  destination: Coordinates;
  label: string;
  height?: number;
}) {
  if (!nativeMapsEnabled())
    return (
      <RouteSchematic
        origin={origin}
        destination={destination}
        label={label}
        height={height}
      />
    );
  const from = { latitude: origin.lat, longitude: origin.lng };
  const to = { latitude: destination.lat, longitude: destination.lng };
  return (
    <View>
      <MapView
        style={{ height, borderRadius: 14 }}
        region={{
          latitude: (origin.lat + destination.lat) / 2,
          longitude: (origin.lng + destination.lng) / 2,
          latitudeDelta: Math.max(
            0.01,
            Math.abs(origin.lat - destination.lat) * 1.6,
          ),
          longitudeDelta: Math.max(
            0.01,
            Math.abs(origin.lng - destination.lng) * 1.6,
          ),
        }}
      >
        <Marker
          coordinate={from}
          title="Chofer · Ubicación simulada"
          pinColor={Colors.primary}
        />
        <Marker coordinate={to} title={label} pinColor={Colors.limeDark} />
        <Polyline
          coordinates={[
            from,
            { latitude: origin.lat, longitude: destination.lng },
            to,
          ]}
          strokeWidth={4}
          strokeColor={Colors.primary}
          lineDashPattern={[8, 6]}
        />
      </MapView>
      <Text style={ui.meta}>Ruta simulada · {label}</Text>
    </View>
  );
}
