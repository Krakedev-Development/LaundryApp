# Migración Android a Expo

La migración tomó como referencia el prototipo Kotlin recibido. Sus 30 rutas tienen una ruta correspondiente en `src/navigation/routes.ts` y un registro en `App.tsx` o `src/navigation/MainTabs.tsx`. El proyecto Android Studio original se eliminó después de la migración; las tablas siguientes conservan el inventario de pantallas y acciones implementadas en Expo. La aplicación y sus pruebas usan únicamente el código React Native de este repositorio.

## Pantallas y navegación

| Ruta del prototipo    | Implementación React Native                      | Comportamiento conservado                                                            |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Splash                | AuthScreens.tsx / SplashScreen                   | Introducción, logo, comenzar; accesible desde «Conocer Laundry» en login             |
| Login                 | AuthScreens.tsx / LoginScreen                    | Inicio cliente/chofer, accesos demo y recuperación mediante soporte                  |
| RegisterStep1         | AuthScreens.tsx / RegisterScreen                 | Nombre, correo, teléfono, contraseña y paso a KYC                                    |
| KycUpload             | AuthScreens.tsx / KycUploadScreen                | Tipo y número de documento, cámara o galería                                         |
| KycSelfie             | AuthScreens.tsx / KycSelfieScreen                | Captura o selección de selfie y envío                                                |
| KycPending            | AuthScreens.tsx / KycPendingScreen               | Espera de revisión, aprobación/rechazo demo, cierre de sesión                        |
| KycRejected           | AuthScreens.tsx / KycRejectedScreen              | Motivo de rechazo y reenvío                                                          |
| ClientHome            | ClientOrderScreens.tsx / ClientHomeScreen        | Solicitud dominante, cargos, saldo, puntos y accesos rápidos                         |
| ClientOrders          | ClientOrderScreens.tsx / ClientOrdersScreen      | Activos/historial, filtros de las cuatro modalidades                                 |
| ClientNewOrderWizard  | NewOrderScreen.tsx / NewOrderScreen              | Entrada, salida, prendas/peso, extras, confirmación y éxito                          |
| ClientBenefits        | AccountScreens.tsx / BenefitsScreen              | Promociones, recompensas, historial de canjes y membresías                           |
| ClientProfile         | AccountScreens.tsx / ClientProfileScreen         | Accesos de cuenta, identidad, puntos y cierre de sesión; datos personales en sidebar |
| ClientOrderDetail     | ClientOrderScreens.tsx / ClientOrderDetailScreen | Estados, precios, pagos, QR, ajustes, agenda, prendas, custodia e historial          |
| ClientTracking        | TrackingAndChatScreens.tsx / TrackingScreen      | Posición simulada, destino, chofer, vehículo, código y chat                          |
| Chat                  | TrackingAndChatScreens.tsx / ChatScreen          | Mensajes del pedido desde cliente o chofer, teclado y scroll                         |
| ClientWallet          | AccountScreens.tsx / WalletScreen                | Saldo, recargas, movimientos, métodos demo y pago de cargos                          |
| ClientAddresses       | AccountScreens.tsx / AddressesScreen             | Añadir, editar, eliminar y seleccionar dirección principal                           |
| ClientBilling         | AccountScreens.tsx / BillingScreen               | Nombre fiscal, identificación, correo, teléfono, dirección y guardado                |
| ClientNotifications   | AccountScreens.tsx / NotificationsScreen         | Notificaciones, lectura y enlace al pedido                                           |
| ClientSupport         | AccountScreens.tsx / SupportScreen               | Preguntas frecuentes y contacto con soporte                                          |
| ClientSecurity        | AuthScreens.tsx / PasswordScreen                 | Contraseña actual, nueva, confirmación y validación                                  |
| DriverRoute           | DriverScreens.tsx / DriverRouteScreen            | Estado operativo, siguiente servicio, paradas, mapa, chat y acción por estado        |
| DriverServices        | DriverScreens.tsx / DriverServicesScreen         | Servicios activos y próximos asignados al chofer                                     |
| DriverHistory         | DriverScreens.tsx / DriverHistoryScreen          | Finalizados, filtro hoy/semana/todos, acceso al detalle                              |
| DriverProfile         | AccountScreens.tsx / DriverProfileScreen         | Vehículo, placa, sede, zona, entregas; datos personales en sidebar                   |
| DriverServiceDetail   | DriverScreens.tsx / DriverServiceDetailScreen    | Destino, horario, instrucciones, prendas, acción y constancias                       |
| DriverMap             | TrackingAndChatScreens.tsx / DriverMapScreen     | Mapa, destino, Google Maps, Waze y chat                                              |
| DriverPickupConfirm   | DriverScreens.tsx / DriverPickupConfirmScreen    | Conteo, verificación, observaciones, evidencia y confirmación                        |
| DriverDeliveryConfirm | DriverScreens.tsx / DriverDeliveryConfirmScreen  | Nombre, relación, observaciones, evidencia y aceptación                              |
| DriverChangePassword  | AuthScreens.tsx / PasswordScreen forced          | Cambio obligatorio antes de ingresar a la ruta                                       |

