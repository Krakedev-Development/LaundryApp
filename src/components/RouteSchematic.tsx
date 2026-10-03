import React from "react";
import { Text, View } from "react-native";
import Svg, {
  Circle,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { Coordinates } from "../domain/models";
import { Colors as C } from "../theme/colors";
import { ui } from "./ui";

/** Geographic schematic for the mock prototype; navigation opens the actual mapping provider. */
export function RouteSchematic({
  origin,
  destination,
  label,
  height = 280,
}: {
  origin: Coordinates;
  destination: Coordinates;
  label: string;
  height?: number;
}) {
  const spanLat = Math.max(0.008, Math.abs(destination.lat - origin.lat) * 1.6);
  const spanLng = Math.max(0.008, Math.abs(destination.lng - origin.lng) * 1.6);
  const center = {
    lat: (origin.lat + destination.lat) / 2,
    lng: (origin.lng + destination.lng) / 2,
  };
  const project = (p: Coordinates) => ({
    x: 180 + ((p.lng - center.lng) / spanLng) * 300,
    y: 140 - ((p.lat - center.lat) / spanLat) * 220,
  });
  const a = project(origin);
  const b = project(destination);
  return (
    <View
      accessibilityLabel={`Ruta simulada hacia ${label}`}
      style={{
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: C.aquaSoft,
      }}
    >
      <Svg width="100%" height={height} viewBox="0 0 360 280">
        <Rect width="360" height="280" fill={C.aquaSoft} />
        {Array.from({ length: 8 }, (_, i) => (
          <React.Fragment key={i}>
            <Line
              x1={i * 55}
              y1="0"
              x2={i * 55 - 45}
              y2="280"
              stroke={C.surface}
              strokeWidth="13"
            />
            <Line
              x1="0"
              y1={i * 45}
              x2="360"
              y2={i * 45 + 30}
              stroke={C.surface}
              strokeWidth="13"
            />
          </React.Fragment>
        ))}
        <Rect x="255" y="8" width="80" height="65" rx="12" fill={C.limeSoft} />
        <Rect x="20" y="210" width="70" height="50" rx="12" fill={C.limeSoft} />
        <Path
          d={`M ${a.x} ${a.y} L ${b.x} ${a.y} L ${b.x} ${b.y}`}
          stroke={C.primary}
          strokeWidth="5"
          strokeDasharray="8 5"
          fill="none"
        />
        <Circle
          cx={a.x}
          cy={a.y}
          r="12"
          fill={C.primary}
          stroke={C.surface}
          strokeWidth="3"
        />
        <Circle
          cx={b.x}
          cy={b.y}
          r="12"
          fill={C.limeDark}
          stroke={C.surface}
          strokeWidth="3"
        />
        <SvgText
          x={a.x}
          y={a.y - 20}
          fill={C.primary}
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
        >
          Origen
        </SvgText>
        <SvgText
          x={b.x}
          y={b.y + 30}
          fill={C.primary}
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
        >
          Destino
        </SvgText>
      </Svg>
      <View style={{ padding: 12 }}>
        <Text style={ui.meta}>Ruta simulada · {label}</Text>
        <Text style={ui.meta}>
          {destination.lat.toFixed(5)}, {destination.lng.toFixed(5)}
        </Text>
      </View>
    </View>
  );
}
