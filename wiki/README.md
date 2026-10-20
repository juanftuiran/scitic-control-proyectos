# 📚 SCITIC Control de Proyectos — Wiki Técnica del Sistema

> **Bienvenido a la Wiki Oficial de Desarrollo de SCITIC Control de Proyectos.**  
> Esta documentación técnica centralizada contiene la arquitectura, esquemas de datos, lógica de negocio y guías prácticas paso a paso para extender, mantener y modificar la aplicación de forma ágil y segura.

---

## 🎯 Propósito del Sistema

**SCITIC Control de Proyectos** es una plataforma web desarrollada para **SCITIC S.A.S.** orientada a la gestión operativa, control presupuestario y administración de ingeniería:
1. **Control de Horas y Recursos:** Seguimiento de jornadas laborales ordinarias y novedades (vacaciones, incapacidades, permisos), con cálculo automático de costos y alertas de exceso de horas presupuestadas.
2. **Control Financiero de Gastos y Viáticos:** Registro detallado de viáticos y compras operativas de campo, selección múltiple, consola guiada de liquidación/abonos, manejo de cuentas de saldo a favor del personal y emisión de comprobantes de pago oficiales.
3. **Ecosistema de Herramientas de Ingeniería:** Suite de micro-aplicaciones integradas para cálculo de canalizaciones según norma RITEL ([Calculadora de Tubos](05-herramientas-de-ingenieria.md#calculadora-de-tubos-ritel)), cálculo de balances y pérdidas ópticas/coaxiales ([Calculadora de Pérdidas TDT](05-herramientas-de-ingenieria.md#calculadora-de-perdidas-tdt-loss-gen-app)) y generación de bitácoras técnicas ([Informes de Obra](05-herramientas-de-ingenieria.md#informes-de-obra)).

---

## 🗺️ Mapa de Navegación de la Wiki

| # | Documento | Descripción / Alcance |
|---|---|---|
| **01** | [**01. Arquitectura General**](01-arquitectura-general.md) | Estructura de carpetas, ciclo de vida, patrón Store reactivo, gestión de sesión y renderizado UI. |
| **02** | [**02. Base de Datos y Seguridad**](02-base-de-datos-y-seguridad.md) | Esquemas de Supabase (PostgreSQL), políticas RLS por rol, triggers, RPCs y diagrama Entidad-Relación. |
| **03** | [**03. Módulo de Control de Horas**](03-modulo-control-horas.md) | Modos de trabajo vs novedades, parsing de tiempo `HH:MM` ↔ Decimal, fórmulas presupuestales, alertas y exportación/importación Excel. |
| **04** | [**04. Módulo de Gastos y Liquidaciones**](04-modulo-gastos-y-liquidaciones.md) | Flujo completo de viáticos, selección masiva, motor de liquidación con saldo a favor y comprobantes imprimibles. |
| **05** | [**05. Herramientas de Ingeniería**](05-herramientas-de-ingenieria.md) | Micro-frontends vía iframe (`calculadora-tubos`, `loss-gen-app`, `informes-obra`), comunicación bidireccional y persistencia JSONB. |
| **06** | [**06. Servicios y Estado Central**](06-servicios-y-estado.md) | Referencia detallada de clases: `APIService` (`api.js`), `AppStore` (`appState.js`) y `Toast` (`Toast.js`). |
| **07** | [**07. Guía de Desarrollo y Modificaciones**](07-guia-de-desarrollo-y-modificaciones.md) | **Cookbook para desarrolladores e IA:** Instrucciones paso a paso para añadir campos, filtros, KPIs, herramientas y checklist de verificación. |
| **08** | [**08. Sistema de Diseño, Paleta de Colores y Estilos UI**](08-diseno-ui-y-estilos.md) | Tokens CSS, paleta SCITIC (Dark/Glassmorphism), códigos de novedad, tipografía, microanimaciones Apple y catálogo de componentes. |

---

## 🛠️ Ficha Técnica del Stack

* **Frontend Principal:** HTML5 semántico, CSS3 moderno con diseño *Glassmorphism* y microanimaciones, Vanilla JavaScript (ES6+ modular).
* **Gestión de Estado:** Store reactivo propio (`AppStore`) desacoplado de dependencias externas.
* **Backend as a Service (BaaS):** [Supabase](https://supabase.com/) (PostgreSQL 15+, Auth nativo con JWT, Row Level Security, Triggers PL/pgSQL).
* **Librerías Externas:**
  * [Chart.js 4.x](https://www.chartjs.org/) — Dashboards analíticos y distribución de horas/gastos.
  * [SheetJS / xlsx](https://sheetjs.com/) — Procesamiento bidireccional de hojas de cálculo Excel (`.xlsx`).
  * [jsPDF](https://github.com/parallax/jsPDF) & AutoTable — Generación client-side de documentos PDF en herramientas técnicas.

---

## 📌 Principios de Diseño del Código

1. **Cero Dependencias de Frameworks:** No requiere compiladores pesados (Webpack, Vite o Babel) para el frontend principal, facilitando despliegues estáticos y ejecución directa en cualquier navegador o CDN.
2. **Reactividad Transparente:** La variable global `Store` controla el estado unificado, y se sincroniza con variables globales mediante getters/setters dinámicos (`Object.defineProperty`) manteniendo total compatibilidad con código legado.
3. **Seguridad en Capas:** La seguridad reside en PostgreSQL mediante **RLS** (Row Level Security). Las funciones críticas nunca exponen contraseñas y las consultas de colaboradores están restringidas a nivel de base de datos.
4. **Resiliencia de Conexión:** Cuenta con caché instantánea en `localStorage` (`scitic_user_profile`) para evitar parpadeos visuales en el login, con revalidación y sincronización en segundo plano con el servidor Supabase.

---

## 🔍 Acceso Rápido al Código Fuente

* **Punto de Entrada:** [`index.html`](file:///d:/SCITIC/SOFTWARE/scitic-app/index.html)
* **Lógica Principal:** [`src/js/main.js`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/js/main.js)
* **Capa de Servicios y API:** [`src/js/services/api.js`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/js/services/api.js)
* **Gestor de Estado Central:** [`src/js/store/appState.js`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/js/store/appState.js)
* **Componente de Notificaciones:** [`src/js/components/Toast.js`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/js/components/Toast.js)
* **Estilos CSS Globales:** [`src/css/styles.css`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/css/styles.css) y [`src/css/toast.css`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/css/toast.css)
* **Scripts SQL:** [`sql/`](file:///d:/SCITIC/SOFTWARE/scitic-app/sql)
