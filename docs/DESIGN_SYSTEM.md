# Design System de LaundryApp

## Alcance y arquitectura

Este rediseño conserva las 30 rutas originales y agrega ClientSchedule para editar una agenda en una pantalla dedicada. No modifica src/domain, src/store, src/services ni assets. Autenticación, verificación KYC obligatoria, contraseña temporal, dos modalidades vigentes (domicilio completo y pick up), precios por prenda/peso, cupos, cobros, cancelación, transferencias, evidencias, puntos, membresías y chat mantienen sus contratos.

La auditoría previa está en [UX_AUDIT.md](UX_AUDIT.md). La [matriz funcional del MVP](MVP_NUEVO_FLUJO.md) sigue describiendo las reglas del producto. La lógica permanece separada de la presentación.

## Tokens

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

En desarrollo, Cuenta → Herramientas de demostración → Catálogo de componentes permite inspeccionar variantes, selección, validación, carga y estados. Está condicionado por **DEV** y no altera datos del producto.

## Navegación

ClientMainTabs conserva Inicio, Pedidos, Beneficios y Cuenta; Solicitar inicia el flujo guiado desde la barra. DriverMainTabs conserva Mi ruta, Servicios, Historial y Cuenta. Cambiar de pestaña conserva búsqueda, filtros y estado de la sección. Los detalles usan la pila nativa existente y se reutilizan por orderId.

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

Las acciones de demostración se agrupan en Cuenta → Herramientas de demostración mediante AccountDemoTools. Cambio de cuenta demo, reset con confirmación y catálogo de desarrollo conservan su comportamiento; los paneles se cierran al salir de Cuenta. Estas opciones deben retirarse al conectar el producto a servicios de producción. El rediseño no cambia el alcance local del prototipo.

## Accesibilidad y adaptación

Labels explícitos, títulos semánticos, estados de selección/expansión/deshabilitado, aviso vivo, foco del header de modal y controles táctiles de 48 puntos. Los campos conservan el texto escrito al corregir errores. Text permite escalado del sistema. Los estados combinan texto e ícono y no dependen solo del color.

SafeAreaProvider/Page/OverlayHost protegen header, barra y footer. El teclado se maneja con KeyboardAvoidingView en iOS y scroll del formulario. Contenido acotado en tablet; texto flexible y filas compactas en móvil pequeño.

La validación automatizada usa el export web en Edge, tamaños 320×640, 412×915 y 768×1024, preferencia de movimiento reducido y recorridos reales del MVP. La exportación Android valida el bundle nativo. Cámara, selector de fotos, hápticos, TalkBack/VoiceOver, teclado físico y gesto del tirador en Android/iOS requieren validación adicional en dispositivo; no se presentan como comprobados físicamente.

## Extender el sistema

Agregar pantallas a Routes, titles y el stack correspondiente; mantener el dominio fuera del componente visual. Usar Page/footer y componentes existentes antes de crear variantes nuevas. Pasar validate a Field para reglas de un nuevo formulario. Usar tokens semánticos para futuras superficies/estados. Mantener al propietario de estado fuera del contenido de un overlay que pueda reemplazarse.

Si se conecta un backend, implementar carga, error/reintento, sincronización y refresh de sus solicitudes reales en la capa de datos; no fabricar esos estados en la vista. Mantener idempotencia del dominio y claves estables de listas. Los servicios nativos permanecen encapsulados en src/services.

Referencias: [React Navigation](https://reactnavigation.org/docs/bottom-tab-navigator/), [accesibilidad React Native](https://reactnative.dev/docs/accessibility), [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/).
