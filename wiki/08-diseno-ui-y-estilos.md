# 08. Sistema de Diseño, Paleta de Colores y Estilos UI

> **Objetivo:** Documentar la guía de estilos visuales, la paleta cromática corporativa, los tokens de diseño CSS, la tipografía y el catálogo de componentes de interfaz (*Glassmorphism*) de **SCITIC Control de Proyectos**, garantizando que cualquier nueva pantalla, modal o botón mantenga una coherencia estética premium.

---

## 🎨 1. Paleta de Colores Corporativa (Color Palette)

El sistema visual utiliza una estética **Dark Theme con Glassmorphism** (fondos translúcidos con desenfoque de fondo y bordes de cristal), centrada en el color corporativo naranja de **SCITIC S.A.S.**

```
🟧 #EA580C  Primary SCITIC       🟩 #10B981  Success / Pagado     🟦 #06B6D4  Permiso Remunerado
🟧 #F97316  Primary Hover        🟨 #F59E0B  Accent / Advertencia  🟪 #8B5CF6  Vacaciones
⬛ #020617  Background Deep      🟥 #EF4444  Danger / Alerta       🌸 #EC4899  Novedades
⬜ #F8FAFC  Text Main / Pure     🩶 #94A3B8  Text Muted           🌹 #F43F5E  Incapacidad
```

### 1.1. Tabla de Tokens de Color ([`src/css/styles.css`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/css/styles.css#L4-L51))

| Token CSS | Valor HEX / RGBA | Muestra | Uso / Significado Semántico |
|---|---|---|---|
| `--primary` | `#ea580c` | <span style="background:#ea580c;color:#fff;padding:2px 8px;border-radius:4px;">#ea580c</span> | Naranja corporativo SCITIC. Botones primarios, acentos activos y logo. |
| `--primary-hover` | `#f97316` | <span style="background:#f97316;color:#fff;padding:2px 8px;border-radius:4px;">#f97316</span> | Estado hover y foco en botones y enlaces principales. |
| `--primary-gradient`| `linear-gradient(135deg, #ea580c, #f97316)` | <span style="background:linear-gradient(135deg, #ea580c, #f97316);color:#fff;padding:2px 8px;border-radius:4px;">Gradiente</span> | Botones de acción clave, loaders destacados y barras de progreso activas. |
| `--scitic-gray` | `#334155` | <span style="background:#334155;color:#fff;padding:2px 8px;border-radius:4px;">#334155</span> | Separadores, bordes neutros y elementos secundarios. |
| `--scitic-dark` | `#f8fafc` | <span style="background:#f8fafc;color:#000;padding:2px 8px;border-radius:4px;">#f8fafc</span> | Blanco humo para títulos de alto contraste. |
| `--bg-main` | `#020617` | <span style="background:#020617;color:#fff;padding:2px 8px;border-radius:4px;">#020617</span> | Fondo base oscuro (Slate 950). |
| `--bg-gradient` | `radial-gradient(circle at top left, #1e293b 0%, #020617 100%)` | <span style="background:#1e293b;color:#fff;padding:2px 8px;border-radius:4px;">Radial</span> | Fondo general de la página para dar profundidad tridimensional. |
| `--card-bg` | `rgba(30, 41, 59, 0.5)` | - | Superficie translúcida de tarjetas y paneles (*Glassmorphism*). |
| `--card-border` | `rgba(255, 255, 255, 0.08)` | - | Borde exterior de cristal reflectante en tarjetas. |
| `--text-main` | `#f8fafc` | <span style="background:#f8fafc;color:#000;padding:2px 8px;border-radius:4px;">#f8fafc</span> | Texto principal en cuerpos, tablas e inputs. |
| `--text-muted` | `#94a3b8` | <span style="background:#94a3b8;color:#000;padding:2px 8px;border-radius:4px;">#94a3b8</span> | Subtítulos, labels secundarios y texto complementario. |

---

### 1.2. Estados del Sistema y Alertas

