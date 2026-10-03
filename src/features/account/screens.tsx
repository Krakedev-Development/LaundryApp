import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  AppHeader,
  Badge,
  Button,
  Card,
  Check,
  Chip,
  ConfirmationSheet,
  ErrorState,
  Field,
  MenuRow,
  Page,
  PasswordField,
  ui,
} from "../../components/ui";
import { useApp } from "../../store/AppStore";
import { useAction } from "../../hooks/useAction";
import { dateLabel, timeLabel } from "../../domain/rules";
import { Colors as C } from "../../theme/colors";

export function ProfileScreen() {
  const { session, data, store, engine } = useApp();
  const router = useRouter();
  const a = useAction();
  const [logout, setLogout] = useState(false);
  const driver = session!.role === "CHOFER";
  const user = driver
    ? data.drivers.find((u) => u.id === session!.userId)!
    : data.customers.find((u) => u.id === session!.userId)!;
  const group = driver ? "(driver)" : "(client)";
  return (
    <Page>
      <AppHeader
        title={user.name}
        subtitle={user.email}
        icon="person-outline"
      />
      <Badge
        title={driver ? "Chofer" : "Cliente verificado"}
        tone={driver ? "primary" : "success"}
      />
      {!!(driver && "vehicle" in user) && (
        <Card>
          <Text style={ui.section}>Tu operación</Text>
          <Text style={ui.body}>
            {user.vehicle} · {user.plate}
          </Text>
          <Text style={ui.muted}>
            {data.facilities.find((f) => f.id === user.facilityId)?.name}
          </Text>
          <Text style={ui.meta}>
            {user.zoneName} ·{" "}
            {
              data.assignments.filter(
                (v) => v.driverId === user.id && v.status !== "COMPLETED",
              ).length
            }{" "}
            servicios pendientes
          </Text>
          <Badge
            title={
              {
                AVAILABLE: "Disponible",
                ON_SERVICE: "En servicio",
                BREAK: "Pausa",
                OFFLINE: "Fuera de turno",
              }[user.operationalStatus]
            }
          />
        </Card>
      )}
      <Card>
        <Text style={ui.section}>Cuenta</Text>
        <MenuRow
          title="Datos personales"
          icon="person-circle-outline"
          onPress={() => router.push(`/${group}/personal`)}
        />
        {!driver && (
          <>
            <MenuRow
              title="Direcciones"
              icon="location-outline"
              onPress={() => router.push("/(client)/addresses")}
            />
            <MenuRow
              title="Datos de facturación"
              icon="document-text-outline"
              onPress={() => router.push("/(client)/billing")}
            />
          </>
        )}
        <MenuRow
          title="Seguridad"
          icon="lock-closed-outline"
          onPress={() => router.push(`/${group}/security`)}
        />
      </Card>
      {!driver && (
        <Card>
          <Text style={ui.section}>Pagos</Text>
          <MenuRow
            title="Billetera"
            icon="wallet-outline"
            onPress={() => router.push("/(client)/wallet")}
          />
          <MenuRow
            title="Métodos de pago"
            icon="card-outline"
            onPress={() => router.push("/(client)/payments")}
          />
        </Card>
      )}
      <Card>
        <MenuRow
          title="Notificaciones"
          icon="notifications-outline"
          onPress={() => router.push(`/${group}/notifications`)}
        />
        <MenuRow
          title="Ayuda y soporte"
          icon="help-circle-outline"
          onPress={() => router.push(`/${group}/support`)}
        />
      </Card>
      <Button
        title="Cerrar sesión"
        variant="secondary"
        onPress={() => setLogout(true)}
      />
      <ConfirmationSheet
        visible={logout}
        title="Cerrar sesión"
        text="Tus pedidos y movimientos permanecerán guardados en este dispositivo."
        onClose={() => setLogout(false)}
        confirm={() =>
          a.run(async () => {
            await store.logout();
            router.replace("/");
          })
        }
      />
      {!!a.error && <ErrorState text={a.error} />}
    </Page>
  );
}
export function PersonalScreen() {
  const { session, data, engine } = useApp();
  const a = useAction();
  const isDriver = session!.role === "CHOFER";
  const user = (isDriver ? data.drivers : data.customers).find(
    (u) => u.id === session!.userId,
  )!;
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState("phone" in user ? user.phone : "");
  return (
    <Page>
      <AppHeader title="Datos personales" icon="person-outline" />
      <Card>
        <Field label="Nombre completo" value={name} onChangeText={setName} />
        <Field
          label="Email"
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
        />
        {!isDriver && (
          <Field
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        )}
      </Card>
      {!!a.error && <ErrorState text={a.error} />}
      <Button
        title="Guardar datos"
        busy={a.busy}
        onPress={() =>
          a.run(() => {
            if (
              name.trim().length < 3 ||
              !/^\S+@\S+\.\S+$/.test(email) ||
              (!isDriver && phone.replace(/\D/g, "").length < 7)
            )
              throw new Error("Revisa los datos de tu cuenta.");
            if (
              [...engine.data.customers, ...engine.data.drivers].some(
                (u) =>
                  u.id !== user.id &&
                  u.email.toLowerCase() === email.trim().toLowerCase(),
              )
            )
              throw new Error("Ese correo pertenece a otra cuenta.");
            engine.update((d) => {
              const target = (isDriver ? d.drivers : d.customers).find(
                (u) => u.id === user.id,
              )!;
              target.name = name.trim();
              target.email = email.trim().toLowerCase();
              if ("phone" in target) target.phone = phone;
              if (!isDriver)
                d.orders
                  .filter((o) => o.customerId === user.id)
                  .forEach((o) => {
                    o.customerName = name.trim();
                  });
            });
          }, "Datos guardados")
        }
      />
    </Page>
  );
}
export function BillingScreen() {
  const { session, engine } = useApp();
  const c = engine.customer(session!);
  const a = useAction();
  const [form, setForm] = useState(c.billingData);
  const fields = {
    name: "Nombre / razón social",
    taxId: "Identificación fiscal",
    email: "Email",
    phone: "Teléfono",
    address: "Dirección",
  };
  return (
    <Page>
      <AppHeader title="Datos de facturación" icon="document-text-outline" />
      <Card>
        {(Object.keys(fields) as (keyof typeof fields)[]).map((key) => (
          <Field
            key={key}
            label={fields[key]}
            value={form[key]}
            onChangeText={(value) => setForm({ ...form, [key]: value })}
            keyboardType={
              key === "email"
                ? "email-address"
                : key === "phone"
                  ? "phone-pad"
                  : "default"
            }
          />
        ))}
      </Card>
      <Text style={ui.meta}>
        Estos datos se guardan en la demo. No se emite factura electrónica.
      </Text>
      {!!a.error && <ErrorState text={a.error} />}
      <Button
        title="Guardar facturación"
        busy={a.busy}
        onPress={() =>
          a.run(() => {
            if (
              !form.name.trim() ||
              form.taxId.trim().length < 5 ||
              !/^\S+@\S+\.\S+$/.test(form.email) ||
              !form.address.trim()
            )
              throw new Error(
                "Completa nombre, identificación, email y dirección.",
              );
            engine.update((d) => {
              d.customers.find((v) => v.id === c.id)!.billingData = form;
            });
          }, "Facturación guardada")
        }
      />
    </Page>
  );
}
export function SecurityScreen({ mandatory = false }: { mandatory?: boolean }) {
  const { store } = useApp();
  const router = useRouter();
  const a = useAction();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  return (
    <Page>
      <AppHeader
        title={mandatory ? "Crea una nueva contraseña" : "Seguridad"}
        subtitle={
          mandatory
            ? "Actualiza tu contraseña temporal para acceder a Ruta."
            : "Protege el acceso a tu cuenta"
        }
        icon="lock-closed-outline"
      />
      <Card>
        <PasswordField
          label={mandatory ? "Contraseña temporal" : "Contraseña actual"}
          value={current}
          onChangeText={setCurrent}
        />
        <PasswordField
          label="Nueva contraseña"
          value={next}
          onChangeText={setNext}
        />
        <PasswordField
          label="Confirmar contraseña"
          value={confirm}
          onChangeText={setConfirm}
        />
        <Text style={ui.muted}>
          8 caracteres o más, una mayúscula, una minúscula y un número.
        </Text>
      </Card>
      {!!a.error && <ErrorState text={a.error} />}
      <Button
        title="Actualizar contraseña"
        busy={a.busy}
        onPress={() =>
          a.run(async () => {
            if (next !== confirm)
              throw new Error("Las contraseñas no coinciden.");
            await store.changePassword(current, next);
            if (mandatory) router.replace("/(driver)/(tabs)/route");
            else {
              setCurrent("");
              setNext("");
              setConfirm("");
            }
          }, "Contraseña actualizada")
        }
      />
      {!!mandatory && (
        <Button
          title="Cerrar sesión"
          variant="secondary"
          onPress={() => a.run(() => store.logout())}
        />
      )}
    </Page>
  );
}
export function NotificationsScreen() {
  const { session, data, engine } = useApp();
  const router = useRouter();
  const a = useAction();
  const c = data.customers.find((v) => v.id === session!.userId);
  const notifications = data.notifications.filter(
    (n) => n.userId === session!.userId,
  );
  return (
    <Page>
      <AppHeader title="Notificaciones" icon="notifications-outline" />
      {!!c && (
        <Card>
          <Check
            title="Recibir avisos sobre mis pedidos y beneficios"
            checked={c.notificationPreferences}
            onPress={() =>
              engine.update((d) => {
                d.customers.find(
                  (v) => v.id === c.id,
                )!.notificationPreferences = !c.notificationPreferences;
              })
            }
          />
          <Text style={ui.meta}>
            Los eventos del pedido siempre quedan en tu historial. Las
            notificaciones push requieren integración.
          </Text>
        </Card>
      )}
      <Button
        title="Marcar todas como leídas"
        variant="secondary"
        onPress={() =>
          engine.update((d) => {
            d.notifications
              .filter((n) => n.userId === session!.userId)
              .forEach((n) => {
                n.read = true;
              });
          })
        }
      />
      {notifications.map((n) => (
        <Card key={n.id} style={{ borderColor: n.read ? C.border : C.primary }}>
          <View style={ui.between}>
            <Text style={[ui.section, { flex: 1 }]}>{n.title}</Text>
            {!n.read && <Badge title="Nueva" />}
          </View>
          <Text style={ui.body}>{n.body}</Text>
          <Text style={ui.meta}>
            {dateLabel(n.createdAt)} · {timeLabel(n.createdAt)}
          </Text>
          <Button
            title={
              n.entityId?.startsWith("SOL-")
                ? "Ver pedido"
                : "Marcar como leída"
            }
            variant="secondary"
            onPress={() =>
              a.run(() => {
                engine.update((d) => {
                  d.notifications.find((v) => v.id === n.id)!.read = true;
                });
                if (n.entityId?.startsWith("SOL-")) {
                  engine.order(session!, n.entityId);
                  router.push(
                    `/${session!.role === "CLIENTE" ? "(client)/order" : "(driver)/service"}/${n.entityId}`,
                  );
                }
              })
            }
          />
        </Card>
      ))}
      {!notifications.length && (
        <Text style={ui.muted}>
          Todo al día. Aquí aparecerán tus novedades.
        </Text>
      )}
      {!!a.error && <ErrorState text={a.error} />}
    </Page>
  );
}
export function SupportScreen() {
  const { session, engine, online, store } = useApp();
  const a = useAction();
  const [category, setCategory] = useState("Pedidos");
  const [text, setText] = useState("");
  const [faq, setFaq] = useState<string | null>(null);
  const faqs: Record<string, string> = {
    "¿Cómo sigo mi pedido?":
      "Abre Pedidos y selecciona tu solicitud. Verás cada etapa; el seguimiento del chofer está disponible durante recogida o entrega.",
    "¿Cómo pago?":
      "Usa tu billetera o una tarjeta de prueba guardada. El cobro del prototipo es simulado.",
    "¿Cómo funcionan mis puntos?":
      "Los pedidos entregados suman puntos. Los canjes quedan pendientes hasta recibir la revisión administrativa.",
    "¿Qué pasa si falta una prenda?":
      "Guarda una consulta con el número de tu pedido y el detalle. El equipo de soporte podrá revisarla cuando se conecte el servicio.",
  };
  return (
    <Page>
      <AppHeader title="Estamos para ayudarte" icon="help-circle-outline" />
      {Object.entries(faqs).map(([question, answer]) => (
        <Card key={question}>
          <Button
            title={question}
            variant="secondary"
            onPress={() => setFaq(faq === question ? null : question)}
          />
          {!!(faq === question) && <Text style={ui.body}>{answer}</Text>}
        </Card>
      ))}
      <Card>
        <Text style={ui.section}>Contactar soporte</Text>
        <View style={ui.wrap}>
          {["Pedidos", "Pagos", "Membresías", "Prendas"].map((c) => (
            <Chip
              key={c}
              title={c}
              selected={category === c}
              onPress={() => setCategory(c)}
            />
          ))}
        </View>
        <Field
          label="Cuéntanos qué necesitas"
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Incluye el número de solicitud si corresponde"
        />
        <Text style={ui.meta}>
          Esta consulta se guardará en tu demo; no se envía a un equipo de
          soporte real.
        </Text>
        <Button
          title="Guardar consulta"
          busy={a.busy}
          onPress={() =>
            a.run(() => {
              if (text.trim().length < 10)
                throw new Error(
                  "Cuéntanos un poco más para registrar tu consulta.",
                );
              engine.update((d) => {
                engine.notify(
                  d,
                  session!.userId,
                  "SUPPORT_REQUEST",
                  `Consulta guardada · ${category}`,
                  text.trim(),
                );
              });
              setText("");
            }, "Consulta registrada en la demo")
          }
        />
      </Card>
      <Card>
        <Text style={ui.section}>Probar conectividad</Text>
        <Check
          title="Simular modo sin conexión"
          checked={!online}
          onPress={() => store.simulateOffline(online)}
        />
        <Text style={ui.meta}>
          Permite comprobar la ruta guardada y los cambios pendientes de
          sincronización.
        </Text>
      </Card>
      {!!a.error && <ErrorState text={a.error} />}
    </Page>
  );
}
