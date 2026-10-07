import TrackingMap from './TrackingMap';
import type { MapViewCustomProps } from './MapViewCustom';
export default function MapViewCustom({
  center,
  stops = [],
  drivers = [],
  routeWaypoints = [],
}: MapViewCustomProps) {
  return (
    <TrackingMap
      center={center}
      stops={stops.map((s) => ({
        id: s.id,
        label: s.label,
        coordinates: { latitude: s.latitude, longitude: s.longitude },
      }))}
      currentPosition={
        drivers[0]
          ? { latitude: drivers[0].latitude, longitude: drivers[0].longitude }
          : undefined
      }
      routeCoordinates={routeWaypoints}
    />
  );
}
