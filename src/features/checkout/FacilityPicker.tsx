import React, { useState } from "react";
import { Text } from "react-native";
import * as Location from "expo-location";
import { useApp } from "../../store/AppStore";
import { Button, Card, ErrorState, Field, ui } from "../../components/ui";
import { GeoMap } from "../../components/GeoMap";
import { RouteMap } from "../../components/GeoRoute";
import { Facility } from "../../domain/models";
import { geoProvider } from "../../services/geo";
import { FacilityDiscoveryService } from "../../services/geo/FacilityDiscoveryService";
import { geoConfig } from "../../services/geo/geo.config";
const discovery = new FacilityDiscoveryService(geoProvider);
export function FacilityPicker({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (f: Facility) => void;
}) {
  const { data, session, engine, online } = useApp();
  const [query, setQuery] = useState("");
  const [origin, setOrigin] = useState(
    engine.customer(session!).addresses[0]?.coordinates ?? geoConfig.center,
  );
  const [ranked, setRanked] = useState<
    {
      facility: Facility;
      durationSeconds: number | null;
      distanceMeters: number | null;
    }[]
  >([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const eligible = discovery.eligible(data.facilities, [
    ...new Set(data.draft.items.map((i) => i.serviceId)),
  ]);
  const rows = ranked.length
    ? ranked.filter((r) => eligible.some((f) => f.id === r.facility.id))
    : eligible.map((f) => ({
        facility: f,
        durationSeconds: null,
        distanceMeters: null,
      }));
  async function rank(current = false) {
    setBusy(true);
    setError("");
    try {
      if (!online)
        throw new Error("Sin conexión: elige una sede de la lista local.");
      let p = origin;
      if (current) {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted")
          throw new Error("Puedes elegir una sede sin compartir tu ubicación.");
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        p = { lat: position.coords.latitude, lng: position.coords.longitude };
        setOrigin(p);
      }
      setRanked(
        await discovery.rank(
          data.facilities,
          p,
          data.draft.items.map((i) => i.serviceId),
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Field
        label="Buscar sede por nombre o dirección"
        value={query}
        onChangeText={setQuery}
      />
      <Button
        title="Ordenar sedes por cercanía"
        variant="secondary"
        busy={busy}
        onPress={() => rank()}
      />
      <Button
        title="Usar ubicación actual para buscar sede"
        variant="secondary"
        disabled={busy}
        onPress={() => rank(true)}
      />
      {rows
        .filter((r) =>
          (r.facility.name + " " + r.facility.address)
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .map(({ facility: f, durationSeconds, distanceMeters }) => (
          <Card key={f.id}>
            <Text style={ui.section}>{f.name}</Text>
            <Text style={ui.body}>{f.address}</Text>
            <Text style={ui.muted}>
              {f.openingHours ?? "Lunes a sábado, 08:00–18:00"}
            </Text>
            {durationSeconds !== null && (
              <Text style={ui.meta}>
                {Math.ceil(durationSeconds / 60)} min ·{" "}
                {((distanceMeters ?? 0) / 1000).toFixed(1)} km por carretera{" "}
                {geoConfig.mode === "demo" ? "· estimación de demo" : ""}
              </Text>
            )}
            {selected === f.id ? (
              <RouteMap
                origin={origin}
                destination={f.coordinates}
                label={f.name}
                stage={"STORE-" + f.id}
                height={210}
              />
            ) : (
              <GeoMap destination={f.coordinates} label={f.name} height={150} />
            )}
            <Button
              title={selected === f.id ? "Sede seleccionada" : "Elegir sede"}
              variant="secondary"
              onPress={() => onSelect(f)}
            />
          </Card>
        ))}
      {!!error && <ErrorState text={error} />}
    </>
  );
}
