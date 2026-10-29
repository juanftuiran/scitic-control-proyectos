# 🎨 Sistema de Estética Centralizada SCITIC (Single Source of Truth)

Esta carpeta (`src/theme/`) es el **único lugar del proyecto** donde se configuran los colores, estilos visuales e iconos de toda la aplicación.

---

## 📁 Estructura de la Carpeta

```
src/theme/
├── theme.css     ← 💎 ARCHIVO ÚNICO DE COLORES, FONDOS Y ESTÉTICA (THEME TOKENS)
├── icons.js      ← 🌟 ARCHIVO ÚNICO DE ICONOS VECTORIALES (CATÁLOGO DE ICONOS)
├── theme.js      ← ⚡ MOTOR REACTIVO (Cambio Dark/Light y consulta JS de variables)
└── README.md     ← Esta guía
```

---

## 🚀 1. Cómo cambiar los colores y la estética de TODA la aplicación

Para cambiar la paleta o estética, **SOLO DEBES MODIFICAR [`theme.css`](theme.css)**.
Cualquier cambio realizado en `:root` o en `html[data-theme="light"]` afectará automáticamente a:
- El dashboard principal (Horas, Gastos, Liquidaciones).
- Las 3 micro-herramientas (`calculadora-tubos`, `informes-obra`, `loss-gen-app`).
- Formularios, tarjetas, botones, modales, alertas y tablas.
- Los gráficos de `Chart.js` (que leen reactivamente las variables CSS mediante `SCITICTheme.getColor()`).

### Variables clave en `theme.css`:
* `--primary`: Color primario corporativo (botones, acentos activos, bordes clave).
* `--primary-hover`: Color de realce al pasar el cursor.
* `--primary-gradient`: Degradado para botones principales y barras de progreso.
* `--bg-main` y `--bg-gradient`: Fondo general y resplandor radial de la aplicación.
* `--card-bg` y `--card-border`: Fondo y borde de tarjetas y paneles *Glassmorphism*.
* `--text-main`, `--text-heading`, `--text-muted`: Jerarquía de color del texto.
* `--success`, `--accent`, `--danger`, `--info`: Estados semánticos.

---

## 🧩 2. Cómo usar y modificar iconos

Todos los iconos se encuentran centralizados en [`icons.js`](icons.js).

### A. Usar un icono en HTML:
Basta con añadir el atributo `data-icon="nombre"` en cualquier etiqueta:
```html
<!-- Básico -->
<span data-icon="clock"></span>

<!-- Con tamaño o grosor personalizado -->
<span data-icon="dollar" data-size="20" data-stroke="2.5"></span>
<span data-icon="tools" data-class="text-primary"></span>
```
El motor de `icons.js` lo reemplaza automáticamente con el SVG correspondiente al cargar la página y mediante `MutationObserver` si se inyecta dinámicamente con JavaScript.

### B. Usar un icono en JavaScript:
```javascript
// Opción 1: Llamada directa
const iconoReloj = SCITIC_ICONS.get('clock', { size: 18 });

// Opción 2: Atajo
const iconoGuardar = SCITIC_ICONS.save(16);
```

### C. Modificar o añadir un nuevo icono:
Abre [`icons.js`](icons.js), busca el diccionario `ICON_PATHS` y edita o agrega la clave con el trazado SVG. Se actualizará en toda la plataforma al instante.
