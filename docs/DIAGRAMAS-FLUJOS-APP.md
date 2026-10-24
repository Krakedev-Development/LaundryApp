# Diagramas de flujos de LaundryApp

Los diagramas describen la app y sus servicios actuales. Las cajas locales/mock no implican llamada a un servidor.

## 1. Entrada y navegación

```mermaid
flowchart TD
    A[Abrir app] --> B{¿Sesión local?}
    B -->|No| C[Login o registro]
    B -->|Sí, cliente| D{Estado KYC}
    C --> D
    D -->|No enviado| E[Formulario KYC]
    D -->|Pendiente o rechazado| F[Estado y revisión demo]
    D -->|Aprobado| G[Tabs de cliente]
    B -->|Sí, chofer| H{¿Contraseña temporal?}
    H -->|Sí| I[Cambiar contraseña]
    H -->|No| J[Tabs de chofer]
```

Las rutas de Cliente exigen sesión y KYC aprobado. Las rutas de Chofer exigen sesión del rol; el cambio de contraseña temporal se aplica en su layout.

## 2. Checkout

```mermaid
flowchart TD
    A[Nuevo pedido] --> B{Modalidad}
    B -->|Domicilio a domicilio| C[Prendas y servicios]
    C --> D[Extras]
    D --> E[Dirección y franja de recogida]
    E --> F[Dirección y fecha de entrega]
    F --> G[Pago y confirmación]
    B -->|Sede a sede| C
    C --> D
    D --> H[Sede y cita de ingreso]
    H --> G
    G --> I{KYC, reglas, precio, cobertura y pago válidos}
    I -->|No| J[Mostrar motivo; no crear pedido]
    I -->|Sí| K[Crear pedido y registrar pago demo atómicamente]
    K --> L[Inicializar fulfillment y transferencias]
    L --> M[Detalle y seguimiento]
```

La estimación y el total se calculan desde catálogo, servicios, promoción, plan, recompensa, tarifa y modalidad. El código usa el mismo precio como importe cobrado; no hay ajuste de precio posterior por pesaje.

## 3. Fulfillment a domicilio

```mermaid
flowchart TD
    A[Pedido pagado] --> B[Despacho demo asigna conductor]
    B --> C[Conductor navega y marca llegada]
    C --> D[QR cliente → conductor: cantidad recibida]
    D --> E[Conductor traslada y llega a planta]
    E --> F[QR conductor → planta]
    F --> G[Planta demo: proceso → calidad → listo]
    G --> H[Despacho demo asigna entrega]
    H --> I[QR planta → conductor]
    I --> J[Navegación y llegada al domicilio]
    J --> K[QR conductor → cliente: destinatario y relación]
    K --> L[Pedido completado y puntos idempotentes]
    D -->|Diferencia de conteo| X[Retención; requiere resolución de sede]
    F -->|Diferencia de conteo| X
    X --> G
```

## 4. Fulfillment sede a sede

```mermaid
flowchart TD
    A[Pedido pagado y sede/cita elegidas] --> B[Cliente llega a sede]
    B --> C[Operador de sede demo valida código y cantidad]
    C --> D[Planta demo procesa y controla calidad]
    D --> E[Pedido listo]
    E --> F[Cliente o autorizado presenta código de retiro]
    F --> G[Registrar receptor y relación]
    G --> H[Pedido completado y puntos idempotentes]
    C -->|Diferencia| I[Retención y resolución local]
    I --> D
```

## 5. Ciclo de una transferencia

```mermaid
sequenceDiagram
    participant P as Presentador (cliente/chofer)
    participant UI as Pantalla Expo
    participant HS as HandoffService
    participant R as Repositorio local
    P->>UI: Escanea QR o introduce código
    UI->>HS: verify(código, actor, pedido)
    HS->>R: Buscar transferencia y comprobar actor/etapa/pago/sede
    R-->>HS: Registro local
    HS->>R: Guardar auditoría de verificación
    HS-->>UI: Ticket local de confirmación
    P->>UI: Confirma cantidad o receptor
    UI->>HS: confirm(ticket, datos de entrega)
    HS->>R: Revalidar, consumir código, actualizar pedido/auditoría
    R-->>UI: Recibo y estado local
```

El código no se consume al verificar. La segunda validación protege la transición local contra cambios entre verificación y confirmación.

## 6. Despacho, planta y ubicación simulados

```mermaid
flowchart LR
    A[Pedido local] --> B[AppStore: intervalo 12 s]
    B --> C[DomainEngine.dispatch]
    C --> D[Elegibilidad local de conductor]
    D --> E[Asignación local]
    B --> F[DomainEngine.plantTick]
    F --> G[Avanza una etapa interna]
    G --> H[READY / DELIVERY_SCHEDULED]
    H --> C
    I[AppMockTracking: intervalo geográfico] --> J[Proveedor mock]
    J --> K[Posición local del conductor]
    K --> L[Mapa/ETA de seguimiento]
    M[Mapbox opcional] --> N[Geocoding, Directions, Matrix]
    N -. no equivale a tracking real .-> L
```

Despacho y planta se activan con conectividad porque dependen del intervalo del `AppProvider`. La posición mock se detiene cuando desconecta o la etapa ya no requiere seguimiento.

## 7. Datos y límites entre sistemas

```mermaid
flowchart LR
    Seed[Semilla desde LaundryWeb] --> Store[AppStore + DomainEngine]
    UI[Pantallas Cliente/Chofer/Sede demo] --> Engine[Reglas y transacciones locales]
    Engine --> Store
    Store --> Persist[AsyncStorage / SecureStore]
    Store --> Views[Pedidos, timeline, beneficios, chat, avisos, tracking]
    Other[LaundryWeb / otra instalación / backend futuro]
    Store -. no hay sincronización runtime .-> Other
    Geo[GeoProvider: demo o Mapbox] --> UI
    ServerGeo[API geográfica opcional] -. sólo si se configura .-> Geo
```

El proveedor API geográfica solo representa un contrato HTTP de geocodificación/rutas; no es backend para pedidos, usuarios o transferencias.
