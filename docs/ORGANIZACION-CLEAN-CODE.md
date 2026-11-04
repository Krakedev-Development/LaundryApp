# Organización y evolución estructural

Esta guía complementa `LaundryWeb/docs/CLEAN_CODE.md` con el estado de LaundryApp. No representa una refactorización ejecutada.

## Límites actuales

| Área | Responsabilidad actual | Observación |
|---|---|---|
| `src/app/` | Rutas y layouts Expo Router | Debe conservarse delgada y encargarse de navegación/guardas. |
| `src/features/` | Screens por flujo de usuario | Algunos archivos concentran varias vistas; descomponer por bloque/feature gradualmente. |
| `src/domain/` | Modelos, reglas, fulfillment, custodia y engine | Buen núcleo sin backend, pero `engine.ts` acumula muchos casos de uso. |
| `src/services/` | Semillas, seguridad local, repositorios y geo | Geo tiene proveedores intercambiables; pagos y mensajería reales aún no existen. |
| `src/store/AppStore.tsx` | Sesión, estado, persistencia y automatizaciones | Es punto de acoplamiento entre UI, reglas y timers demo. |
| `src/components/` / `theme/` | UI y tokens visuales | Evitar que componentes genéricos conozcan reglas comerciales. |

## Reglas de evolución

- Mantener una sola fuente por regla comercial y por transición de etapa.
- La pantalla solicita una acción a un servicio/caso de uso; no modifica entidades persistidas directamente salvo APIs bien delimitadas.
- Validar en dominio y, cuando haya backend, volver a validar en servidor. Las guardas de navegación son experiencia de usuario, no autorización.
- Mantener explícito si un proveedor es `demo`, `mock`, dispositivo o backend; no ocultar simulación tras nombres neutrales.
- Persistencia y migraciones deben versionarse y conservar historial. Un reset debe seguir claramente confinado a datos de demo.
- Hacer cambios por flujo con una prueba de dominio o interfaz existente como red de seguridad. Esta guía no solicita ni ejecuta pruebas.
- Mantener navegación accesible y diseño consistente usando componentes/token existentes antes de introducir variantes.

## Riesgos de acoplamiento a tratar

1. `DomainEngine` conoce pago local, custodia, despacho, puntos y timeline.
2. `AppStore` mezcla infraestructura (AsyncStorage/NetInfo/SecureStore) con procesos de negocio demo.
3. Los mocks de planta y despacho corren desde el Provider de UI, por temporizador.
4. `laundryWebSeed.json` duplica una instantánea; la sincronización del seed es manual y no sustituye contratos compartidos runtime.

No convertir cada carpeta en una capa vacía. Extraer solo unidades con responsabilidad y contrato identificables, empezando por casos que deban migrarse a backend o estén creciendo.

## Lecturas relacionadas

- [Propuesta de organización de módulos](PROPUESTA-ORGANIZACION-MODULOS.md)
- [Flujos y límites de demo](FLUJOS-APP-DEMO.md)
- [Revisión de reglas de negocio](REVISION-LOGICA-NEGOCIO.md)
- [Clean Code de LaundryWeb](../../LaundryWeb/docs/CLEAN_CODE.md)
