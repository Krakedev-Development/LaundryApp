# Documentación de LaundryApp

LaundryApp es un prototipo móvil Expo para clientes y choferes. Esta documentación describe el código de `src/` y sus servicios locales; los recorridos simulados no representan una operación conectada a LaundryWeb ni a un backend.

## Guías

- [Flujos funcionales y límites de la demo](FLUJOS-APP-DEMO.md): instalación, acceso, pedidos, operaciones de chofer y qué partes son simuladas.
- [Diagramas de flujos](DIAGRAMAS-FLUJOS-APP.md): navegación, checkout, custodia, logística, pagos y datos.
- [Revisión de lógica de negocio](REVISION-LOGICA-NEGOCIO.md): reglas implementadas, decisiones por cerrar y riesgos operativos.
- [Propuesta de organización de módulos](PROPUESTA-ORGANIZACION-MODULOS.md): límites actuales y evolución incremental sin cambiar comportamiento.
- [Guía de limpieza estructural](ORGANIZACION-CLEAN-CODE.md): principios y etapas sugeridas para organizar el código.

## Guías existentes

- [README de LaundryApp](../README.md): ejecución, cuentas de demo, funciones y arquitectura.
- [Fulfillment y transferencias](../FULFILLMENT-MVP.md): modalidades domicilio/sede, escenarios, reglas QR y límites de persistencia.
- [Geografía](../GEO-MVP.md): Mapbox, cobertura, rutas y tracking.

LaundryWeb y LaundryApp comparten una instantánea de datos y contratos portables, pero guardan estados de demo independientes. Para saber si una capacidad es real, atender a la etiqueta de estado de cada documento: **implementado localmente**, **simulado** o **pendiente de integración/definición**.