| Token CSS | Valor | Muestra | Aplicación |
|---|---|---|---|
| `--success` | `#10b981` | <span style="background:#10b981;color:#fff;padding:2px 8px;border-radius:4px;">#10b981</span> | Gastos liquidados (`PAGO`), toasts de confirmación y badges positivos. |
| `--accent` | `#f59e0b` | <span style="background:#f59e0b;color:#000;padding:2px 8px;border-radius:4px;">#f59e0b</span> | Gastos `PENDIENTE`, avisos preventivos y estados en revisión. |
| `--danger` | `#ef4444` | <span style="background:#ef4444;color:#fff;padding:2px 8px;border-radius:4px;">#ef4444</span> | Exceso de presupuesto de horas, botón eliminar y alertas críticas. |
| `--danger-bg` | `rgba(239, 68, 68, 0.1)` | - | Fondo de advertencia suave en filas o tarjetas con sobrecosto. |

---

### 1.3. Códigos de Color para Novedades Laborales

| Token CSS | Color | Aplicación / Tipo de Novedad |
|---|---|---|
| `--permiso-color` | `#06b6d4` (Cian) | **Permiso Remunerado** y licencias cortas autorizadas. |
| `--incapacidad-color`| `#f43f5e` (Rosa Intenso) | **Incapacidad Médica** y reposos laborales. |
| `--vacaciones-color` | `#8b5cf6` (Púrpura) | **Vacaciones** anuales disfrutadas. |
| `--novedad-color` | `#ec4899` (Fucsia) | **Calamidad Doméstica** o Día Compensatorio. |

---

## 🪟 2. El Efecto Glassmorphism y Curvas Apple (iOS / macOS)

La interfaz se inspira en el diseño de interfaces modernas de Apple, combinando desenfoques de fondo (*backdrop-filter*) con curvas de animación Bezier:

### 2.1. Tokens de Desenfoque y Animación
```css
/* Curvas de aceleración elásticas y naturales */
--ios-ease: cubic-bezier(0.16, 1, 0.3, 1);
--ios-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ios-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

/* Niveles de Blur para paneles de vidrio */
--ios-blur: blur(20px);
--ios-blur-subtle: blur(12px);
```

### 2.2. Clase de Panel de Vidrio (`.glass-panel`)
```css
.glass-panel { 
    background: var(--card-bg); 
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--card-border); 
    box-shadow: var(--shadow-sm); 
}
```

---

## ✍️ 3. Tipografía y Reglas de Experiencia del Usuario (UX)

### 3.1. Fuentes Tipográficas Oficiales (`design-system.css`)
El sistema carga explícitamente las fuentes de Google Fonts en [`src/css/design-system.css`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/css/design-system.css):
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```
* **Titulares (`h2`):** `1.8rem`, `font-weight: 800`, `letter-spacing: -0.5px`, color blanco `#ffffff`.
* **Secciones (`h3`):** `1.15rem`, `font-weight: 700`, borde inferior de cristal `1px solid var(--card-border)`.
* **Subtítulos y Labels (`h4`):** `0.8rem`, `font-weight: 700`, `text-transform: uppercase`, color `var(--text-muted)`.
* **Cifras técnicas, ingeniería y moneda:** Uso de `--font-mono` con `font-variant-numeric: tabular-nums` en KPIs (`.stat-number`), celdas calculadas y niveles de señal dBµV.

### 3.2. Control de Cursor y Selección Inteligente de Texto
Para que la aplicación se sienta como un software empresarial de ingeniería permitiendo copiar datos técnicos:
1. **Protección de controles UI:**  
   Se mantiene `user-select: none` en botones, pestañas, cabeceras y contenedores estructurales.
2. **Selección habilitada en tablas y comprobantes:**  
   Las celdas de datos (`td`), valores estadísticos (`.stat-number`), bloques de código y comprobantes de pago tienen `user-select: text !important` para facilitar el copiado de referencias, seriales y valores.
3. **Cursor Pointer garantizado:**  
   Todos los botones, enlaces y selectores interactivos fuerzan `cursor: pointer`.

---

## 🧩 4. Catálogo de Componentes de Interfaz y Utilidades Globales (`SCITIC Pro`)

