# Design System de LaundryApp

## Alcance y arquitectura

Este rediseño conserva las rutas originales y agrega ClientSchedule para editar una agenda, además de pantallas independientes para consultar y registrar métodos de pago. Autenticación, verificación KYC obligatoria, contraseña temporal, dos modalidades vigentes (domicilio completo y pick up), precios por prenda/peso, cupos, cobros, cancelación, transferencias de prendas, evidencias, puntos, membresías y chat mantienen sus contratos. La gestión de tarjetas y cuentas bancarias se guarda en el dominio y el store existentes, sin modificar assets ni ejecutar pagos reales.

La auditoría previa está en [UX_AUDIT.md](UX_AUDIT.md). La [matriz funcional del MVP](MVP_NUEVO_FLUJO.md) sigue describiendo las reglas del producto. La lógica permanece separada de la presentación.

## Tokens

Solicitud agendada mantiene la pantalla de resultado vigente y usa `ScheduledPresentation.tsx` para presentar el visto verde, título centrado, identificador y resumen en tarjeta blanca. La paleta y las superficies provienen de la confirmación de `4fa1bd3`, que finalizaba con un aviso de pago exitoso en lugar de una pantalla equivalente. El visto confirma la creación de la solicitud; el mensaje de pago por peso sigue pendiente del pesaje. Los datos, creación única y accesos Ver mi solicitud/Volver al inicio conservan sus callbacks y navegación actuales.

Confirmación de Nueva solicitud recupera de `4fa1bd3` las tarjetas blancas compactas, agenda con divisores, promoción en fila, descuento verde y total azul. `ConfirmationPresentation.tsx` concentra su presentación. PricingSummary usa la apariencia `confirmation` únicamente en este paso; sus demás usos conservan el diseño actual. Agenda, promociones, importes, membresía, envío, métodos de pago, monto pendiente por peso y creación del pedido conservan sus datos y callbacks. La confirmación permanece en el footer fijo, sin restaurar la pasarela ni los datos simulados del commit histórico.

Prendas y Extras de Nueva solicitud recuperan de `4fa1bd3` el fondo blanco, filas gris claro con íconos, cantidades destacadas y tarjetas de extras con acentos azul, rosa, violeta y verde. `GarmentsExtrasPresentation.tsx` concentra la presentación. El catálogo completo, precios por unidad, tiempos, servicios, cantidades, validación de peso y selección de extras siguen siendo los actuales. Check admite contenido visual opcional conservando su rol, selección y callback. El guardado, cálculo, promociones y paso de Confirmación no cambian; Entrada/Salida y el calendario conservan su presentación vigente.

Fecha y franja horaria de Nueva solicitud presenta `ScheduleCalendar` dentro del mismo panel de Entrada/Salida. Recupera de `4fa1bd3` la navegación mensual, encabezados de semana y día seleccionado en azul. Se puede navegar libremente entre meses y años; únicamente se pueden seleccionar las fechas vigentes de FulfillmentPicker. Seleccionar un día ejecuta el mismo cambio de fecha y limpieza de franja; elegir horario conserva disponibilidad, cupos y cierre. No se agrega una confirmación intermedia ni otro modal. Reprogramación conserva la lista de fechas actual.

Entrada y Salida de Nueva solicitud usan la apariencia `request` de FulfillmentPicker, con fondo blanco, filas de ubicación/horario y selección azul suave tomadas de `4fa1bd3`. `FulfillmentPresentation.tsx` concentra las superficies y el botón de avance azul. Los paneles vigentes conservan sus opciones, fechas, cupos y cierre; las variantes visuales de Choice y SegmentedControl se aplican únicamente donde se solicitan. Entrada sigue siendo recogida a domicilio; Salida conserva domicilio o pick up. Estado, validaciones, limpieza al cambiar modalidad, notas, progreso y pasos posteriores siguen en el flujo actual. Reprogramación conserva la apariencia predeterminada del selector compartido.

Detalle de solicitud recupera de `4fa1bd3` el resumen blanco con borde de radio 14, secciones compactas, novedades ámbar y presentación del chofer con ícono del sistema. `OrderDetailPresentation.tsx` contiene sus estilos. Agenda, prendas, pago, historial y transferencias conservan sus acordeones independientes; las condiciones, datos, callbacks, códigos, pesaje, ajustes, cancelación y agenda siguen en el flujo vigente. Las acciones de mapa y chat se presentan juntas cuando corresponden, con el header y navbar actuales.

