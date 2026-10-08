# Auditoría UX de LaundryApp

Se revisaron las 30 rutas, sus componentes y acciones antes de cambiar la interfaz. Stack: Expo SDK 57, React Native 0.86, TypeScript, React Navigation con pestañas y pila nativa. Los datos, reglas, autenticación y persistencia pertenecen a src/domain y src/store; permanecen fuera del rediseño. Cámara, QR, archivos, mapas y navegación externa conservan sus contratos.

## Inventario y decisiones

| Pantalla              | Clasificación inicial | Problema y tratamiento                                                              |
| --------------------- | --------------------- | ----------------------------------------------------------------------------------- |
| Splash                | Mejorable             | Beneficio breve, logo oficial y una acción                                          |
| Login                 | Crítico               | Accesos demo compiten con ingreso; agruparlos, validar campos y dar feedback        |
| RegisterStep1         | Mejorable             | Labels y validación contextual sin modificar reglas de registro                     |
| KycUpload             | Crítico               | Cuatro tipos, cámara, galería y demo simultáneos; selector y adjuntos resumidos     |
| KycSelfie             | Mejorable             | Priorizar envío, explicar evidencia y agrupar alternativas                          |
| KycPending            | Mejorable             | Estado claro; controles de simulación separados                                     |
| KycRejected           | Correcto              | Mantener motivo y acción de reenvío; semántica de error                             |
| ClientHome            | Crítico               | Demasiadas cards y acciones; estado activo, CTA y saldo compacto                    |
| ClientOrders          | Crítico               | Filtros permanentes y botones duplicados; búsqueda, panel y cards completas         |
| ClientNewOrderWizard  | Crítico               | Catálogo y franjas muy extensos; selección contextual, progreso y CTA fija          |
| ClientBenefits        | Crítico               | Filtros verticales y múltiples acciones; segmentos y opciones contextualizadas      |
| ClientProfile         | Crítico               | Cards administrativas; filas por tarea, datos personales solo en sidebar            |
| ClientOrderDetail     | Crítico               | Toda la información simultánea; alertas prioritarias y secciones desplegables       |
| ClientTracking        | Crítico               | Mapa pequeño, QR y datos compiten; mapa y resumen con panel contextual              |
| Chat                  | Mejorable             | Tokens, teclado, feedback y lista virtualizada                                      |
| ClientWallet          | Crítico               | Recargas, cargos y movimientos mezclados; saldo, recarga contextual e historial     |
| ClientAddresses       | Crítico               | Edición y eliminación sin jerarquía; formulario separado y confirmación destructiva |
| ClientBilling         | Mejorable             | Agrupar intención, validar contacto y fijar guardar                                 |
| ClientNotifications   | Crítico               | Cards extensas; filas legibles, estado leído y lista virtualizada                   |
| ClientSupport         | Mejorable             | Acordeones reutilizables y contacto único                                           |
| ClientSecurity        | Mejorable             | Validación inline, foco y resultado de cambio                                       |
| DriverRoute           | Crítico               | Estado operativo y varias tareas compiten; próxima parada y acción contextual       |
| DriverServices        | Mejorable             | Segmentos, búsqueda y lista virtualizada                                            |
| DriverHistory         | Mejorable             | Filtro compacto, búsqueda y estados vacíos útiles                                   |
| DriverProfile         | Mejorable             | Información operativa agrupada sin duplicar perfil personal                         |
| DriverServiceDetail   | Crítico               | Mapa, prendas y constancias compiten; próxima acción y detalle desplegable          |
| DriverMap             | Crítico               | Navegadores compiten y mapa secundario; mapa dominante y alternativas accesibles    |
| DriverPickupConfirm   | Crítico               | Campos opcionales compiten con conteo; agrupar evidencia y código                   |
| DriverDeliveryConfirm | Crítico               | Relación y extras extensos; selector y confirmación clara                           |
| DriverChangePassword  | Correcto              | Conservar bloqueo obligatorio, reforzar validación y feedback                       |

## Criterios transversales

- Un sistema de tokens y componentes; íconos Ionicons y logos existentes.
- Pestañas persistentes y pila de detalles: no volver al historial acumulativo.
- Un solo host de overlays: no presentar modales sobre otros modales.
- Información complementaria desplegable, sin eliminar acciones ni simular datos nuevos.
- Foco visible, controles de al menos 48 puntos, estados textuales y movimiento reducido.
- Listas virtualizadas; ningún refresco o estado de conexión ficticio: el MVP usa datos locales.
- Feedback táctil solo para selección y resultados significativos, aislado en Expo Haptics.
- Verificación: dominio/persistencia, recorridos UI, tipos y exportaciones; controles físicos en dispositivo.