La navegación reinicia la pila al cambiar cuenta, rol o estado de verificación, para impedir regresar a un flujo que ya no corresponda a la sesión. Las secciones principales usan el navegador oficial de pestañas de React Navigation con cambios sin animación lateral y estado persistente. El botón físico de Android vuelve a Inicio o Mi ruta desde una pestaña secundaria; los controles «Atrás» de detalles, mapas y formularios vuelven a su pantalla de origen. Abrir un destino existente reutiliza esa pantalla y evita duplicar el historial. Las pestañas conservan Inicio/Pedidos/Solicitar/Beneficios/Cuenta para cliente y Ruta/Servicios/Historial/Cuenta para chofer; Solicitar abre el asistente sobre la sección actual. Los detalles usan un fundido y los menús se cierran al perder foco.

## Repositorio y reglas de negocio

La traducción de `LaundryRepository.kt` está en `src/domain/repository.ts`. Cada acción opera sobre una copia del estado y solo se publica si termina; un error de saldo, cupo o código no descuenta dinero ni modifica el pedido. Los errores de almacenamiento permanecen visibles y admiten reintento.

| Acciones Kotlin                                      | Equivalente Expo                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| canCreateNewOrder, createOrder                       | canCreateNewOrder, createOrder; verificación, cargos, modalidad, reservas, precios, pago, puntos, notificación y códigos |
| approveAdjustment, rejectAdjustment                  | approveAdjustment con aceptar=true/false; cambio único de total y continuidad del tratamiento                            |
| confirmWeightAndPay                                  | confirmWeightAndPay; peso certificado, saldo o tarjeta demo, pago y puntos una sola vez                                  |
| changeOutboundMethod, rescheduleOrder                | changeLeg; cambio de entrada/salida, destino, horario, reservas, modo y códigos                                          |
| cancelOrder, payCustomerCharge                       | cancelOrder, payCustomerCharge; corte real de 60 minutos, $5 por cancelación tardía, bloqueo y regularización            |
| regenerateHandoffCode                                | regenerateHandoffCode; código manual y QR nuevos, solo para transferencias activas                                       |
| driverStartPickupNavigation                          | driverAction START_PICKUP                                                                                                |
| driverMarkArrivedPickup                              | driverAction ARRIVE_PICKUP                                                                                               |
| driverConfirmPickup                                  | driverConfirmPickup; conteo, notas, evidencia, custodia y notificación                                                   |
| driverStartHeadingFacility                           | driverAction GO_FACILITY                                                                                                 |
| driverConfirmAtFacility                              | driverAction ARRIVE_FACILITY; custodia, ingreso y disponibilidad                                                         |
| advancePlantOperation                                | advancePlantOperation; simulación local de recepción, pesaje, lavado, calidad y despacho/retiro                          |
| driverStartDeliveryNavigation                        | driverAction START_DELIVERY; activa código, registra despacho y bloquea cambios de salida                                |
| driverMarkArrivedDelivery                            | driverAction ARRIVE_DELIVERY                                                                                             |
| driverConfirmDelivery                                | driverConfirmDelivery; destinatario, relación, notas, foto, código usado, contador e historial                           |
| updateOrderStatus, updateTimelineForStatus           | event; conserva y añade eventos y notificaciones por transición                                                          |
| sendChatMessage                                      | sendChatMessage; rol y propietario del mensaje, persistencia por pedido                                                  |
| addWalletCredit, redeemReward, changeMembershipPlan  | addWalletCredit, redeemReward, changeMembershipPlan                                                                      |
| submitKyc, simulateKycApproval, simulateKycRejection | saveKycDocument, submitKyc, simulateKyc                                                                                  |
| setDriverOperationalStatus, setDriverPasswordChanged | setDriverOperationalStatus, changePassword forced                                                                        |
| addAddress, setDefaultAddress, removeAddress         | saveAddress, setDefaultAddress, removeAddress                                                                            |
| updateBillingData                                    | updateBillingData                                                                                                        |

Se conservan los 29 estados de `OrderStatus`, sus etiquetas, las cuatro modalidades, los dos modelos de precio, los estados de ajuste/cargo/KYC y los seis tipos de transferencia. Se mantienen las tres sedes, diez prendas, cinco servicios, cuatro extras, tres promociones, cuatro recompensas y tres membresías del Kotlin.

