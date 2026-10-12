# SafetyHome

Cuidado de casas y mascotas en Santiago mientras sus dueños viajan, con rondines retirados de las Fuerzas Armadas y de Orden.

## Pantallas

| Archivo | Para quién | Qué hace |
|---|---|---|
| `index.html` | Público | Sitio, cotizador y postulación de clientes |
| `rondines.html` | Postulantes | Postulación de rondines con certificado de retiro y antecedentes |
| `ronda.html` | Rondines | Agenda, registro de cada ronda con tareas y fotos |
| `cliente.html` | Clientes aprobados | Portal: reservar, ficha de la casa, partes de ronda, plan mensual |
| `admin.html` | Administración | Postulaciones, reservas, rondines, pagos, avisos y configuración |

## Cómo está armado

- Páginas estáticas publicadas con GitHub Pages. Estilos y utilidades compartidas en `assets/`.
- Datos en Supabase (tablas `safehome_*`). El público no lee ni escribe tablas: todo pasa por funciones.
- La función `safehome` de Supabase envía los avisos por WhatsApp y entrega las fotos con enlaces temporales.
- Precios, reglas, tareas, feriados y datos de transferencia se cambian en `admin.html`, pestaña Configuración.
