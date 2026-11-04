# Flujos de LaundryApp y límites de la demo

## 1. Alcance

La app está construida con Expo SDK 57, React Native, TypeScript y Expo Router. Ofrece los roles **Cliente** y **Chofer**. Ambos consumen el mismo estado local de una instalación, aunque cada cuenta solo ve sus pedidos o asignaciones autorizados. No hay una cuenta de operaciones conectada: «Operaciones de sede · demo» representa al personal de planta desde una pantalla explícita.

Los datos iniciales son ficticios y parten de `src/services/laundryWebSeed.json`, generado desde LaundryWeb. `pnpm run demo:prepare` actualiza esa semilla; no establece sincronización en ejecución.

## 2. Puesta en marcha y cuentas

Seguir los requisitos de [README](../README.md). El mapa nativo requiere development build; Expo Go no trae Mapbox. `pnpm run web` permite revisar flujos en navegador, con mapa simplificado.

El login incluye selector de cuentas de demostración. Las claves de prueba, perfiles y escenarios preparados se mantienen en el README y [FULFILLMENT-MVP.md](../FULFILLMENT-MVP.md); la contraseña temporal obliga al chofer a cambiarla antes de trabajar. La contraseña se compara localmente mediante hash con sal por usuario. Esto no sustituye una identidad gestionada por un servidor.

## 3. Acceso, registro y verificación de identidad

1. La entrada redirige a Login si no hay sesión.
2. El registro crea un cliente local y su billetera vacía, y abre una sesión.
3. Si el cliente no ha enviado KYC, se dirige al formulario; si está pendiente o rechazado, queda en la pantalla de estado; solo una cuenta aprobada abre la navegación de Cliente.
4. KYC valida que haya documento, selfie y número. Guarda referencias locales a las imágenes, no un expediente remoto.
5. La revisión aprobada/rechazada se representa localmente. No hay revisión manual desde un portal, proveedor de identidad ni envío de correo para recuperar contraseña.

## 4. Alta de pedido

El asistente ofrece dos recorridos completos:

- **Domicilio a domicilio (`HOME_HOME`)**: catálogo/prendas, extras, dirección y franja de recogida, dirección y fecha de entrega, confirmación y pago de prueba.
- **Sede a sede (`STORE_STORE`)**: prendas, extras, sede/cita de ingreso, confirmación y pago; no se recoge ni entrega a domicilio.

Se requiere KYC aprobado, artículos válidos, mínimo de pedido, agenda permitida, cobertura para ambas direcciones a domicilio y forma de pago válida. El modo sede usa tarifa provisional de catálogo por prenda y sin cargo de transporte. El pedido y el débito de billetera, si corresponde, se guardan en una única actualización local. `requestId` evita crear dos pedidos por una repetición del mismo envío dentro de la sesión del checkout.

La tarjeta `0002` simula rechazo. Otras tarjetas son instrumentos ficticios; no se llama a una pasarela. El total pagado al confirmar es el importe calculado localmente, no un anticipo sujeto a pesaje posterior.

## 5. Operación y seguimiento

### Domicilio

1. `dispatch()` revisa pedidos por recoger y por entregar periódicamente, y asigna un conductor disponible que pase las reglas de sede, zona, capacidad y frescura de ubicación.
2. El chofer inicia navegación, marca llegada y presenta/escanea el código para la transferencia que corresponda.
3. Cliente → chofer registra recogida y cantidad; chofer → planta registra ingreso físico. Una diferencia crea una retención que bloquea el avance.
4. La planta se simula por ciclos temporizados: ingreso → procesamiento → control de calidad → listo → agenda/asignación de entrega. No hay pantalla de planta ni control real de producción en la app móvil.
5. La salida de planta requiere transferencia de sede a chofer. El chofer puede iniciar ruta solo tras esa confirmación; al llegar al cliente confirma destinatario y relación.
6. La entrega completa el pedido y otorga puntos una vez.

### Sede

