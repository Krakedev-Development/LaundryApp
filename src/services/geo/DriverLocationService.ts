import * as Location from "expo-location";
import type { DriverLocation } from "./geo.types";
export class DriverLocationService {
  async current(driverId: string): Promise<DriverLocation> {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted)
      throw new Error(
        "Permite el acceso a ubicación o selecciona el pin manualmente.",
      );
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      driverId,
      coordinates: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
      accuracy: position.coords.accuracy ?? undefined,
      heading: position.coords.heading ?? undefined,
      speed: position.coords.speed ?? undefined,
      updatedAt: new Date(position.timestamp).toISOString(),
    };
  }
}
