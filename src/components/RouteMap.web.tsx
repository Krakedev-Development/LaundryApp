import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle, Line } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../design-system/tokens";
import { tactile } from "../design-system/interaction";
import { useReducedMotion } from "../design-system/MotionProvider";
import {
  GUAYAQUIL_BASE,
  MAP_MODE_STORAGE_KEY,
  OSM_TILE_URLS,
  normalizeGuayaquilCoords,
  type MapThemeMode,
  type RouteMapProps,
} from "./RouteMap";

const ZOOM = 14;
const TILE_SIZE = 256;

function lngToTileX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

function latToTileY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

export default function RouteMap({
  origin,
  destination,
  height = theme.layout.map,
}: RouteMapProps) {
  const [mode, setMode] = useState<MapThemeMode>("tactical");
  const [layout, setLayout] = useState({ width: 420, height });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

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
    if (reduced) {
      pulseAnim.setValue(0.35);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim, reduced]);

  const toggleMode = () => {
    tactile("selection");
    const next: MapThemeMode = mode === "tactical" ? "light" : "tactical";
    setMode(next);
    void AsyncStorage.setItem(MAP_MODE_STORAGE_KEY, next).catch(() => {});
  };

  const normalized = normalizeGuayaquilCoords(origin, destination);
  const isTactical = mode === "tactical";

  const centerTileX = lngToTileX(GUAYAQUIL_BASE.longitude, ZOOM);
  const centerTileY = latToTileY(GUAYAQUIL_BASE.latitude, ZOOM);
  const baseTileX = Math.floor(centerTileX);
  const baseTileY = Math.floor(centerTileY);

  const centerOffsetX = (centerTileX - baseTileX) * TILE_SIZE;
  const centerOffsetY = (centerTileY - baseTileY) * TILE_SIZE;

  const project = (coord: { latitude: number; longitude: number }) => {
    const tx = lngToTileX(coord.longitude, ZOOM);
    const ty = latToTileY(coord.latitude, ZOOM);
    return {
      x: layout.width / 2 + (tx - centerTileX) * TILE_SIZE + pan.x,
      y: layout.height / 2 + (ty - centerTileY) * TILE_SIZE + pan.y,
    };
  };

  const driverPt = project(normalized.origin);
  const destPt = project(normalized.destination);

  const tiles: { key: string; url: string; left: number; top: number }[] = [];
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      const tx = baseTileX + dx;
      const ty = baseTileY + dy;
      const url = OSM_TILE_URLS[mode]
        .replace("{z}", String(ZOOM))
        .replace("{x}", String(tx))
        .replace("{y}", String(ty));
      const left =
        layout.width / 2 - centerOffsetX + dx * TILE_SIZE + pan.x;
      const top =
        layout.height / 2 - centerOffsetY + dy * TILE_SIZE + pan.y;
      tiles.push({ key: `${mode}-${tx}-${ty}`, url, left, top });
    }
  }

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.3],
  });
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.65, 0.25, 0],
  });

  return (
    <View
      accessibilityLabel={`Mapa táctico de ruta a ${destination.addressFull} en Guayaquil`}
      onLayout={(e) => {
        const { width, height: h } = e.nativeEvent.layout;
        if (width > 0 && h > 0) setLayout({ width, height: h });
      }}
      onPointerDown={(e) => {
        const { pageX, pageY } = e.nativeEvent;
        dragStart.current = { x: pageX - pan.x, y: pageY - pan.y };
      }}
      onPointerMove={(e) => {
        if (!dragStart.current) return;
        const { pageX, pageY } = e.nativeEvent;
        const nextX = Math.max(
          -180,
          Math.min(180, pageX - dragStart.current.x),
        );
        const nextY = Math.max(
          -140,
          Math.min(140, pageY - dragStart.current.y),
        );
        setPan({ x: nextX, y: nextY });
      }}
      onPointerUp={() => {
        dragStart.current = null;
      }}
      onPointerLeave={() => {
        dragStart.current = null;
      }}
      style={[
        styles.container,
        {
          height,
          backgroundColor: isTactical ? "#0B1320" : "#E2E8F0",
          borderColor: isTactical ? "#1E293B" : theme.colors.border,
        },
      ]}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {tiles.map((t) => (
          <Image
            key={t.key}
            source={{ uri: t.url }}
            accessible={false}
            style={{
              position: "absolute",
              left: t.left,
              top: t.top,
              width: TILE_SIZE,
              height: TILE_SIZE,
            }}
          />
        ))}
      </View>

      <Svg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Line
          x1={driverPt.x}
          y1={driverPt.y}
          x2={destPt.x}
          y2={destPt.y}
          stroke={isTactical ? "rgba(56, 189, 248, 0.25)" : "rgba(20, 63, 115, 0.2)"}
          strokeWidth={9}
          strokeLinecap="round"
        />
        <Line
          x1={driverPt.x}
          y1={driverPt.y}
          x2={destPt.x}
          y2={destPt.y}
          stroke={isTactical ? "#38BDF8" : theme.colors.primary}
          strokeWidth={3.5}
          strokeDasharray="8 6"
          strokeLinecap="round"
        />
        <Circle
          cx={destPt.x}
          cy={destPt.y}
          r={18}
          fill="rgba(165, 205, 57, 0.24)"
          stroke="#A5CD39"
          strokeWidth={1.5}
        />
      </Svg>

      {/* Destination Marker */}
      <View
        pointerEvents="none"
        style={[
          styles.markerAnchor,
          {
            left: destPt.x,
            top: destPt.y,
          },
        ]}
      >
        <View style={styles.destCore}>
          <Ionicons name="location" size={14} color="#0F172A" />
        </View>
        <View
          style={[
            styles.destLabelBox,
            isTactical ? styles.badgeDark : styles.badgeLight,
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.destLabelText,
              { color: isTactical ? "#E2E8F0" : "#1E293B" },
            ]}
          >
            Destino · {destination.addressFull}
          </Text>
        </View>
      </View>

      {/* Driver Tactical Radar Marker */}
      <View
        pointerEvents="none"
        style={[
          styles.markerAnchor,
          {
            left: driverPt.x,
            top: driverPt.y,
          },
        ]}
      >
        <View
          style={[
            styles.statusBadge,
            isTactical ? styles.badgeDark : styles.badgeLight,
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
                backgroundColor: isTactical ? "#0284C7" : theme.colors.primary,
              },
            ]}
          >
            <Ionicons name="car-sport" size={15} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* Top Controls Overlay */}
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
            Guayaquil, EC
          </Text>
        </View>

        <View style={styles.controlsRight}>
          {pan.x !== 0 || pan.y !== 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Centrar mapa en Guayaquil"
              onPress={() => {
                tactile("selection");
                setPan({ x: 0, y: 0 });
              }}
              style={({ pressed }) => [
                styles.recenterBtn,
                isTactical ? styles.overlayDark : styles.overlayLight,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons
                name="locate"
                size={14}
                color={isTactical ? "#38BDF8" : theme.colors.primary}
              />
            </Pressable>
          ) : null}
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

      {/* Attribution Footer */}
      <View
        pointerEvents="none"
        style={[
          styles.attribution,
          isTactical ? styles.overlayDark : styles.overlayLight,
        ]}
      >
        <Text
          style={[
            styles.attributionText,
            { color: isTactical ? "#94A3B8" : "#64748B" },
          ]}
        >
          OSM · CartoDB {isTactical ? "Dark Matter" : "Positron"}
        </Text>
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
  controlsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  recenterBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
  markerAnchor: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: -75 }, { translateY: -28 }],
    width: 150,
  },
  badgeDark: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderColor: "rgba(56, 189, 248, 0.45)",
  },
  badgeLight: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderColor: "rgba(20, 63, 115, 0.25)",
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
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  radarHalo: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  driverCore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  destCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#A5CD39",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  destLabelBox: {
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 148,
  },
  destLabelText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
  },
  attribution: {
    position: "absolute",
    bottom: 8,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  attributionText: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "600",
  },
});