Pedidos usa la apariencia `orders` de OrderCard, transmitida por OrderList únicamente desde ClientOrdersScreen. `OrdersPresentation.tsx` recupera de `4fa1bd3` las tarjetas blancas compactas, identificador gris, estado junto al encabezado, íconos de información y pie con divisor. Se mantienen el texto completo de modalidad y servicio, fecha/horario, importe pendiente o confirmado y seguimiento cuando corresponde. Búsqueda, Activos/Historial, filtros, datos, listas virtualizadas y navegación conservan su lógica vigente. Inicio y las listas del chofer conservan sus apariencias actuales, al igual que el header y navbar.

Datos de facturación recupera de `4fa1bd3` la introducción azul suave con ícono de documento, la tarjeta blanca de radio 14 y los campos gris claro con etiquetas compactas. `BillingPresentation.tsx` concentra los estilos; `src/screens/billing/BillingScreen.tsx` conserva los cinco campos, su carga inicial, validación y guardado en el dominio vigente. La acción permanece en el footer fijo y el header y navbar actuales permanecen iguales.

Direcciones guardadas recupera de `4fa1bd3` las filas blancas compactas, los íconos de casa/trabajo, el borde azul y distintivo de la dirección principal y el alta con borde discontinuo. `AddressesPresentation.tsx` contiene la presentación y `src/screens/addresses/AddressesScreen.tsx` conserva el formulario vigente con referencia y coordenadas, las opciones en sheet y la confirmación de eliminación. Las direcciones y referencias se muestran completas; el header y navbar actuales permanecen iguales. No se incorpora el mapa ni la lógica del prototipo histórico.

Seguridad y contraseña recupera de `4fa1bd3` el aviso azul suave con escudo, la tarjeta blanca con borde y los campos gris claro con etiquetas compactas. `PasswordPresentation.tsx` concentra su presentación y `PasswordScreen` conserva validaciones, hash, persistencia, feedback y el botón de guardado en el footer actual. El formulario compartido de contraseña temporal mantiene sus condiciones y cierre de sesión. `Field.labelStyle` permite adaptar las etiquetas únicamente donde se solicita; los demás campos conservan su presentación y los colores de error siguen siendo prioritarios.

Ayuda y soporte recupera de `4fa1bd3` las secciones con títulos compactos, la tarjeta blanca de contacto con ícono azul y las preguntas agrupadas con divisores. `SupportPresentation.tsx` contiene los estilos; `src/screens/support/SupportScreen.tsx` conserva la acción de correo vigente y `faqs.ts` las seis preguntas actuales. La apariencia `list` de Accordion permite esta agrupación y conserva la apertura independiente, el estado inicial cerrado y la respuesta a movimiento reducido. El header y navbar actuales permanecen iguales.

Notificaciones conserva sus filtros Todas/Sin leer y las acciones de lectura y navegación al pedido. `NotificationsPresentation.tsx` recupera las tarjetas compactas de `4fa1bd3`, con fondo azul suave y un punto para avisos pendientes, íconos por categoría y hora discreta. Se mantiene el texto completo y el botón de acción actual. La pantalla se ubica en `src/screens/notifications/NotificationsScreen.tsx`, y el header y navbar vigentes permanecen iguales.

Recargas mantiene el panel contextual de `WalletScreen` y sus cuatro montos vigentes. `RechargePresentation.tsx` recupera de `4fa1bd3` el saldo azul suave, los montos en tarjetas seleccionables, el campo con símbolo de moneda y el resumen del monto. La confirmación y su feedback se presentan en el footer fijo del panel. La selección, monto inicial, validaciones, acreditación y persistencia permanecen en el flujo actual; la billetera principal y la gestión independiente de métodos de pago conservan su presentación.

Métodos de pago tiene su propia ruta `ClientPaymentMethods`, independiente de `ClientWallet`. `PaymentsPresentation.tsx` recupera las filas blancas con borde y marca de tarjeta, el distintivo Principal y la vista previa azul del alta de tarjeta de `4fa1bd3`. `ClientAddPaymentMethod` permite guardar una tarjeta o una cuenta bancaria del cliente para transferencia. La billetera conserva su presentación anterior, saldo, cargos, recargas y movimientos; sus reglas financieras y las opciones de pago del pedido no cambian.

El contenido recupera el estilo del commit `4fa1bd3` (`chore: upgrade Expo SDK and dependencies, update app icons, and configure plugins`) mediante `src/design-system/classic.ts`. Se toman sus colores de marca, superficies, tipografía compacta, tarjetas con sombra, chips y acentos de promociones y se aplican a las pantallas del flujo actual.

