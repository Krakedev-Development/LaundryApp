import React from "react";
import { Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Coordinates } from "../domain/models";
import { ui } from "./ui";
import { nativeMapsEnabled } from "../services/maps";
import { AddressPinMap as Schematic } from "./AddressPinSchematic";
export function AddressPinMap({
  coordinates,
  onPick,
}: {
  coordinates: Coordinates;
  onPick: (position: Coordinates) => void;
}) {
  if (!nativeMapsEnabled())
    return <Schematic coordinates={coordinates} onPick={onPick} />;
  const toModel = (position: { latitude: number; longitude: number }) =>
    onPick({ lat: position.latitude, lng: position.longitude });
  return (
    <View>
      <MapView
        style={{ height: 280, borderRadius: 14 }}
        region={{
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        onPress={(e) => toModel(e.nativeEvent.coordinate)}
      >
        <Marker
          coordinate={{ latitude: coordinates.lat, longitude: coordinates.lng }}
          title="Tu dirección"
          draggable
          onDragEnd={(e) => toModel(e.nativeEvent.coordinate)}
        />
      </MapView>
      <Text style={ui.meta}>
        Toca el mapa o arrastra el pin hasta tu ubicación.
      </Text>
    </View>
  );
}
