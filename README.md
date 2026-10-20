# SCITIC Control de Proyectos

Aplicación web moderna y modular desarrollada para SCITIC S.A.S para el control y gestión de horas trabajadas, recursos y presupuestos de proyectos.

## 🚀 Características Principales

*   **Autenticación y Roles:** Sistema de inicio de sesión con control de acceso basado en roles (Administrador, Colaborador, Moderador).
*   **Gestor de Estados Centralizado:** Arquitectura Vanilla JS utilizando un Store (`appState.js`) para manejar el flujo de datos de manera reactiva y eficiente.
*   **Dashboards y Analíticas:** Panel de control con gráficos dinámicos de distribución de carga, horas filtradas y ejecución de presupuestos (utilizando `Chart.js`).
*   **Alertas y Reportes:** Sistema inteligente de alertas por exceso de horas presupuestadas y reportes de personal faltante.
*   **Importación / Exportación:** Herramientas para carga masiva de registros desde archivos Excel y descarga de auditoría o reportes para contabilidad (utilizando `SheetJS`).
*   **Integración en la Nube:** Conectado directamente a Supabase como backend Serverless (Base de datos y Autenticación).
*   **UI/UX Premium:** Diseño estilizado con *glassmorphism*, notificaciones Toast y micro-animaciones para mejorar la experiencia del usuario.

## 📂 Estructura del Proyecto

El proyecto ha sido refactorizado para mantener una estructura de código escalable:

```
📦 scitic-app
 ┣ 📂 assets              # Imágenes y logos de la aplicación (e.g., logo.png)
 ┣ 📂 sql                 # Scripts de base de datos, RLS, triggers y RPCs
 ┣ 📂 src
 ┃ ┣ 📂 css
 ┃ ┃ ┣ 📜 styles.css      # Estilos generales del sistema y UI principal
 ┃ ┃ ┗ 📜 toast.css       # Estilos específicos para las notificaciones Toast
 ┃ ┣ 📂 js
 ┃ ┃ ┣ 📂 components      # Componentes reutilizables de UI (Toast.js)
 ┃ ┃ ┣ 📂 services        # Integraciones externas (api.js - Supabase)
 ┃ ┃ ┣ 📂 store           # Manejo de estados y lógica global (appState.js)
 ┃ ┃ ┗ 📜 main.js         # Lógica principal, controladores de vistas y DOM
 ┃ ┗ 📂 tools             # Micro-herramientas (calculadora-tubos, loss-gen-app, informes-obra)
 ┣ 📂 wiki                # 📚 WIKI TÉCNICA PROFESIONAL (Arquitectura, BD, Módulos y Guías)
 ┗ 📜 index.html          # Punto de entrada y estructura principal de la aplicación
```

## 📚 Documentación Técnica (Wiki)

Para consultar la arquitectura en profundidad, esquemas de bases de datos, guías de desarrollo y manuales de modificación rápida, consulta la **[Wiki Técnica del Sistema](wiki/README.md)**.


## 🛠️ Tecnologías Usadas

*   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+).
*   **Librerías Externas:** `Chart.js` (Gráficos), `SheetJS` (Excel).
*   **Backend & BaaS:** Supabase (PostgreSQL).

## 💡 Flujo de Trabajo (Reciente Refactorización)

El código ha sido optimizado en un modelo de responsabilidad separada:
1.  **Estado Global (`appState.js`):** Anteriormente en variables globales, ahora la aplicación centraliza `datos`, `auditoria` y flujos en una clase Store manejada vía propiedades dinámicas.
2.  **API (`api.js`):** Extracción completa de todas las solicitudes a la base de datos en una clase de servicio (`APIService`).
3.  **Componentes (`Toast.js`):** Aislamiento de UI de estado.

---
*Desarrollado para la mejora continua en control de proyectos - SCITIC S.A.S.*
