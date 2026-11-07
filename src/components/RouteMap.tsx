import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { Marker, Polyline, UrlTile } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../design-system/tokens";
import { tactile } from "../design-system/interaction";
import type { Leg } from "../domain/models";

export const GUAYAQUIL_BASE = {
  latitude: -2.1894,
  longitude: -79.8891,
} as const;

export const MAP_MODE_STORAGE_KEY = "laundry.map-theme-mode.v1";

export const OSM_TILE_URLS = {
  tactical: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  light: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
} as const;

export type MapThemeMode = keyof typeof OSM_TILE_URLS;

/** Normalizes legacy demo coordinates around Guayaquil base (-2.1894, -79.8891). */
export function normalizeGuayaquilCoords(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
) {
  const isLegacyOrigin = origin.latitude < -8 || origin.latitude === 0;
  const isLegacyDest = destination.latitude < -8 || destination.latitude === 0;

  if (!isLegacyOrigin && !isLegacyDest) {
    return { origin, destination };
  }

  const dLat =
    isLegacyOrigin && isLegacyDest
      ? Math.max(-0.025, Math.min(0.025, origin.latitude - destination.latitude))
      : 0.008;
  const dLng =
    isLegacyOrigin && isLegacyDest
      ? Math.max(
          -0.025,
          Math.min(0.025, origin.longitude - destination.longitude),
        )
      : -0.009;

  const normDest = isLegacyDest
    ? {
        latitude: GUAYAQUIL_BASE.latitude - 0.0032,
        longitude: GUAYAQUIL_BASE.longitude + 0.0038,
      }
    : destination;

  const normOrigin = isLegacyOrigin
    ? {
        latitude: normDest.latitude + (dLat || 0.0064),
        longitude: normDest.longitude + (dLng || -0.0076),
      }
    : origin;

  return { origin: normOrigin, destination: normDest };
}

export interface RouteMapProps {
  height?: number;
  origin: { latitude: number; longitude: number };
  destination: Pick<Leg, "latitude" | "longitude" | "addressFull">;
}

export default function RouteMap({
  origin,
  destination,
  height = theme.layout.map,
}: RouteMapProps) {
  const [mode, setMode] = useState<MapThemeMode>("tactical");
  const pulseAnim = useRef(new Animated.Value(0)).current;

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

  const normalized = normalizeGuayaquilCoords(origin, destination);
  const isTactical = mode === "tactical";

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.35],
  });
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.65, 0.25, 0],
  });

  return (
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
        style={StyleSheet.absoluteFill}
        mapType="none"
        initialRegion={{
          latitude: GUAYAQUIL_BASE.latitude,
          longitude: GUAYAQUIL_BASE.longitude,
          latitudeDelta: Math.max(
            0.018,
            Math.abs(
              normalized.origin.latitude - normalized.destination.latitude,
            ) * 2.2,
          ),
          longitudeDelta: Math.max(
            0.018,
            Math.abs(
              normalized.origin.longitude - normalized.destination.longitude,
            ) * 2.2,
          ),
        }}
        accessibilityLabel="Mapa de la ruta simulada del chofer"
      >
        <UrlTile
          key={mode}
          urlTemplate={OSM_TILE_URLS[mode]}
          maximumZ={19}
          flipY={false}
        />
        <Polyline
          coordinates={[normalized.origin, normalized.destination]}
          strokeColor={isTactical ? "#38BDF8" : theme.colors.primary}
          strokeWidth={4}
          lineDashPattern={[8, 6]}
        />
        <Marker
          coordinate={normalized.origin}
          title="Chofer · En camino"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.driverMarkerWrap}>
            <View
              style={[
                styles.statusBadge,
                isTactical ? styles.statusBadgeDark : styles.statusBadgeLight,
              ]}
            >
              <View style={styles.liveDot} />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isTactical ? "#F8FAFC" : "#0F172A" },
                ]}
              >
                En camino
              </Text>
            </View>
            <View style={styles.radarCenter}>
              <Animated.View
                style={[
                  styles.radarHalo,
                  {
                    backgroundColor: isTactical ? "#38BDF8" : "#2563EB",
                    opacity: pulseOpacity,
                    transform: [{ scale: pulseScale }],
                  },
                ]}
              />
              <View
                style={[
                  styles.driverCore,
                  {
                    backgroundColor: isTactical
                      ? "#0284C7"
                      : theme.colors.primary,
                  },
                ]}
              >
                <Ionicons name="car-sport" size={16} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </Marker>
        <Marker
          coordinate={normalized.destination}
          title="Destino"
          description={destination.addressFull}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.destMarkerWrap}>
            <View style={styles.destRing}>
              <View style={styles.destCore}>
                <Ionicons name="location" size={15} color="#0F172A" />
              </View>
            </View>
            <View
              style={[
                styles.destLabelBox,
                isTactical ? styles.statusBadgeDark : styles.statusBadgeLight,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.destLabelText,
                  { color: isTactical ? "#E2E8F0" : "#1E293B" },
                ]}
              >
                {destination.addressFull}
              </Text>
            </View>
          </View>
        </Marker>
      </MapView>

      <View style={styles.topOverlay} pointerEvents="box-none">
        <View
          style={[
            styles.cityBadge,
            isTactical ? styles.overlayDark : styles.overlayLight,
          ]}
        >
          <Ionicons
            name="compass-outline"
            size={14}
            color={isTactical ? "#38BDF8" : theme.colors.primary}
          />
          <Text
            style={[
              styles.cityBadgeText,
              { color: isTactical ? "#F1F5F9" : "#0F172A" },
            ]}
          >
            Guayaquil · {GUAYAQUIL_BASE.latitude.toFixed(4)},{" "}
            {GUAYAQUIL_BASE.longitude.toFixed(4)}
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
            name={isTactical ? "moon" : "sunny"}
            size={14}
            color={isTactical ? "#38BDF8" : "#D97706"}
          />
          <Text
            style={[
              styles.modePillText,
              { color: isTactical ? "#F8FAFC" : "#0F172A" },
            ]}
          >
            {isTactical ? "Modo Táctico" : "Modo Claro"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },
  topOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  overlayDark: {
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderColor: "rgba(56, 189, 248, 0.35)",
  },
  overlayLight: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderColor: "rgba(20, 63, 115, 0.2)",
  },
  cityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  cityBadgeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    minHeight: 34,
  },
  modePillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  driverMarkerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    marginBottom: 4,
  },
  statusBadgeDark: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderColor: "rgba(56, 189, 248, 0.45)",
  },
  statusBadgeLight: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderColor: "rgba(20, 63, 115, 0.25)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A5CD39",
  },
  statusBadgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },
  radarCenter: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  radarHalo: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  driverCore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  destMarkerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  destRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(165, 205, 57, 0.28)",
    borderWidth: 1.5,
    borderColor: "#A5CD39",
    alignItems: "center",
    justifyContent: "center",
  },
  destCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#A5CD39",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  destLabelBox: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 150,
  },
  destLabelText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },
});
