# PetCare — Actividad 4: prototipo funcional

Esta carpeta corresponde al informe de Proyecto de software. La raíz del repositorio conserva la maqueta de once pantallas de Análisis y Diseño de Sistemas.

## Ejecución

Desde la página principal del repositorio, selecciona Code > Download ZIP y extrae el contenido. Abre `actividad4-prototipo/index.html` en Edge o Chrome. No requiere paquetes externos. También puedes clonar el repositorio.

Si el navegador no permite guardar datos al abrir el archivo directamente, ejecuta desde esta carpeta `py -m http.server 8000 --bind 127.0.0.1` y abre http://127.0.0.1:8000.

## Cuentas ficticias

Propietario: `cliente@petcare.test`. Proveedor: `proveedor@petcare.test`. Contraseña para ambas: `Demo1234`.

## Recorrido

1. Ingresa como proveedor y publica un horario futuro en Servicios y horarios.
2. Sal e ingresa como propietario; registra una mascota.
3. En el catálogo, selecciona Ver horarios y reservar y envía la solicitud.
4. Ingresa como proveedor para confirmarla o rechazarla.
5. Consulta Mis reservas como propietario; puedes cancelar una solicitud pendiente o confirmada.

Cada horario dura 60 minutos. Pendiente y Confirmada ocupan el cupo; Rechazada y Cancelada lo liberan si es futuro.

## Alcance

Prototipo local con HTML, CSS y JavaScript incluidos en index.html. Los datos quedan en localStorage del mismo navegador. No existe sincronización entre equipos ni control transaccional de concurrencia. Usa una pestaña y datos ficticios: las contraseñas se guardan localmente sin cifrado. No es un sistema listo para producción.