1. El cliente lleva las prendas a una sede seleccionada y presenta el código de ingreso.
2. Operaciones de sede demo confirma la recepción y cantidad. La diferencia crea retención.
3. La planta automática lleva el pedido hasta listo.
4. Cliente o autorizado presenta el código de retiro; se registra quién retiró y su relación.

La guía de [fulfillment](../FULFILLMENT-MVP.md) contiene códigos preparados y casos para recorrer ambos caminos.

## 6. Reglas de transferencias

`HandoffService` administra códigos opacos/QR y alternativa numérica de seis dígitos. Cada transferencia tiene generación, estado, intentos y auditoría; su activación depende de pago, estado, asignación y modalidad. La verificación prepara un ticket y audita, pero la confirmación vuelve a validar y consume el código en una transacción local. Los códigos se pueden regenerar o revocar con rol demo de administrador y motivo; se bloquean tras cinco intentos incorrectos asociados al pedido seleccionado.

La validación local no acredita identidad o custodia frente a un servidor. El control de sede es deliberadamente una herramienta de demostración, no una autorización de producción. Las transferencias antiguas se migran como evidencia importada, sin fingir que se escanearon.

## 7. Cuenta, beneficios y comunicación

- Perfil, datos personales/fiscales, direcciones con pin, preferencias, seguridad y soporte guardan datos locales.
- Promociones aplican vigencia, mínimo, servicios aplicables y límites registrados en la semilla.
- Puntos usan ledger; canjes pendientes reservan puntos; la aprobación debita una vez y puede habilitar beneficios en checkout.
- Membresías aplican descuentos y recogidas semanales del plan local. No hay renovación/cobro recurrente.
- Recargar billetera agrega un abono ficticio; no procesa fondos.
- Chat, notificaciones y soporte son registros locales; no envían push, SMS, email ni solicitudes a un equipo.

## 8. Modo sin conexión

NetInfo actualiza el indicador de conectividad y Soporte permite forzar modo sin conexión. Eventos logísticos y mensajes se guardan localmente como pendientes y se marcan como sincronizados al recuperar conexión. Como no existe API operacional, esta “sincronización” es un cambio de estado en el mismo almacenamiento y no transmite los eventos a ningún sistema. Crear pedido, recargar y solicitar canje requieren conexión.

## 9. Persistencia y aislamiento

AsyncStorage mantiene el snapshot `laundry-mvp-v1`. La sesión nativa y hashes/referencias KYC utilizan SecureStore; la versión web usa almacenamiento local de credenciales y sesión de pestaña descrito en `src/services/secure.ts`. Reiniciar escenarios borra el estado de la instalación y cierra sesión. Otra instalación, otro navegador, LaundryWeb o LaundryDriver no recibe los cambios.

## 10. Integraciones reales y pendientes

Mapbox Geocoding, Directions y Matrix están detrás de `GeoProvider` y se pueden habilitar con un token público. El tracking implementado es `mock`: el proveedor mueve conductores de demostración mientras hay conexión y la etapa lo permite. La ubicación del dispositivo se solicita en primer plano para el chofer, pero publicación en vivo/background y backend no están implementados. Google Maps, Apple Maps o Waze se abren externamente para navegación.

Quedan para integración: API y base de datos compartidas, autenticación/sesiones servidor, pasarela y conciliación, revisión KYC, procesamiento/planificación de planta, notificaciones, chat remoto, asignación optimizada en servidor, tracking remoto y sincronización multi-dispositivo. La pantalla de sede no sustituye una app de supervisor.

## Referencias de código

- Navegación: `src/app`, layouts de `(auth)`, `(client)` y `(driver)`.
- Reglas y transacciones: `src/domain/rules.ts`, `engine.ts`, `fulfillment.ts`, `HandoffService.ts`.
- Estado/persistencia/simulaciones: `src/store/AppStore.tsx`.
- UI agrupada por capacidad: `src/features/`.
- Proveedores geográficos: `src/services/geo/`.