`src/design-system/tokens.ts` conserva los valores actuales del header y navbar, además de los contratos de movimiento, tamaños táctiles y layout. `ui.tsx` mantiene `colors` para estos elementos y exporta `contentColors` para el contenido. `chromeRow` y `chromeSubtitle` conservan el espaciado y texto del header; el logo mantiene archivo y dimensiones actuales. El commit de referencia no modifica rutas, stores, modelos, datos ni dependencias de la versión vigente.

| Grupo       | Valores y criterio                                                                     |
| ----------- | -------------------------------------------------------------------------------------- |
| Marca       | Azul #143F73, azul oscuro #0F315A, verde #A5CD39, aqua #61BFC7                         |
| Superficies | Fondo #F7F9FC, superficie #FFFFFF, suave #E8EEF5                                       |
| Texto       | Principal #1F2937, secundario #6B7280, títulos #111827                                 |
| Estados     | Success, warning, danger, info y fondos correspondientes; siempre con texto/ícono      |
| Tipografía  | Display 28/36, título 22/29, sección 17/24, cuerpo 14/21, secundario y caption 12/18   |
| Espaciado   | 4, 8, 12, 16, 20, 24, 32 y 40 puntos; margen del contenido 16                          |
| Radios      | Campos 8, tarjetas y botones 12, promociones 16, paneles 24 y chips de estado redondos |
| Interacción | Objetivo táctil mínimo 48; botones 52 puntos                                           |
| Ancho       | Contenido máximo 780; panel máximo 600                                                  |
| Movimiento  | 140/220/280/300 ms; búsqueda 250 ms; aviso 6000 ms                                     |
| Capas       | Contenido, feedback, overlay; sombras suaves disponibles                               |

La tarjeta estándar usa padding 16, separación 8 y sombra de opacidad .06, radio 8 y elevación 2. La billetera usa azul suave; las promociones recuperan azul, aqua y verde. Los colores se adaptan a las etapas vigentes: lavado/control en violeta, salida/listo en verde, finalizado en gris y atención en ámbar. Sus etiquetas y condiciones de negocio permanecen actuales.

Inicio aplica el tratamiento de las tarjetas destacadas de `4fa1bd3` a su presentación vigente: cabecera azul de 16 puntos de radio, título blanco de 22 puntos, acción con fondo translúcido y resumen blanco compacto de saldo/puntos con divisor. HomePresentation solo recibe valores y callbacks de ClientHomeScreen. La apariencia `home` de OrderCard usa fondo #EFF6FF, borde #BFDBFE y título compacto; su apariencia predeterminada conserva el diseño del resto de las pantallas. Se mantienen todos los campos del pedido, los accesos existentes, los avisos de cargos y el estado vacío. El nombre y correo permanecen en Cuenta y el header y navbar actuales no cambian.

Beneficios recupera el diseño de PromoDetailModal, RewardsModal y SubscriptionsScreen del mismo commit mediante BenefitsPresentation. Promociones conserva los colores oficiales en sus cabeceras y presenta las condiciones en un cuerpo blanco; la primera tarjeta ocupa todo el ancho y las siguientes se distribuyen en dos columnas cuando hay espacio. Recompensas usa resumen ámbar, puntos destacados e íconos azules, conservando canjes e historial. Membresía usa bordes de dos puntos, precios destacados, beneficios con íconos y distintivo del plan actual; Básico es gris, Estándar azul y Premium violeta. El selector actual de tres apartados permanece igual. Se conservan el catálogo vigente, precios, costos, fechas, códigos, aprobación de canjes, reglas de disponibilidad y callbacks; los modales y las reglas del prototipo anterior se usan únicamente como referencia visual.

darkTheme contiene la paleta semántica equivalente. La app mantiene el tema claro declarado en Expo; todavía no expone un interruptor de tema. Para activar oscuro en el futuro, conectar ambos themes a un ThemeProvider y configurar StatusBar y mapas con la misma selección. Los QR deben conservar fondo blanco.

Los logos oficiales se conservan. Personas, documentos y evidencias se representan mediante Ionicons. No se agregan imágenes, emojis, testimonios, calificaciones, tiempos estimados ni datos inventados.

## Componentes y estados

