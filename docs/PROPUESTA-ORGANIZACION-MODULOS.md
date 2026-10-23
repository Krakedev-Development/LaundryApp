# Propuesta de organización de módulos

## Estado actual

El árbol ya distingue `app` (rutas/layouts), `features` (pantallas por capacidad), `domain` (modelos, reglas y engine), `services` (repositorios/geo/semillas), `store` y `components`. La separación ofrece una base razonable, pero hay concentraciones importantes: `DomainEngine` centraliza pedidos, asignación, eventos, pagos demo y puntos; `AppStore` administra sesión, persistencia, KYC, sincronización simulada y timers; varios `features/*/screens.tsx` contienen pantallas extensas.

La recomendación no es mover archivos por estética. Debe conservarse el comportamiento, fijar primero contratos y separar por responsabilidad cuando haya una siguiente intervención funcional.

## 1. Delimitar dominio de pedido y servicios de aplicación

**Propuesta:** mantener reglas puras de precios/agenda en `domain/orders`, el ciclo/estado en `domain/fulfillment`, custodia en `domain/handoffs`, y beneficios/ledger en `domain/benefits`. Extraer de `DomainEngine` casos de uso pequeños que compartan una interfaz transaccional, no acceso directo a arrays globales.

**Beneficio:** es más fácil probar y luego sustituir persistencia local por API sin duplicar reglas. Mantener un solo lugar para cada transición; no permitir que UI modifique entidades operativas con `engine.update` de forma arbitraria.

## 2. Separar plataforma y sesión del estado de negocio

`AppStore` junta hidratación/migración, login y KYC, NetInfo, persistencia y temporizadores de despacho/planta/tracking. Evolución sugerida:

- `SessionService`: interfaz actual local y futura autenticación remota.
- `AppRepository`: carga, persistencia y migraciones versionadas del snapshot.
- `ConnectivityService`/`SyncCoordinator`: conectividad y cola, con distinción explícita entre demo local y sincronización de servidor.
- `DemoAutomation`: temporizadores de planta/despacho activables solo en demo.

No introducir estas abstracciones hasta que haya una sustitución concreta o pruebas que las justifiquen; por ahora nombrar los límites en documentación y evitar añadir más responsabilidades al store.

## 3. Mantener rutas finas; descomponer pantallas grandes

Las rutas de Expo Router deben seguir encargándose de URL, layout y composición de pantalla. Mantener formularios, validaciones visuales y estados transitorios dentro de su feature. Siguientes candidatos: `features/checkout/screens.tsx`, `features/driver/screens.tsx` y `features/account/screens.tsx`.

Extraer widgets para bloques coherentes (selector de modalidad, tarifa/resumen, etapa de servicio, confirmación de entrega) y hooks solo cuando compartan estado o comportamiento. Componentes de `components/ui.tsx` deben seguir genéricos, sin lógica de negocio.

## 4. Unificar interfaces geográficas

El límite `GeoProvider` ya permite elegir demo, Mapbox o contrato API. Mantener separados búsqueda de direcciones, cobertura, routing, descubrimiento de sedes, despacho y ubicación del chofer, pero declarar explícitamente cuáles servicios se usan en producción y cuáles son solo preparación. Cobertura comercial debe poder provenir de configuración validada del servidor, no constantes de demo.

## 5. Acceso por rol y sede

Las fachadas `repositories(engine, session)` aíslan listas y asignaciones por usuario y las rutas validan rol/KYC. Antes de servir datos reales, los mismos controles deben repetirse en backend. La pantalla `DemoOperationsScreen` y los actores `DEMO-ADMIN-*` deben quedar confinados a build/entorno de demostración y no convertirse en una identidad operativa.

## 6. Propuesta de árbol objetivo

```text
src/
  app/                     # rutas Expo Router, layouts y composición
  features/
    auth/ checkout/ orders/ tracking/ driver/ handoffs/ benefits/ account/
    .../model/              # estado de feature y casos de uso de UI
    .../ui/                 # pantallas y widgets propios
  domain/
    orders/ fulfillment/ handoffs/ benefits/ identity/
    shared/                 # modelos y valores de dominio realmente comunes
  services/
    persistence/ auth/ payments/ notifications/ geo/ demo/
  store/                    # provider y estado reactivo de aplicación
  components/ui/             # componentes visuales genéricos
  theme/
```

Es una dirección, no una instrucción de reorganización inmediata. Evitar reubicación masiva y conservar imports/rutas públicas.

## Orden sugerido

1. Dibujar ownership de datos y dependencias actuales; documentar la matriz de mocks.
2. Añadir contratos de repositorio/API cuando se acuerde backend y autenticación.
3. Separar los casos de uso más grandes detrás de esos contratos, manteniendo compatibilidad de UI.
4. Mover una pantalla a la vez a widgets/modelo enfocado solo cuando exista una mejora verificable.
5. Reemplazar automatizaciones demo por eventos backend; retirar caminos demo del build operativo.

Para las decisiones comerciales previas a esta organización, consultar [revisión de lógica](REVISION-LOGICA-NEGOCIO.md).
