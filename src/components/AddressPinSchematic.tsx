import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Coordinates } from "../domain/models";
import { RouteSchematic as RouteMap } from "./RouteSchematic";
import { ui } from "./ui";
export function AddressPinMap({
  coordinates,
  onPick,
}: {
  coordinates: Coordinates;
  onPick: (position: Coordinates) => void;
}) {
  const [width, setWidth] = useState(360);
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Toca el mapa para ajustar el pin de la dirección"
        onPress={(e) => {
          onPick({
            lat:
              coordinates.lat + ((140 - e.nativeEvent.locationY) / 280) * 0.02,
            lng:
              coordinates.lng + (e.nativeEvent.locationX / width - 0.5) * 0.02,
          });
        }}
      >
        <RouteMap
          origin={coordinates}
          destination={coordinates}
          label="Tu dirección"
          height={280}
        />
      </Pressable>
      <Text style={ui.meta}>
        Toca el mapa para ajustar el pin. Verifica también la dirección escrita.
      </Text>
    </View>
  );
}
