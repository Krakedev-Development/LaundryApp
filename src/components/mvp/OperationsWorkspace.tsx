import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View, Image } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/useAuthStore";
import {
  useBusinessStore,
  currentActor,
  flushBusiness,
  updateKyc,
  businessService,
  createDriverAccount,
  reviewReward,
} from "../../store/useBusinessStore";
import { MODE_LABELS, nextAction } from "../../services/domain/BusinessService";
import { Screen, Card, Action, ui } from "./ui";
import MapViewCustom from "../map/MapViewCustom";
export function OperationsWorkspace() {
  const router = useRouter(),
    state = useBusinessStore((s) => s.state)!,
    { user, setUser, logout } = useAuthStore(),
    actor = currentActor();
  const [tab, setTab] = useState<
      "orders" | "kyc" | "drivers" | "rewards" | "policy"
    >("orders"),
    [error, setError] = useState(""),
    [reason, setReason] = useState("");
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [plate, setPlate] = useState("");
  const [policy, setPolicy] = useState({ ...state.businessPolicy });
  if (!["ADMIN", "SUPERVISOR"].includes(actor.role))
    return (
      <Screen title="Operaciones">
        <Text style={ui.error}>
          Este módulo está reservado al personal operativo.
        </Text>
      </Screen>
    );
  const run = async (fn: () => void) => {
    setError("");
    try {
      fn();
      await flushBusiness();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    }
  };
  const facility =
    state.facilities.find((f) => f.id === user?.facilityId) ??
    state.facilities.find((f) => f.id === "FAC-02")!;
  const orders = state.orders.filter(
    (o) => actor.role === "ADMIN" || o.facilityId === actor.facilityId,
  );
  return (
    <Screen title="Centro de operaciones · MVP" back={false}>
      <Card>
        <Text style={ui.subtitle}>{user?.name}</Text>
        <Text style={ui.text}>{user?.email}</Text>
        <Text style={ui.badge}>
          {actor.role === "ADMIN" ? "Administrador" : "Supervisor"} ·{" "}
          {facility.name}
        </Text>
        <Text style={ui.muted}>
          Datos locales del dispositivo. Para completar una solicitud cambia
          entre las cuentas demo en esta misma instalación.
        </Text>
        <Action
          label="Cerrar sesión / cambiar cuenta"
          icon="log-out-outline"
          onPress={() => {
            logout();
            router.replace("/(auth)/login");
          }}
        />
      </Card>
      {error && <Text style={ui.error}>{error}</Text>}
      {actor.role === "ADMIN" && (
        <Card>
          <Text style={ui.subtitle}>
            Sede de operación para verificar códigos
          </Text>
          {state.facilities.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[ui.outline, facility.id === f.id && ui.selected]}
              onPress={() =>
                setUser({ ...user!, facilityId: f.id }, "mock-token-123")
              }
            >
              <Text style={ui.text}>{f.name}</Text>
            </TouchableOpacity>
          ))}
        </Card>
      )}
      <View style={{ height: 260, borderRadius: 18, overflow: "hidden" }}>
        <MapViewCustom
          center={{
            latitude: facility.coordinates.lat,
            longitude: facility.coordinates.lng,
          }}
          drivers={state.drivers
            .filter((d) => d.facilityId === facility.id)
            .map((d) => ({
              id: d.id,
              label: d.name,
              latitude: d.location.lat,
              longitude: d.location.lng,
            }))}
          stops={orders
            .filter(
              (o) =>
                o.facilityId === facility.id &&
                !["COMPLETED", "CANCELLED"].includes(o.status),
            )
            .map((o) => ({
              id: o.id,
              label: o.id,
              latitude: o.customerAddress.coordinates.lat,
              longitude: o.customerAddress.coordinates.lng,
            }))}
        />
      </View>
      <View style={ui.row}>
        {(["orders", "kyc", "drivers", "rewards", "policy"] as const)
          .filter((t) => actor.role === "ADMIN" || t === "orders")
          .map((t) => (
            <TouchableOpacity
              key={t}
              style={[ui.outline, tab === t && ui.selected]}
              onPress={() => setTab(t)}
            >
              <Text style={ui.text}>
                {
                  {
                    orders: "Solicitudes",
                    kyc: "Verificación",
                    drivers: "Choferes",
                    rewards: "Canjes",
                    policy: "Políticas",
                  }[t]
                }
              </Text>
            </TouchableOpacity>
          ))}
      </View>
      {tab === "orders" &&
        orders.map((o) => (
          <TouchableOpacity
            key={o.id}
            onPress={() =>
              router.push({
                pathname: "/(admin)/business-order",
                params: { id: o.id },
              })
            }
          >
            <Card>
              <Text style={ui.subtitle}>{o.id}</Text>
              <Text style={ui.text}>
                {o.customerName} · {o.facilityName}
              </Text>
              <Text style={ui.badge}>
                {MODE_LABELS[o.fulfillment?.mode ?? "HOME_HOME"]}
              </Text>
              <Text style={ui.text}>{nextAction(o, state)}</Text>
              <Text style={ui.muted}>
                {o.status} ·{" "}
                {o.pricing.amountKnown === false
                  ? "Importe pendiente"
                  : `$${o.pricing.total.toFixed(2)}`}
              </Text>
            </Card>
          </TouchableOpacity>
        ))}
      {actor.role === "ADMIN" && tab === "kyc" && (
        <>
          <Card>
            <Text style={ui.subtitle}>Verificaciones sensibles</Text>
            <Text style={ui.muted}>
              El supervisor no tiene acceso a documentos o biometría. En los
              fixtures se usan iconos, sin fotografías genéricas.
            </Text>
            <TextInput
              style={ui.input}
              placeholder="Motivo de rechazo"
              value={reason}
              onChangeText={setReason}
            />
          </Card>
          {state.customers.map((c) => (
            <Card key={c.id}>
              <Text style={ui.subtitle}>{c.fullName}</Text>
              <Text style={ui.text}>
                {c.email} · {c.kycStatus}
              </Text>
              <Text style={ui.muted}>
                Documento: {c.documentType} {c.documentNumber}
              </Text>
              {c.kycDocumentUrl && (
                <Image
                  source={{ uri: c.kycDocumentUrl }}
                  style={{ height: 200, borderRadius: 12 }}
                  resizeMode="contain"
                />
              )}
              {c.kycSelfieUrl && (
                <Image
                  source={{ uri: c.kycSelfieUrl }}
                  style={{ height: 180, borderRadius: 12 }}
                  resizeMode="contain"
                />
              )}
              <Action
                label="Aprobar verificación"
                onPress={() =>
                  void run(() => updateKyc(c.id, "APPROVED", reason))
                }
              />
              <Action
                label="Rechazar con motivo"
                onPress={() =>
                  void run(() => updateKyc(c.id, "REJECTED", reason))
                }
              />
            </Card>
          ))}
        </>
      )}
      {actor.role === "ADMIN" && tab === "drivers" && (
        <>
          <Card>
            <Text style={ui.subtitle}>Crear cuenta de chofer</Text>
            <Text style={ui.muted}>
              Solo el administrador crea estas cuentas. No existe registro
              público de choferes. Las nuevas cuentas demo utilizan 123456.
            </Text>
            <TextInput
              accessibilityLabel="Nombre del chofer"
              style={ui.input}
              placeholder="Nombre"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              accessibilityLabel="Correo del chofer"
              style={ui.input}
              placeholder="Correo"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <TextInput
              accessibilityLabel="Placa del chofer"
              style={ui.input}
              placeholder="Placa"
              value={plate}
              onChangeText={setPlate}
            />
            <Action
              label="Crear chofer para esta sede"
              onPress={() =>
                void run(() =>
                  createDriverAccount(name, email, plate, facility.id),
                )
              }
            />
          </Card>
          {state.drivers.map((d) => (
            <Card key={d.id}>
              <Text style={ui.subtitle}>{d.name}</Text>
              <Text style={ui.text}>
                {d.email} · {d.vehiclePlate}
              </Text>
              <Text style={ui.muted}>
                {d.facilityName} · {d.activeOrders} solicitudes activas
              </Text>
            </Card>
          ))}
        </>
      )}
      {actor.role === "ADMIN" && tab === "rewards" && (
        <>
          <Card>
            <Text style={ui.subtitle}>Revisión de canjes</Text>
            <Text style={ui.muted}>
              Los canjes nuevos reservan puntos. Aprobar registra el débito una
              sola vez; rechazar libera la reserva.
            </Text>
            <TextInput
              accessibilityLabel="Motivo de revisión del canje"
              style={ui.input}
              placeholder="Motivo o comprobante de entrega"
              value={reason}
              onChangeText={setReason}
            />
          </Card>
          {state.redemptions.map((r) => (
            <Card key={r.id}>
              <Text style={ui.subtitle}>
                {state.rewards.find((reward) => reward.id === r.rewardId)
                  ?.name ?? r.rewardId}
              </Text>
              <Text style={ui.text}>
                {state.customers.find((c) => c.id === r.customerId)?.fullName} ·{" "}
                {r.pointsSpent} puntos
              </Text>
              <Text style={ui.badge}>{r.status ?? "APPROVED"}</Text>
              {r.status === "PENDING" && (
                <>
                  <Action
                    label="Aprobar canje"
                    onPress={() =>
                      void run(() => reviewReward(r.id, "APPROVED", reason))
                    }
                  />
                  <Action
                    label="Rechazar canje"
                    onPress={() =>
                      void run(() => reviewReward(r.id, "REJECTED", reason))
                    }
                  />
                </>
              )}
              {r.status === "APPROVED" && (
                <Action
                  label="Registrar entrega del canje"
                  onPress={() =>
                    void run(() => reviewReward(r.id, "DELIVERED", reason))
                  }
                />
              )}
            </Card>
          ))}
        </>
      )}
      {actor.role === "ADMIN" && tab === "policy" && (
        <Card>
          <Text style={ui.subtitle}>Políticas de demostración</Text>
          <Text style={ui.muted}>
            Campos vacíos conservan la decisión en revisión. Esta configuración
            no fija políticas definitivas del negocio.
          </Text>
          {(
            [
              "minimumOrderAmount",
              "taxRate",
              "pickupFee",
              "deliveryFee",
              "cutoffMinutes",
              "lateCancellationFee",
              "noShowFee",
              "failedPickupFee",
              "driverLimit",
            ] as const
          ).map((key) => (
            <View key={key}>
              <Text style={ui.muted}>
                {
                  {
                    minimumOrderAmount: "Importe mínimo opcional",
                    taxRate: "IVA (fracción)",
                    pickupFee: "Tarifa recogida",
                    deliveryFee: "Tarifa entrega",
                    cutoffMinutes: "Corte de cambios, minutos",
                    lateCancellationFee: "Cancelación tardía",
                    noShowFee: "Ausencia",
                    failedPickupFee: "Recogida fallida",
                    driverLimit: "Límite opcional de carga",
                  }[key]
                }
              </Text>
              <TextInput
                style={ui.input}
                placeholder="En revisión"
                keyboardType="decimal-pad"
                value={policy[key] === undefined ? "" : String(policy[key])}
                onChangeText={(text) =>
                  setPolicy({
                    ...policy,
                    [key]:
                      text === "" ? undefined : Number(text.replace(",", ".")),
                  })
                }
              />
            </View>
          ))}
          {(
            [
              "taxIncluded",
              "enforceDriverLimit",
              "blockNewOrdersOnCharges",
              "driverMayReorder",
              "requireStorePickupSlot",
            ] as const
          ).map((key) => (
            <TouchableOpacity
              key={key}
              style={ui.outline}
              onPress={() => setPolicy({ ...policy, [key]: !policy[key] })}
            >
              <Text style={ui.text}>
                {
                  {
                    taxIncluded: "IVA incluido en el precio",
                    enforceDriverLimit: "Aplicar límite de carga",
                    blockNewOrdersOnCharges:
                      "Bloquear nuevas solicitudes con cargos",
                    driverMayReorder: "Chofer puede reordenar",
                    requireStorePickupSlot: "Reserva obligatoria de retiro",
                  }[key]
                }
                : {policy[key] ? "Sí" : "No"}
              </Text>
            </TouchableOpacity>
          ))}
          <Action
            label="Guardar configuración local"
            onPress={() => void run(() => businessService.savePolicy(policy))}
          />
          {policy.review.map((r) => (
            <Text key={r} style={ui.muted}>
              En revisión: {r}
            </Text>
          ))}
        </Card>
      )}
    </Screen>
  );
}
