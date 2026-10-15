# Clean Code: aplicación gradual

Se aplican las reglas de `LAUNDRY_CLEAN_CODE_RULES.md` a los módulos intervenidos, preservando comportamiento y presentación.

## Restricciones vigentes

- Únicamente `HOME_HOME` y `HOME_STORE`: recogida a domicilio en ambas modalidades.
- Mantener rutas, contratos, persistencia, permisos, validaciones y diseño actuales.
- Archivos nuevos de hasta 100 líneas; hasta 150 sólo con una responsabilidad que lo justifique.
- Pantallas de composición, estado de formularios en features y selectores sin dependencias de React.
- Reutilizar componentes, tokens y repositorios existentes; no agregar dependencias especulativas.
- Una migración de navegación requiere un alcance propio y validación completa del reemplazo.

## Primera etapa

- `screens/driver`: seis pantallas independientes.
- `features/driver/ui`: acciones y secciones visuales del chofer.
- `features/driver/model`: estado y envío de confirmaciones de recogida/entrega.
- `entities/order/model/driverOrderSelectors.ts`: selección de servicios e historial.
- `DriverScreens.tsx`: exportaciones compatibles con la navegación vigente.

No se modifican repositorios, estados del pedido, precios, agenda, custodia ni evidencias.

## Validación de esta etapa

- TypeScript y exportaciones Expo para web y Android.
- 24 pruebas de negocio existentes y recorrido UI completo del chofer.
- Equivalencia de selectores y comparación de capturas con la versión previa.
- En este entorno `tsx` falla al consultar `uv_os_get_passwd`; las pruebas se ejecutaron con el cargador TypeScript ya existente en los tests de LaundryWeb, sin añadir paquetes ni dependencias de ejecución entre aplicaciones.

## Continuación

Los módulos heredados de solicitudes, cuenta, UI y repositorio siguen pendientes de separación por responsabilidad. Su existencia no implica que esta etapa declare terminada la aplicación de Clean Code a todo el proyecto.
