import MapView, { Marker, Polyline } from "react-native-maps";
import type { Leg } from "../domain/models";
export interface RouteMapProps {
  origin: { latitude: number; longitude: number };
  destination: Pick<Leg, "latitude" | "longitude" | "addressFull">;
}
export default function RouteMap({ origin, destination }: RouteMapProps) {
  return (
    <MapView
      style={{ height: 320, width: "100%", borderRadius: 14 }}
      initialRegion={{
        latitude: (origin.latitude + destination.latitude) / 2,
        longitude: (origin.longitude + destination.longitude) / 2,
        latitudeDelta: Math.max(
          0.015,
          Math.abs(origin.latitude - destination.latitude) * 1.7,
        ),
        longitudeDelta: Math.max(
          0.015,
          Math.abs(origin.longitude - destination.longitude) * 1.7,
        ),
      }}
      accessibilityLabel="Mapa de la ruta simulada del chofer"
    >
      <Polyline
        coordinates={[origin, destination]}
        strokeColor="#143F73"
        strokeWidth={4}
        lineDashPattern={[8, 5]}
      />
      <Marker
        coordinate={origin}
        title="Chofer · posición demo"
        pinColor="#143F73"
      />
      <Marker
        coordinate={destination}
        title="Destino"
        description={destination.addressFull}
        pinColor="#7CA024"
      />
    </MapView>
  );
}
