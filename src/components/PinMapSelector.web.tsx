import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../design-system/tokens";
import { tactile } from "../design-system/interaction";
import { useReducedMotion } from "../design-system/MotionProvider";
import {
  GUAYAQUIL_BASE,
  GUAYAQUIL_SECTORS,
  MAP_MODE_STORAGE_KEY,
  OSM_TILE_URLS,
  type MapThemeMode,
} from "./routeMapShared";
import type { PinMapSelectorProps } from "./PinMapSelector";

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

function tileXToLng(x: number, zoom: number): number {
  return (x / Math.pow(2, zoom)) * 360 - 180;
}

function tileYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

export default function PinMapSelector({
  coordinate,
  onChangeCoordinate,
  height = 280,
}: PinMapSelectorProps) {
  const [mode, setMode] = useState<MapThemeMode>("tactical");
  const [layout, setLayout] = useState({ width: 420, height });
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();

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

  const centerTileX = lngToTileX(GUAYAQUIL_BASE.longitude, ZOOM);
  const centerTileY = latToTileY(GUAYAQUIL_BASE.latitude, ZOOM);

  const coordToPixel = (pt: { latitude: number; longitude: number }) => {
    const x = lngToTileX(pt.longitude, ZOOM);
    const y = latToTileY(pt.latitude, ZOOM);
    return {
      x: layout.width / 2 + (x - centerTileX) * TILE_SIZE,
      y: layout.height / 2 + (y - centerTileY) * TILE_SIZE,
    };
  };

  const handleMapPress = (e: any) => {
    const clickX = e.nativeEvent?.locationX ?? e.nativeEvent?.layerX;
    const clickY = e.nativeEvent?.locationY ?? e.nativeEvent?.layerY;
    if (typeof clickX !== "number" || typeof clickY !== "number") return;

    const dx = clickX - layout.width / 2;
    const dy = clickY - layout.height / 2;

    const targetTileX = centerTileX + dx / TILE_SIZE;
    const targetTileY = centerTileY + dy / TILE_SIZE;

    const newLng = tileXToLng(targetTileX, ZOOM);
    const newLat = tileYToLat(targetTileY, ZOOM);

    handleSelectCoordinate({
      latitude: newLat,
      longitude: newLng,
    });
  };

  const isTactical = mode === "tactical";

  // Compute tile matrix around center
  const centerTileIntX = Math.floor(centerTileX);
  const centerTileIntY = Math.floor(centerTileY);
  const fracX = (centerTileX - centerTileIntX) * TILE_SIZE;
  const fracY = (centerTileY - centerTileIntY) * TILE_SIZE;
  const originPixelX = layout.width / 2 - fracX;
  const originPixelY = layout.height / 2 - fracY;

  const tileRange = [-2, -1, 0, 1, 2];
  const tiles: Array<{
    key: string;
    url: string;
    left: number;
    top: number;
  }> = [];

  for (const dx of tileRange) {
    for (const dy of tileRange) {
      const tx = centerTileIntX + dx;
      const ty = centerTileIntY + dy;
      const url = OSM_TILE_URLS[mode]
        .replace("{z}", String(ZOOM))
        .replace("{x}", String(tx))
        .replace("{y}", String(ty));
      tiles.push({
        key: `${mode}-${tx}-${ty}`,
        url,
        left: originPixelX + dx * TILE_SIZE,
        top: originPixelY + dy * TILE_SIZE,
      });
    }
  }

  const pinPos = coordToPixel(validCoord);

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
        onLayout={(e) =>
          setLayout({
            width: e.nativeEvent.layout.width,
            height: e.nativeEvent.layout.height,
          })
        }
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleMapPress}
          accessibilityLabel="Toca el mapa interactivo para fijar el domicilio"
        >
          {tiles.map((t) => (
            <Image
              key={t.key}
              source={{ uri: t.url }}
              style={[
                styles.tile,
                {
                  left: t.left,
                  top: t.top,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                },
              ]}
              resizeMode="cover"
            />
          ))}

          {/* Interactive Tactical Pin Marker */}
          <View
            style={[
              styles.markerAnchor,
              {
                left: pinPos.x - 17,
                top: pinPos.y - 34,
              },
            ]}
            pointerEvents="none"
          >
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
                  backgroundColor: isTactical
                    ? "#0284C7"
                    : theme.colors.primary,
                },
              ]}
            >
              <Ionicons name="location" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.markerTip} />
          </View>
        </Pressable>

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
              Toca el mapa para fijar la ubicación exacta
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
                onPress={() => {
                  handleSelectCoordinate({
                    latitude: sector.latitude,
                    longitude: sector.longitude,
                  });
                }}
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
  tile: {
    position: "absolute",
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
  markerAnchor: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 42,
  },
  markerHalo: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    top: 0,
  },
  markerPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
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
