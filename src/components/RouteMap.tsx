import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../design-system/tokens";
import { tactile } from "../design-system/interaction";
import type { Leg } from "../domain/models";
import {
  GUAYAQUIL_BASE,
  MAP_MODE_STORAGE_KEY,
  normalizeGuayaquilCoords,
  type MapThemeMode,
} from "./routeMapShared";
import { buildRouteRadarLeafletHtml } from "./leafletHtml";

export {
  GUAYAQUIL_BASE,
  MAP_MODE_STORAGE_KEY,
  OSM_TILE_URLS,
  normalizeGuayaquilCoords,
  type MapThemeMode,
} from "./routeMapShared";

export interface RouteMapProps {
  height?: number;
  origin: { latitude: number; longitude: number };
  destination: Pick<Leg, "latitude" | "longitude" | "addressFull">;
  facility?: { latitude: number; longitude: number; name?: string };
  driverInfo?: {
    name?: string;
    vehicle?: string;
    plate?: string;
    status?: string;
  } | null;
  isSearching?: boolean;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
}

export default function RouteMap({
  origin,
  destination,
  facility,
  driverInfo,
  isSearching = false,
  routeCoordinates,
  height = theme.layout.map,
}: RouteMapProps) {
  const [mode, setMode] = useState<MapThemeMode>("tactical");
  const webViewRef = useRef<WebView>(null);

  const normalized = normalizeGuayaquilCoords(origin, destination);
  const driverLabel = isSearching
    ? "Buscando..."
    : driverInfo?.plate
      ? driverInfo.plate
      : "En camino";

  const initialHtml = useMemo(
    () =>
      buildRouteRadarLeafletHtml({
        origin: normalized.origin,
        destination: {
          ...normalized.destination,
          addressFull: destination.addressFull,
        },
        facility,
        routeCoordinates,
        mode: "tactical",
        isSearching,
        driverLabel,
      }),
    // Only build initial HTML once on mount; live updates use injectJavaScript.
    [],
  );

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(MAP_MODE_STORAGE_KEY)
      .then((saved) => {
        if (mounted && (saved === "tactical" || saved === "light")) {
          setMode(saved);
          webViewRef.current?.injectJavaScript(
            `window.setTileMode && window.setTileMode("${saved}"); true;`,
          );
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    webViewRef.current?.injectJavaScript(
      `window.updateDriverPosition && window.updateDriverPosition(${normalized.origin.latitude}, ${normalized.origin.longitude}, ${isSearching}, ${JSON.stringify(driverLabel)}); true;`,
    );
  }, [
    normalized.origin.latitude,
    normalized.origin.longitude,
    isSearching,
    driverLabel,
  ]);

  useEffect(() => {
    const coords =
      routeCoordinates && routeCoordinates.length >= 2
        ? routeCoordinates
        : [normalized.origin, normalized.destination];
    const latLngPairs = coords.map((c) => [c.latitude, c.longitude]);
    webViewRef.current?.injectJavaScript(
      `window.updateRoutePolyline && window.updateRoutePolyline(${JSON.stringify(latLngPairs)}); true;`,
    );
  }, [
    routeCoordinates,
    normalized.origin.latitude,
    normalized.origin.longitude,
    normalized.destination.latitude,
    normalized.destination.longitude,
  ]);

  const toggleMode = () => {
    tactile("selection");
    const next: MapThemeMode = mode === "tactical" ? "light" : "tactical";
    setMode(next);
    void AsyncStorage.setItem(MAP_MODE_STORAGE_KEY, next).catch(() => {});
    webViewRef.current?.injectJavaScript(
      `window.setTileMode && window.setTileMode("${next}"); true;`,
    );
  };

  const isTactical = mode === "tactical";

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
      accessibilityLabel="Mapa táctico de ruta del chofer en Guayaquil"
    >
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: initialHtml }}
        style={StyleSheet.absoluteFill}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        onLoadEnd={() => {
          webViewRef.current?.injectJavaScript(
            `window.setTileMode && window.setTileMode("${mode}"); true;`,
          );
          webViewRef.current?.injectJavaScript(
            `window.updateDriverPosition && window.updateDriverPosition(${normalized.origin.latitude}, ${normalized.origin.longitude}, ${isSearching}, ${JSON.stringify(driverLabel)}); true;`,
          );
          if (routeCoordinates && routeCoordinates.length >= 2) {
            const pairs = routeCoordinates.map((c) => [
              c.latitude,
              c.longitude,
            ]);
            webViewRef.current?.injectJavaScript(
              `window.updateRoutePolyline && window.updateRoutePolyline(${JSON.stringify(pairs)}); true;`,
            );
          }
        }}
      />

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

      <View
        style={[
          styles.attribution,
          isTactical ? styles.overlayDark : styles.overlayLight,
        ]}
      >
        <Text
          style={[
            styles.attributionText,
            { color: isTactical ? "#94A3B8" : "#475569" },
          ]}
        >
          Leaflet · Carto · OSM
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  topOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  overlayDark: {
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderColor: "rgba(148, 163, 184, 0.25)",
  },
  overlayLight: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderColor: "rgba(15, 23, 42, 0.12)",
  },
  cityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  cityBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  modePillText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
  },
  attribution: {
    position: "absolute",
    bottom: 8,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  attributionText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "600",
  },
});
