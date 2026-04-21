import React, { useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { Coordinates, DriverLocation } from '../../types';

// Token público — reemplaza con el tuyo de mapbox.com
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '');

// Coordenadas fijas de la sede (Matriz)
const MATRIZ_COORDINATES: Coordinates = {
  latitude: -0.2295,   // Cambia por tu ubicación real
  longitude: -78.5243,
};

interface TrackingMapProps {
  /** Ubicaciones en tiempo real de los choferes asignados */
  drivers?: DriverLocation[];
  /** Zoom inicial del mapa */
  zoomLevel?: number;
}

const TrackingMap: React.FC<TrackingMapProps> = ({
  drivers = [],
  zoomLevel = 13,
}) => {
  const cameraRef = useRef<MapboxGL.Camera>(null);

  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map} logoEnabled={false}>

        {/* Cámara centrada en la Matriz por defecto */}
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={zoomLevel}
          centerCoordinate={[
            MATRIZ_COORDINATES.longitude,
            MATRIZ_COORDINATES.latitude,
          ]}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* Marcador estático: Sede / Matriz */}
        <MapboxGL.PointAnnotation
          id="matriz"
          coordinate={[MATRIZ_COORDINATES.longitude, MATRIZ_COORDINATES.latitude]}
        >
          <View style={styles.markerMatriz}>
            <Text style={styles.markerText}>🏠</Text>
          </View>
          <MapboxGL.Callout title="Sede Principal" />
        </MapboxGL.PointAnnotation>

        {/* Marcadores dinámicos: Choferes */}
        {drivers.map((driver) => (
          <MapboxGL.PointAnnotation
            key={driver.driverId}
            id={`driver-${driver.driverId}`}
            coordinate={[
              driver.coordinates.longitude,
              driver.coordinates.latitude,
            ]}
          >
            <View style={styles.markerDriver}>
              <Text style={styles.markerText}>🚗</Text>
            </View>
            <MapboxGL.Callout title={`Chofer #${driver.driverId}`} />
          </MapboxGL.PointAnnotation>
        ))}

      </MapboxGL.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerMatriz: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDriver: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: {
    fontSize: 20,
  },
});

export default TrackingMap;