### 4.0. Hoja de Sistema de Diseño Compartida ([`src/css/design-system.css`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/css/design-system.css))
Unifica tokens entre el Shell principal y las 3 herramientas embebidas (`calculadora-tubos`, `loss-gen-app`, `informes-obra`), además de proveer:
* **Modo Claro / Campo Opcional (`window.SCITICTheme`):** Alterna entre el tema **Dark Pro** por defecto y el modo **Claro / Campo** (`html[data-theme="light"]`) para lectura bajo luz solar intensa, sincronizando automáticamente el `<iframe>` activo.
* **Diálogo de Confirmación Glassmorphic (`window.SCITICModal.confirm`):** Reemplaza el `window.confirm()` nativo del navegador por una promesa asíncrona con estética corporativa, soporte para teclado (`Escape` / `Enter`) y variantes `danger` / `primary`.
* **Estados Vacíos (`.scitic-empty-state`) y Píldoras de Conteo (`.filter-results-pill`):** Componentes reutilizables para tablas filtradas sin resultados y contadores en vivo.

### 4.1. Tarjetas Estadísticas (`.stat-card`)
Utilizadas en los dashboards de horas y gastos para presentar métricas clave:
```html
<div class="stat-card">
    <div class="stat-icon">⏱️</div>
    <div class="stat-info">
        <span class="stat-label">Total Horas</span>
        <span class="stat-value" id="stat-horas">1,420 h</span>
    </div>
</div>
```

### 4.2. Badges y Etiquetas de Estado (`.badge`)
```html
<!-- Estado Aprobado / Pagado -->
<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">PAGO</span>

<!-- Estado Pendiente -->
<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">PENDIENTE</span>

<!-- Estado Alerta / Sobrecupo -->
<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">EXCESO</span>
```

### 4.3. Botones del Sistema
* **Botón Primario:** Fondo gradiente SCITIC (`--primary-gradient`), sombra suave, texto blanco en negrita.
* **Botón Guardar Servidor (`.btn-server-save`):** Estilo corporativo usado en micro-herramientas.
* **Botón Eliminar / Peligro (`.btn-danger`):** Borde y fondo en tonos rojos (`--danger`).
* **Botón Modo Laboral / Novedad:** Switch segmentado con clase `.active` que resalta el modo seleccionado.

### 4.4. Barra Flotante de Acciones (`#barraSeleccionGastos`)
* **Posición:** `position: fixed; bottom: 25px; left: 50%; transform: translateX(-50%);`
* **Estilo:** Píldora flotante oscura con desenfoque de 24px (`backdrop-filter: blur(24px)`), borde de 1px brillante y sombra de elevación `box-shadow: 0 20px 40px -10px rgba(0,0,0,0.8)`.

### 4.5. Sistema de Notificaciones Toast ([`src/css/toast.css`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/css/toast.css))
* Ubicado en la esquina inferior derecha (`bottom: 30px; right: 30px; z-index: 10000`).
* Animación suave con curva `cubic-bezier(0.16, 1, 0.3, 1)`.
* Borde izquierdo identificador:
  * Verde para `toast-success` (`var(--success)`)
  * Rojo para `toast-error` (`var(--danger)`)
  * Ámbar para `toast-warning` (`var(--accent)`)
  * Naranja para `toast-info` (`var(--primary)`)

---

## 🖨️ 5. Estilos de Impresión (@media print)

Para el comprobante oficial de pago ([#modalReciboPago](04-modulo-gastos-y-liquidaciones.md#5-comprobante-de-pago-oficial-imprimible)), las reglas `@media print` transforman la interfaz oscura en un documento corporativo de alta calidad para papel bond blanco:

1. **Eliminación de Elementos de Pantalla:** Se ocultan botones de navegación, filtros, formularios, dashboards y scrolls.
2. **Fondo Blanco Puro:** El recibo adopta fondo `#ffffff` con texto negro profundo `#0f172a` para optimizar el tóner de la impresora.
3. **Tablas con Bordes Nítidos:** Las filas del recibo se renderizan con bordes grises de 1px (`#e2e8f0`) y totales destacados.
4. **Espacios Formales de Firma:** Bloques alineados para la firma autorizada de SCITIC y el recibí conforme del beneficiario.
