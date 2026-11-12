import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../design-system/tokens";
import { tactile } from "../design-system/interaction";
import {
  GUAYAQUIL_BASE,
  GUAYAQUIL_SECTORS,
  MAP_MODE_STORAGE_KEY,
  OSM_TILE_URLS,
  type MapThemeMode,
} from "./routeMapShared";

export interface PinMapSelectorProps {
  coordinate: { latitude: number; longitude: number };
  onChangeCoordinate: (coord: { latitude: number; longitude: number }) => void;
  height?: number;
}

export default function PinMapSelector({
  coordinate,
  onChangeCoordinate,
  height = 280,
}: PinMapSelectorProps) {
  const [mode, setMode] = useState<MapThemeMode>("tactical");
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const validCoord = {
    latitude:
      Number.isFinite(coordinate.latitude) && coordinate.latitude !== 0
        ? coordinate.latitude
        : GUAYAQUIL_BASE.latitude,
    longitude:
      Number.isFinite(coordinate.longitude) && coordinate.longitude !== 0
        ? coordinate.longitude
        : GUAYAQUIL_BASE.longitude,
  };

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(MAP_MODE_STORAGE_KEY)
      .then((saved) => {
        if (mounted && (saved === "tactical" || saved === "light")) {
          setMode(saved);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const toggleMode = () => {
    tactile("selection");
    const next: MapThemeMode = mode === "tactical" ? "light" : "tactical";
    setMode(next);
    void AsyncStorage.setItem(MAP_MODE_STORAGE_KEY, next).catch(() => {});
  };

  const handleSelectCoordinate = (coord: {
    latitude: number;
    longitude: number;
  }) => {
    tactile("selection");
    onChangeCoordinate({
      latitude: Number(coord.latitude.toFixed(6)),
      longitude: Number(coord.longitude.toFixed(6)),
    });
  };

  const handleSectorSelect = (sector: (typeof GUAYAQUIL_SECTORS)[number]) => {
    handleSelectCoordinate({
      latitude: sector.latitude,
      longitude: sector.longitude,
    });
    mapRef.current?.animateToRegion(
      {
        latitude: sector.latitude,
        longitude: sector.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      400,
    );
  };

  const isTactical = mode === "tactical";

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
  });
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.65, 0.25, 0],
  });

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          {
            height,
            borderColor: isTactical ? "#1E293B" : theme.colors.border,
            backgroundColor: isTactical ? "#0B1320" : "#E2E8F0",
          },
        ]}
      >
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          mapType="none"
          initialRegion={{
            latitude: validCoord.latitude,
            longitude: validCoord.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          onPress={(e) => handleSelectCoordinate(e.nativeEvent.coordinate)}
          accessibilityLabel="Mapa táctico de selección de domicilio en Guayaquil"
        >
          <UrlTile
            key={mode}
            urlTemplate={OSM_TILE_URLS[mode]}
            maximumZ={19}
            flipY={false}
          />
          <Marker
            coordinate={validCoord}
            draggable
            onDragEnd={(e) => handleSelectCoordinate(e.nativeEvent.coordinate)}
            title="Punto de entrega"
            description="Toca o arrastra para mover el marcador"
            anchor={{ x: 0.5, y: 0.85 }}
          >
            <View style={styles.markerContainer}>
              <Animated.View
                style={[
                  styles.markerHalo,
                  {
                    backgroundColor: isTactical ? "#38BDF8" : "#2563EB",
                    opacity: pulseOpacity,
                    transform: [{ scale: pulseScale }],
                  },
                ]}
              />
              <View
                style={[
                  styles.markerPin,
                  {
                    backgroundColor: isTactical ? "#0284C7" : theme.colors.primary,
                  },
                ]}
              >
                <Ionicons name="location" size={18} color="#FFFFFF" />
              </View>
              <View style={styles.markerTip} />
            </View>
          </Marker>
        </MapView>

        {/* Top Controls Overlay */}
        <View style={styles.topOverlay} pointerEvents="box-none">
          <View
            style={[
              styles.coordBadge,
              isTactical ? styles.overlayDark : styles.overlayLight,
            ]}
          >
            <Ionicons
              name="navigate"
              size={13}
              color={isTactical ? "#38BDF8" : theme.colors.primary}
            />
            <Text
              style={[
                styles.coordBadgeText,
                { color: isTactical ? "#F1F5F9" : "#0F172A" },
              ]}
            >
              {validCoord.latitude.toFixed(4)}, {validCoord.longitude.toFixed(4)}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isTactical ? "Cambiar a modo claro" : "Cambiar a modo táctico"
            }
            onPress={toggleMode}
            style={({ pressed }) => [
              styles.modePill,
              isTactical ? styles.overlayDark : styles.overlayLight,
              {
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              },
            ]}
          >
            <Ionicons
              name={isTactical ? "sunny-outline" : "moon-outline"}
              size={14}
              color={isTactical ? "#FACC15" : "#1E293B"}
            />
            <Text
              style={[
                styles.modePillText,
                { color: isTactical ? "#F8FAFC" : "#0F172A" },
              ]}
            >
              {isTactical ? "Claro" : "Táctico"}
            </Text>
          </Pressable>
        </View>

        {/* Bottom Instruction Bar */}
        <View style={styles.bottomInstruction} pointerEvents="none">
          <View
            style={[
              styles.instructionBadge,
              isTactical ? styles.overlayDark : styles.overlayLight,
            ]}
          >
            <Ionicons
              name="finger-print-outline"
              size={12}
              color={isTactical ? "#94A3B8" : "#64748B"}
            />
            <Text
              style={[
                styles.instructionText,
                { color: isTactical ? "#CBD5E1" : "#475569" },
              ]}
            >
              Toca o arrastra para fijar la ubicación exacta
            </Text>
          </View>
        </View>
      </View>

      {/* Guayaquil Fast Sector Quick Pickers */}
      <View style={styles.sectorBar}>
        <Text
          style={[
            styles.sectorHeader,
            { color: isTactical ? "#94A3B8" : theme.colors.muted },
          ]}
        >
          Sectores frecuentes en Guayaquil:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectorScroll}
        >
          {GUAYAQUIL_SECTORS.map((sector) => {
            const isSelected =
              Math.abs(validCoord.latitude - sector.latitude) < 0.005 &&
              Math.abs(validCoord.longitude - sector.longitude) < 0.005;

            return (
              <Pressable
                key={sector.name}
                accessibilityRole="button"
                accessibilityLabel={`Fijar sector en ${sector.name}`}
                onPress={() => handleSectorSelect(sector)}
                style={({ pressed }) => [
                  styles.sectorChip,
                  isSelected
                    ? styles.sectorChipActive
                    : isTactical
                      ? styles.sectorChipDark
                      : styles.sectorChipLight,
                  {
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                <Ionicons
                  name={isSelected ? "checkmark-circle" : "location-outline"}
                  size={12}
                  color={
                    isSelected
                      ? "#FFFFFF"
                      : isTactical
                        ? "#38BDF8"
                        : theme.colors.primary
                  }
                />
                <Text
                  style={[
                    styles.sectorChipText,
                    {
                      color: isSelected
                        ? "#FFFFFF"
                        : isTactical
                          ? "#E2E8F0"
                          : "#1E293B",
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {sector.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    gap: 8,
  },
  container: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },
  topOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overlayDark: {
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderColor: "#334155",
  },
  overlayLight: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderColor: "#CBD5E1",
  },
  coordBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  coordBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  bottomInstruction: {
    position: "absolute",
    bottom: 8,
    left: 10,
    right: 10,
    alignItems: "center",
  },
  instructionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  instructionText: {
    fontSize: 10,
    fontWeight: "500",
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 48,
  },
  markerHalo: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    top: 2,
  },
  markerPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#0284C7",
    marginTop: -2,
  },
  sectorBar: {
    gap: 5,
  },
  sectorHeader: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    paddingHorizontal: 2,
  },
  sectorScroll: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 2,
  },
  sectorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  sectorChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sectorChipDark: {
    backgroundColor: "#1E293B",
    borderColor: "#334155",
  },
  sectorChipLight: {
    backgroundColor: "#F1F5F9",
    borderColor: "#CBD5E1",
  },
  sectorChipText: {
    fontSize: 11,
  },
});
