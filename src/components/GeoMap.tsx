import React from "react";
import { Text, View } from "react-native";
import type { GeoMapProps } from "./GeoMap.types";
import { ui } from "./ui";
export function GeoMap({ label, onPick }: GeoMapProps) {
  return (
    <View>
      <Text style={ui.meta}>
        {label} · El mapa nativo está disponible en Android e iOS.{" "}
        {onPick
          ? "Puedes usar tu ubicación o elegir una dirección de demostración."
          : "Consulta la dirección y abre navegación externa."}
      </Text>
    </View>
  );
}
