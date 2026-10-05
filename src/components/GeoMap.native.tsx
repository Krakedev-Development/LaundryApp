import React, { useRef, useState, useEffect } from "react";
import { Text, View, TouchableOpacity } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import type MapboxType from "@rnmapbox/maps";
import type { GeoMapProps } from "./GeoMap.types";
import { geoConfig } from "../services/geo/geo.config";
import { toLngLat } from "../services/geo/geo.types";
import { ui } from "./ui";
import { SERVICE_AREAS } from "../services/geo/demo";
// Avoid loading native bindings inside Expo Go; the supported runtime is a development build.
let NativeMapbox: typeof MapboxType | undefined;
if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient)
  NativeMapbox = require("@rnmapbox/maps").default;
export function GeoMap({
  origin,
  destination,
  label,
  height = 280,
  route,
  onPick,
}: GeoMapProps) {
  const camera = useRef<React.ComponentRef<typeof MapboxType.Camera>>(null);
  const [error, setError] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);
  useEffect(() => {
    let active = true;
    if (NativeMapbox && geoConfig.accessToken)
      NativeMapbox.setAccessToken(geoConfig.accessToken)
        .then(() => {
          if (active) setTokenReady(true);
        })
        .catch(() => {
          if (active) setError(true);
        });
    return () => {
      active = false;
    };
  }, []);
  if (!NativeMapbox || !geoConfig.accessToken)
    return (
      <Text style={ui.meta}>
        {!NativeMapbox
          ? "Abre la compilación de desarrollo para ver el mapa."
          : "Mapa pendiente de configuración. Las direcciones siguen disponibles."}
      </Text>
    );
  if (!tokenReady)
    return (
      <Text style={ui.meta}>
        {error
          ? "No pudimos preparar el mapa. Consulta tu dirección."
          : "Preparando mapa…"}
      </Text>
    );
  const Mapbox = NativeMapbox;
  return (
    <View>
      <Mapbox.MapView
        style={{ height, borderRadius: 14 }}
        styleURL={geoConfig.style}
        onMapLoadingError={() => setError(true)}
        onPress={(event) => {
          if (onPick && event.geometry.type === "Point") {
            const coordinates = event.geometry.coordinates;
            onPick({ lng: coordinates[0], lat: coordinates[1] });
          }
        }}
      >
        <Mapbox.Camera
          ref={camera}
          centerCoordinate={toLngLat(destination)}
          zoomLevel={14}
          animationDuration={500}
        />
        {!!onPick && (
          <Mapbox.ShapeSource
            id="coverage"
            shape={{
              type: "FeatureCollection",
              features: SERVICE_AREAS.filter((area) => area.active).map(
                (area) => ({
                  type: "Feature",
                  properties: { name: area.name },
                  geometry: area.polygon,
                }),
              ),
            }}
          >
            <Mapbox.FillLayer
              id="coverage-fill"
              style={{ fillColor: "#61BFC7", fillOpacity: 0.12 }}
            />
          </Mapbox.ShapeSource>
        )}
        {origin && (
          <Mapbox.PointAnnotation
            id="driver"
            coordinate={toLngLat(origin)}
            title="Chofer · ubicación simulada"
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "#143F73",
                borderWidth: 2,
                borderColor: "white",
              }}
            />
          </Mapbox.PointAnnotation>
        )}
        <Mapbox.PointAnnotation
          id="destination"
          coordinate={toLngLat(destination)}
          title={label}
          draggable={!!onPick}
          onDragEnd={(event) => {
            if (onPick && event.geometry.type === "Point")
              onPick({
                lng: event.geometry.coordinates[0],
                lat: event.geometry.coordinates[1],
              });
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: "#668B16",
              borderWidth: 2,
              borderColor: "white",
            }}
          />
        </Mapbox.PointAnnotation>
        {route && !route.simulated && (
          <Mapbox.ShapeSource
            id="route"
            shape={{
              type: "Feature",
              properties: {},
              geometry: route.geometry,
            }}
          >
            <Mapbox.LineLayer
              id="route-line"
              style={{ lineColor: "#143F73", lineWidth: 5 }}
            />
          </Mapbox.ShapeSource>
        )}
      </Mapbox.MapView>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() =>
          camera.current?.setCamera({
            centerCoordinate: toLngLat(destination),
            zoomLevel: 14,
            animationDuration: 500,
          })
        }
      >
        <Text style={ui.meta}>Centrar destino</Text>
      </TouchableOpacity>
      {origin && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() =>
            camera.current?.setCamera({
              centerCoordinate: toLngLat(origin),
              zoomLevel: 14,
              animationDuration: 500,
            })
          }
        >
          <Text style={ui.meta}>Centrar chofer</Text>
        </TouchableOpacity>
      )}
      {error && (
        <Text style={ui.meta}>
          Mapa temporalmente no disponible. Consulta la dirección.
        </Text>
      )}
      {!!onPick && (
        <Text style={ui.meta}>
          Toca el mapa o arrastra el pin para confirmar tu ubicación.
        </Text>
      )}
    </View>
  );
}
