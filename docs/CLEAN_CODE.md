# Arquitectura del cliente

LaundryApp contiene exclusivamente acceso, registro/verificación, solicitudes, seguimiento, pagos, beneficios y cuenta del cliente.

- `navigation`: árbol único de React Navigation, pestañas y rutas del cliente.
- `screens`: composición de pantallas del cliente; sin rutas operativas ni acceso a otras sesiones.
- `features`: formularios, selecciones y acciones del cliente.
- `domain/repository.ts`: operaciones de la cuenta activa, agenda, solicitudes, pagos y códigos del cliente.
- `domain/models.ts`: cuentas y sesiones CLIENT; contratos de lectura para estados, contacto, mensajes y constancias recibidas.
- `domain/customerHandoffs.ts`: alcance de códigos del cliente; excluye operaciones internas de custodia.
- `domain/fixtures/orderTracking.ts`: datos de lectura para solicitudes del MVP local, sin estado ni acciones operativas.
- `store`: persistencia y compatibilidad de datos anteriores; conserva datos del cliente y descarta sesiones ajenas.
- `services`: contraseñas y archivos del cliente.

El login comparte una presentación y una validación de credenciales genéricas. Los avisos específicos se reciben por composición desde la aplicación que los necesita. LaundryApp solo configura registro y acceso demo del cliente.

Los módulos nuevos mantienen una responsabilidad y hasta 100 líneas, con máximo de 150 cuando la responsabilidad lo justifica. Los módulos heredados grandes continúan sujetos a extracción gradual, sin reescrituras ajenas a cada funcionalidad. El dominio no depende de React Native, Expo ni almacenamiento.

Se conservan las modalidades HOME_HOME y HOME_STORE, el diseño, el header, la navegación inferior, los precios, la agenda y las decisiones del cliente. No se agregan dependencias especulativas ni conexión a backend.