- Card, Title, Body, Badge: superficies y jerarquía. Las cards agrupan tareas relacionadas.
- Button: primary, secondary, ghost y danger; normal, presionado, deshabilitado y busy. Indicador de carga solo durante trabajo asincrónico real.
- IconButton: acciones compactas con nombre accesible y objetivo de 48 puntos.
- Field: label permanente, foco visible, ayuda, error junto al campo, teclado adecuado, validación tras salir del campo y corrección al escribir; mostrar/ocultar contraseña. validate permite reglas explícitas del formulario; el dominio conserva la validación final.
- Choice y Check: selección con texto, ícono y estado accesible; ARIA explícita en web.
- ListItem: acceso por tarea y resumen, evitando una columna de botones.
- SegmentedControl: categorías cortas. No usarlo para listas extensas.
- SearchField/useSearch: búsqueda local con debounce, limpieza y resultados vacíos.
- Stepper: etapa actual, total y barra accesible.
- Accordion: información complementaria bajo una acción explícita. No ocultar decisiones pendientes.
- StatusChip: estados operativos con semántica visual y transición al cambiar.
- Timeline: eventos y fechas existentes, ordenados como los proporciona el dominio.
- OrderCard/OrderList: card completa pulsable y listas virtualizadas con claves estables.
- Skeleton: carga inicial real de persistencia; sin demoras artificiales ni animación perpetua.
- Empty: mensaje concreto y acción de recuperación cuando corresponde.
- useAction: errores humanos, confirmación visible y exclusión de envíos asincrónicos simultáneos. Las operaciones síncronas siguen siendo transacciones del dominio.
- HandoffCard/HandoffCodeSheet: código a demanda, QR/manual y regeneración con feedback.

Perfil no presenta herramientas de demostración ni acceso al catálogo de componentes.

## Navegación

ClientMainTabs conserva Inicio, Pedidos, Beneficios y el acceso a la cuenta, rotulado Perfil en la barra. Solicitar inicia el flujo guiado desde el botón circular central azul con signo verde, sin texto visible y con nombre accesible Solicitar. DriverMainTabs conserva Mi ruta, Servicios, Historial y Perfil, sin añadir acciones de cliente. Cambiar de pestaña conserva búsqueda, filtros y estado de la sección. Los detalles usan la pila nativa existente y se reutilizan por orderId.

La barra inferior sigue la referencia adjunta: fondo blanco, íconos de 16 puntos y etiquetas de 10 puntos; la selección se identifica con azul, ícono con relleno y texto más marcado, sin rellenar la celda. Inicio, Pedidos, Beneficios y Perfil usan sus íconos de contorno cuando están inactivos y sus variantes con relleno al seleccionarse. Beneficios conserva el regalo y Perfil usa la persona; el estado de Perfil también es consistente en la barra del chofer. El botón central tiene diámetro de 48 puntos y sombra suave; las áreas de interacción conservan al menos 48 puntos y el safe area inferior. NavigationBar comparte esta presentación entre secciones principales y pantallas secundarias. Se mantienen los destinos, el evento tabPress, la respuesta háptica y la lógica de selección existentes.

La app móvil no presenta menú lateral. El header de secciones principales conserva el logo oficial centrado y el acceso a notificaciones del cliente. Las pantallas secundarias muestran Atrás, título y notificaciones cuando corresponden. La barra inferior conserva los accesos principales y Cuenta agrupa las opciones de cuenta.

El perfil de Cuenta muestra el nombre y correo de la cuenta activa, sin mostrar su rol, tanto para cliente como para chofer. Se conserva el estilo centrado del commit `4fa1bd3`, el logo oficial y los estados de verificación/disponibilidad vigentes. Los datos se leen del store actual, incluyendo cuentas registradas por el usuario.

La solicitud conserva Entrada → Salida → Prendas → Extras → Confirmación. La CTA permanece al pie, no habilita pasos incompletos y el contenido vuelve arriba al cambiar de etapa. Atrás del header/Android retrocede una etapa; se deshabilita el gesto de salida de iOS durante el wizard para evitar abandonarlo involuntariamente. Al terminar se mantiene el resultado con acceso al pedido.

ClientSchedule recibe orderId, edita entrada/salida con las mismas reglas de corte/cupos y vuelve al detalle existente después de guardar. Los formularios de registro, seguridad, facturación, dirección y confirmaciones del chofer usan acciones fijas cuando su extensión lo requiere.

## Paneles y confirmaciones

OverlayProvider ofrece un único Modal nativo mediante OverlayHost. BottomSheet, ConfirmDialog y FullScreenOverlay son los portales activos; los consumidores no crean Modal adicionales. La app no usa el portal Drawer para navegar ni presentar el perfil.

- Sheet: selección de dirección/sede, fecha/horario, servicio, pago, filtros, disponibilidad, relación del destinatario y adjuntos.
- Dialog: cancelación, eliminación de dirección y restablecimiento demo.
- Full: formularios de dirección, cámara QR y catálogo de desarrollo.