## Resultado de la implementación

Se conservan las 30 rutas originales. ClientSchedule añade una pantalla de edición de agenda; no añade reglas ni datos. Las acciones que antes se mostraban simultáneamente ahora tienen estos accesos:

| Función conservada                    | Acceso actual                                                      |
| ------------------------------------- | ------------------------------------------------------------------ |
| Crear solicitud                       | CTA de Inicio, acción Solicitar en barra y menú                    |
| Filtros de pedidos                    | Segmentos y panel de modalidad; búsqueda persistente               |
| Dirección, sede y franjas             | Filas del wizard que abren paneles                                 |
| Servicio y pago                       | Selectores del wizard; precios, prendas y extras conservados       |
| Código QR/manual y regeneración       | Mostrar código en pedido; selector en resumen de seguimiento       |
| Direcciones y constancias             | Acordeón del pedido; constancias del servicio del chofer           |
| Historial de estados y transferencias | Acordeones del pedido                                              |
| Reprogramar/cambiar modalidad         | Opciones de solicitud → pantalla dedicada                          |
| Cancelar solicitud                    | Opciones de solicitud → confirmación con regla/cargo existente     |
| Recargar saldo                        | Billetera → panel de recarga, sin procesamiento ficticio           |
| Editar/principal/eliminar dirección   | Opciones de dirección → formulario/acción/confirmación             |
| Tipo de documento, fotos y selfie     | Selectores y adjuntos con cámara/galería originales                |
| KYC demo y planta                     | Grupos explícitos, conservando todos los avances                   |
| Estado operativo                      | Mi ruta → Cambiar disponibilidad                                   |
| Recogida/entrega                      | Confirmación fija; observaciones, evidencia y códigos desplegables |
| Persona que recibe                    | Selector de relación en confirmación de entrega                    |
| Notificaciones                        | Todas/Sin leer, lectura y acceso al pedido                         |
| Google Maps, Waze y chat              | Mapa/servicio y contacto contextual                                |
| Roles demo y reset                    | Menú → Herramientas de demostración                                |
| Perfil personal                       | Únicamente sidebar con nombre, rol y correo                        |

## Trazabilidad de los 24 entregables

| Entregables de la especificación                          | Implementación                                                                           |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1–2. Sistema y tokens                                     | design-system/tokens.ts, ui.tsx, presentation.tsx                                        |
| 3–6. Navegación, home, flujos, cards                      | MainTabs existente, Page compacto, Home, wizard y OrderCard/OrderList                    |
| 7–8. Sheets y modales                                     | OverlayProvider/Host/Portal con una sola presentación activa                             |
| 9. Formularios                                            | Cinco pasos, dos etapas KYC, agrupaciones y footer fijo                                  |
| 10–14. Loading, skeleton, empty, error, success           | Button/busy, Skeleton, Empty, Field, useAction y avisos globales/en panel                |
| 15–19. Interacción, transiciones, tacto, botones, cambios | MotionSection, stack condicionado por Reduce Motion, interaction.ts, Button y StatusChip |
| 20–21. Accesibilidad y Reduce Motion                      | Objetivos de 48 puntos, roles/labels/estados, AccessibilityInfo y media query            |
| 22–24. Reutilización, documentación y extensión           | Componentes comunes, catálogo **DEV**, DESIGN_SYSTEM.md y separación del dominio         |

## Validación final

- 19/19 pruebas de dominio y persistencia aprobadas.
- 24/24 recorridos de UI aprobados en Edge sobre el export final, incluidas cuatro modalidades, KYC, contraseña temporal, recogida/planta/entrega, reprogramación, QR, pago por peso, recarga con doble toque, cancelación, dirección, filtros, soporte y chat.
- Adaptación y movimiento reducido comprobados a 320×640, 412×915 y 768×1024; revisión visual de capturas en móvil pequeño y tablet.
- TypeScript sin errores; bundles web y Android exportados.
- Expo Doctor: 21/21 comprobaciones aprobadas.
- Hashes de los 17 archivos de dominio, store, servicios y assets iguales a la auditoría inicial.
- Generados, pruebas visuales, cachés y dependencias excluidos por .gitignore; no se agregan directorios de Android Studio.
- La exportación Android no equivale a probar el APK en hardware. Cámara/galería, haptics, TalkBack/VoiceOver y arrastre del panel requieren validación en dispositivo.

El alcance local del MVP continúa: no se añadieron backend, GPS real, ETA, recarga bancaria, sincronización entre dispositivos ni estados de red ficticios.
