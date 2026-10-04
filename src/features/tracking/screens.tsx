import React from "react";
import { Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AppHeader,
  Badge,
  Button,
  Card,
  ErrorState,
  Page,
  ui,
} from "../../components/ui";
import { RouteMap } from "../../components/RouteMap";
import { useApp } from "../../store/AppStore";
import { activeAssignment, trackingAvailable } from "../../domain/rules";
import { ORDER_STATUS_LABELS } from "../../domain/models";

export function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, engine, data } = useApp();
  const router = useRouter();
  let order;
  try {
    order = engine.order(session!, id);
  } catch {
    return (
      <Page>
        <ErrorState text="Pedido no encontrado." />
      </Page>
    );
  }
  const assignment = activeAssignment(data, order);
  const driver = data.drivers.find((d) => d.id === assignment?.driverId);
  if (!trackingAvailable(order.status) || !driver)
    return (
      <Page>
        <AppHeader title="Seguimiento" />
        <Card>
          <Text style={ui.section}>{ORDER_STATUS_LABELS[order.status]}</Text>
          <Text style={ui.muted}>
            El mapa se habilita cuando tu chofer está en camino a recogida o
            entrega.
          </Text>
          <Button
            title="Ver detalle"
            onPress={() => router.replace(`/(client)/order/${id}`)}
          />
        </Card>
      </Page>
    );
  const target = (assignment!.type === "PICKUP" ? order.pickup : order.delivery)
    .address;
  return (
    <Page>
      <AppHeader title="Seguimiento" subtitle={id} icon="navigate-outline" />
      <Badge title={ORDER_STATUS_LABELS[order.status]} />
      <RouteMap
        origin={driver.location}
        destination={target.coordinates}
        label={target.title}
        height={380}
        stage={order.id + ":" + order.status}
      />
      <Card>
        <Text style={ui.section}>{driver.name}</Text>
        <Text style={ui.body}>
          {driver.vehicle} · {driver.plate}
        </Text>
        <Text style={ui.section}>
          Llegada simulada:{" "}
          {driver.trackingEtaSeconds === undefined
            ? "preparando recorrido"
            : Math.ceil(driver.trackingEtaSeconds / 60) + " min"}
          .
        </Text>
        <Text style={ui.meta}>
          Movimiento y llegada simulados para este escenario local.
        </Text>
        <Button
          title="Chat con chofer"
          icon="chatbubble-outline"
          onPress={() => router.push(`/(client)/chat/${id}`)}
        />
      </Card>
    </Page>
  );
}