Se conservan el cliente María Elena Torres ($28.50, 1540 puntos), el chofer Carlos Mendoza (ABC-789, 34 entregas), los cinco pedidos originales (`SOL-4587`, `SOL-HS-001`, `SOL-SS-001`, `SOL-WEIGHT-001`, `SOL-ADJ-002`), movimientos, canjes, notificaciones y chat iniciales. `SOL-SH-001` añade una entrega lista para el chofer y completa la demostración de STORE_HOME, que el enum nativo admitía pero no tenía en sus cinco semillas.

La migración completa los controles que el prototipo solo simulaba: login y registro validan y guardan datos, la contraseña cambia realmente en la demo, la cámara/galería adjunta archivos, los QR se generan y pueden leerse, los cupos se reservan/liberan, la reprogramación valida el corte y los enlaces abren navegación externa. El camino original de confirmación mediante checklist se mantiene; introducir o escanear el código es opcional y, cuando se usa, debe ser correcto. Fotos de recogida y entrega opcionales, representadas con íconos de archivo adjunto.

## Recorridos de revisión

1. **Domicilio a domicilio:** nueva solicitud → entrada domicilio y cupo → salida domicilio y cupo → prendas → extras → pago. Cambia a chofer → navegación → llegada → conteo/checklist → recogida → planta. Desde detalle, usa la simulación de lavado/calidad/despacho. Chofer → navegación de entrega → llegada → destinatario y checklist → entrega e historial.
2. **Domicilio a sede:** mismo tramo de recogida y planta; al terminar calidad se activa QR de retiro. La simulación de retiro completa el pedido sin crear un servicio de entrega al chofer.
3. **Sede a domicilio:** ingreso mediante QR de entrega en sede y simulación de recepción; lavado/calidad/despacho; chofer ejecuta solo la entrega.
4. **Sede a sede:** entrega en recepción con QR → planta → QR de retiro → retiro y cierre; no aparece en las tareas del chofer.
5. **Por peso:** crea con estimado; no se descuenta saldo. Después de recepción, simula pesaje y registra libras. Cliente confirma el valor certificado y paga; continúa lavado. `SOL-WEIGHT-001` ya tiene 18.5 lb, 8.39 kg y $32.75 pendientes; recarga o usa tarjeta demo.
6. **Ajuste:** abre `SOL-ADJ-002`, aprueba +$4.50 (total $11.10) o rechaza para mantener $6.60 y el tratamiento original.
7. **Cargo:** cancela `SOL-4587`, cuya recogida está iniciada; aparece $5 en la billetera y la nueva solicitud queda bloqueada hasta regularizarlo.
8. **Identidad:** cierra sesión, registra una cuenta, adjunta documento y selfie, simula rechazo, reenvía y simula aprobación. La nueva cuenta tiene pedidos y saldo propios.
9. **Persistencia:** cambia dirección o facturación, recarga, envía mensajes y cierra/reabre. Se conservan los cambios. Un restablecimiento explícito vuelve a las semillas.

## Validación y límites

Resultado de revisión después del ajuste de navegación: 19 pruebas de dominio y persistencia aprobadas, 11 recorridos de interfaz aprobados en Microsoft Edge a 412 × 915, tipos correctos y exportaciones web y Android correctas. Las pruebas cubren las cuatro modalidades, el recorrido del chofer, KYC, persistencia, filtros al cambiar de pestaña, barra inferior estable, retorno desde seguimiento sin duplicar detalles y borrador conservado al abrir direcciones. Auditoría de las 30 rutas sin rutas faltantes y de exclusiones Git sin dependencias, secretos ni resultados generados entre los archivos nuevos del repositorio.

Expo Doctor completó 20 de 21 comprobaciones. La validación remota del esquema de configuración falló por una conexión TLS interrumpida con la API de Expo, también al reintentar. La configuración Expo no cambió durante este ajuste.

`npm run typecheck` revisa los tipos. `npm test` comprueba los recorridos de dominio, operaciones atómicas, pagos únicos, códigos, agenda renovable y persistencia. `npm run export:web` seguido de `npm run test:ui` comprueba los controles visibles a tamaño de teléfono. `npm run doctor` usa las APIs oficiales de Expo para verificar configuración y dependencias. `npm run export:android` genera el bundle Hermes Android.

Los permisos de cámara/galería, la lectura óptica de QR, el mapa nativo y la apertura de Google Maps/Waze deben revisarse en un teléfono o emulador. Esta máquina no tenía Java, Android SDK ni `adb` disponibles al iniciar la migración; la generación de APK requiere EAS o un entorno Android configurado. Un export Android exitoso no es una prueba de instalación de APK.

El alcance continúa siendo un MVP local: pagos y verificación simulados, posición demo y ausencia de backend compartido. Para desarrollo completo, reemplazar esas simulaciones por servicios y retirar los accesos demo, simulación de planta/KYC y restablecimiento del header. La lógica y sus pruebas se mantienen dentro de LaundryApp.
