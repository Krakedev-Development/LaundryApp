import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

// Coordenadas de la Sede (Matriz)
const MATRIZ = {
  latitude: -0.2295,
  longitude: -78.5243,
};

export interface Stop {
  id: string;
  label: string;
  coordinates: { latitude: number; longitude: number };
  completed?: boolean;
  hasIncident?: boolean;
}

export interface TrackingMapProps {
  onCoordinateSelected?: (coordinate: {
    latitude: number;
    longitude: number;
  }) => void;
  center?: { latitude: number; longitude: number };
  routeCoordinates?: { latitude: number; longitude: number }[];
  stops?: Stop[];
  currentPosition?: { latitude: number; longitude: number } | null;
  highlightedStopId?: string;
}

const TrackingMap: React.FC<TrackingMapProps> = ({
  stops = [],
  currentPosition = null,
  highlightedStopId,
  center = MATRIZ,
  routeCoordinates,
  onCoordinateSelected,
}) => {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!currentPosition)
      mapRef.current?.animateToRegion(
        { ...center, latitudeDelta: 0.03, longitudeDelta: 0.03 },
        500,
      );
  }, [center.latitude, center.longitude]);

  // Sigue al chofer cuando su posición cambia
  useEffect(() => {
    if (currentPosition && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...currentPosition,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        800,
      );
    }
  }, [currentPosition]);

  // Puntos para la polyline: Matriz → paradas
  const routeCoords = [center, ...stops.map((s) => s.coordinates)];

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      onPress={(e) => onCoordinateSelected?.(e.nativeEvent.coordinate)}
      initialRegion={{
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
    >
      {/* Polyline de ruta */}
      {routeCoords.length >= 2 && (
        <Polyline
          coordinates={routeCoordinates ?? routeCoords}
          strokeColor="#3B82F6"
          strokeWidth={4}
        />
      )}

      {/* Marcador Sede */}
      <Marker coordinate={center} title="Sede de servicio">
        <View style={styles.markerMatriz}>
          <Ionicons name="business-outline" size={20} color="#0F4C81" />
        </View>
      </Marker>

      {/* Marcadores de paradas */}
      {stops.map((stop) => {
        const isHighlighted = stop.id === highlightedStopId;
        return (
          <Marker
            key={stop.id}
            coordinate={stop.coordinates}
            title={`Parada ${stop.label}`}
          >
            <View
              style={[
                styles.markerStop,
                stop.completed && styles.markerCompleted,
                isHighlighted && styles.markerHighlighted,
              ]}
            >
              {stop.hasIncident ? (
                <Ionicons name="alert-circle-outline" size={20} color="#FFF" />
              ) : stop.completed ? (
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#FFF"
                />
              ) : (
                <Text style={styles.markerLabel}>{stop.label}</Text>
              )}
            </View>
          </Marker>
        );
      })}

      {/* Marcador del chofer */}
      {currentPosition && (
        <Marker coordinate={currentPosition} title="Chofer">
          <View style={styles.markerDriver}>
            <Ionicons name="car-outline" size={20} color="#FFF" />
          </View>
        </Marker>
      )}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: { flex: 1 },
  markerMatriz: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  markerStop: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerCompleted: { backgroundColor: '#10B981' },
  markerHighlighted: {
    backgroundColor: '#F59E0B',
    transform: [{ scale: 1.2 }],
  },
  markerDriver: {
    backgroundColor: '#1D4ED8',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerLabel: { color: '#fff', fontWeight: '700', fontSize: 13 },
  markerIcon: { fontSize: 18 },
});

export default TrackingMap;