Solo existe una presentación activa. Una nueva presentación cierra la anterior y todos los portales se retiran al salir de la pantalla. Las opciones se cierran antes de navegar, abrir la cámara/galería o confirmar una acción. Los propietarios del estado de paneles sucesivos deben permanecer en la pantalla: por ejemplo, el código del seguimiento se presenta desde TrackingScreen después de cerrar el resumen, evitando perder su estado al desmontar el contenido del panel anterior.

Los sheets tienen cierre explícito, backdrop, botón Atrás/Escape y arrastre hacia abajo desde el tirador. Se protege el scroll del contenido capturando el gesto solo en el tirador. Las confirmaciones destructivas requieren elección explícita y no se aceptan tocando fuera. El contenido tiene scroll, safe areas y footer independiente. El feedback de éxito se muestra dentro del panel si sigue abierto, o como aviso flotante al cerrarlo.

## Motion y hápticos

MotionProvider escucha AccessibilityInfo y prefers-reduced-motion en web. Con movimiento reducido, las transiciones nativas se desactivan, los paneles/contenidos aparecen sin desplazamiento ni duración y el retorno del tirador no usa resorte. Chat desplaza sin animación y el seguimiento simulado deja de mover el marcador.

MotionSection usa entrada por opacidad y desplazamiento de 8 puntos durante 220 ms, aplicada a cambios de paso, contenido desplegado y estados. Los paneles entran 32 puntos/300 ms. No hay loops decorativos.

interaction.ts encapsula Expo Haptics, compatible con SDK 57. Solo usa selección y notificación de resultado; omite web y absorbe la falta de soporte del dispositivo. No se añadieron Reanimated, Gesture Handler ni otro framework de overlays: Animated/PanResponder y la navegación existente cubren estos patrones.

## Datos, feedback y rendimiento

El MVP usa AsyncStorage local. No se agregan pull-to-refresh, indicadores de conexión, respuestas de chat, spinners de red ni ETA ficticios. Las listas reaccionan a cambios reales del store; la renovación de agenda al volver al primer plano sigue en AppProvider.

Listas de solicitudes, servicios, historial, movimientos, notificaciones y chat usan FlatList fuera de un ScrollView padre. El seguimiento solo ejecuta su simulación cuando está visible, el tramo está en camino y el usuario permite movimiento. El mapa es dominante y conserva la advertencia demo y los enlaces reales de Google Maps/Waze.

Las herramientas de demostración se retiraron del perfil de cliente y chofer. Los accesos de cliente demo y chofer demo permanecen en el login. El alcance local del prototipo se conserva.

## Accesibilidad y adaptación

Labels explícitos, títulos semánticos, estados de selección/expansión/deshabilitado, aviso vivo, foco del header de modal y controles táctiles de 48 puntos. Los campos conservan el texto escrito al corregir errores. Text permite escalado del sistema. Los estados combinan texto e ícono y no dependen solo del color.

SafeAreaProvider/Page/OverlayHost protegen header, barra y footer. El teclado se maneja con KeyboardAvoidingView en iOS y scroll del formulario. Contenido acotado en tablet; texto flexible y filas compactas en móvil pequeño.

La validación automatizada usa el export web en Edge, tamaños 320×640, 412×915 y 768×1024, preferencia de movimiento reducido y recorridos reales del MVP. La exportación Android valida el bundle nativo. Cámara, selector de fotos, hápticos, TalkBack/VoiceOver, teclado físico y gesto del tirador en Android/iOS requieren validación adicional en dispositivo; no se presentan como comprobados físicamente.

## Extender el sistema

Agregar pantallas a Routes, titles y el stack correspondiente; mantener el dominio fuera del componente visual. Usar Page/footer y componentes existentes antes de crear variantes nuevas. Pasar validate a Field para reglas de un nuevo formulario. Usar tokens semánticos para futuras superficies/estados. Mantener al propietario de estado fuera del contenido de un overlay que pueda reemplazarse.

Si se conecta un backend, implementar carga, error/reintento, sincronización y refresh de sus solicitudes reales en la capa de datos; no fabricar esos estados en la vista. Mantener idempotencia del dominio y claves estables de listas. Los servicios nativos permanecen encapsulados en src/services.

Referencias: [React Navigation](https://reactnavigation.org/docs/bottom-tab-navigator/), [accesibilidad React Native](https://reactnative.dev/docs/accessibility), [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/).
