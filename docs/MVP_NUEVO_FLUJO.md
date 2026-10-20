# LaundryApp: flujo cliente del MVP

Aplicación exclusiva de clientes en React Native y Expo. La navegación, los formularios y el dominio mantienen las dos modalidades vigentes: domicilio completo (`HOME_HOME`) y pick up (`HOME_STORE`), ambas con recogida en domicilio.

## Pantallas

| Área | Rutas y funciones |
| --- | --- |
| Acceso | Splash, Login, RegisterStep1; login del cliente y registro con contraseña propia |
| Verificación | KycUpload, KycSelfie, KycPending, KycRejected; documento, selfie, revisión y reenvío |
| Inicio | ClientHome; resumen del cliente y acceso a sus solicitudes |
| Solicitudes | ClientOrders, ClientNewOrderWizard, ClientOrderDetail, ClientSchedule; consulta, creación, cambios y cancelación |
| Seguimiento | ClientTracking, Chat; consulta de posición, contacto y mensajes de la solicitud |
| Cuenta | ClientProfile; nombre, correo, membresía, puntos y opciones de cuenta |
| Pagos | ClientWallet, ClientPaymentMethods, ClientAddPaymentMethod; saldo, recargas, tarjetas y cuentas bancarias |
| Datos | ClientAddresses, ClientBilling, ClientSecurity; direcciones, facturación y cambio de contraseña actual |
| Beneficios | ClientBenefits; promociones, recompensas y membresías |
| Atención | ClientNotifications, ClientSupport; notificaciones y ayuda |

La barra inferior conserva Inicio, Pedidos, Solicitar, Beneficios y Perfil. Solicitar abre el asistente Entrada → Salida → Prendas → Extras → Confirmación. Las pestañas mantienen filtros y búsquedas; los detalles se reutilizan y el retorno conserva su origen.

## Reglas conservadas

- Cupos y fechas en zona horaria de Guayaquil; salida posterior a entrada.
- Precio fijo por prendas o pago diferido hasta recibir peso certificado.
- Confirmación de peso y pago, aprobación/rechazo de ajustes, saldo y puntos sin doble aplicación.
- Cambios y cancelaciones con corte de 60 minutos; cargo tardío de $5 y bloqueo hasta regularizarlo.
- Códigos de recogida, entrega al cliente y retiro en sede; consulta de constancias anteriores.
- Métodos de pago, billetera, membresías, recompensas, direcciones y facturación independientes por cliente.

## Límites de responsabilidad

El cliente consulta los estados de la solicitud, la posición y el contacto del servicio asignado. Esos datos son un contrato de lectura y no habilitan acciones de ruta, disponibilidad, recogida, despacho o entrega. Los códigos internos de traslado a planta no pueden regenerarse desde esta app.

La app no dispone de herramientas para operar planta, certificar peso, asignar personal o consumir transferencias de custodia. Los escenarios locales ya contienen solicitudes en distintas etapas para probar las decisiones del cliente; no se incorporan controles operativos para avanzar esas etapas.

## Datos locales

AsyncStorage conserva `laundry.native-migration.v1` y el identificador nativo existente. La migración mantiene clientes, saldos, puntos, métodos de pago, solicitudes, comprobantes, mensajes, direcciones y agenda. Descarta cuentas ajenas a CLIENT y el antiguo estado operativo global; conserva la posición recibida como dato de seguimiento de cada solicitud.

No existe backend ni sincronización entre aplicaciones. Los pagos y la revisión de identidad continúan siendo simulaciones explícitas del MVP. Las fotos/documentos del cliente mantienen su servicio de almacenamiento.

## Validación

`npm run typecheck`, `npm test`, `npm run export:web`, `npm run export:android` y `npm run test:ui` comprueban tipos, reglas, persistencia, interfaces y empaquetado. Las comprobaciones de cámara, GPS y permisos físicos requieren dispositivo.
