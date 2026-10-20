# 05. Herramientas de Ingeniería (Micro-Frontends)

> **Objetivo:** Documentar la arquitectura de micro-aplicaciones integradas en **SCITIC Control de Proyectos**, el protocolo de comunicación entre los iframes y la aplicación contenedora, y el funcionamiento interno de cada herramienta técnica.

---

## 🏛️ 1. Arquitectura Micro-Frontend (Iframe Sandbox)

Para permitir que herramientas complejas con sus propias bibliotecas matemáticas y estilos gráficos coexistan sin colisionar con el CSS o JavaScript global, la aplicación utiliza una arquitectura de micro-frontends aislados mediante `<iframe>`.

```
                    [ Shell Principal: index.html ]
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
     │  calculadora-   │  │  loss-gen-app   │  │  informes-obra  │
     │      tubos      │  │ (Pérdidas TDT)  │  │ (Registro Obra) │
     └─────────────────┘  └─────────────────┘  └─────────────────┘
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   ▼
             window.parent.API  /  window.parent.Toast
```

### 1.1. Ciclo de Apertura y Transiciones
Al hacer clic en una herramienta desde el catálogo ([`#herramientasCatalogo`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/js/main.js#L1623-L1717)):
1. Se activa el **Loader Frosted Glass** (`#iframeLoader`) con efecto de desenfoque.
2. El catálogo se desvanece suavemente hacia la izquierda (`ios-view-leave`).
3. El visor (`#herramientasVisor`) entra con animación fluida tipo iOS (`ios-view-enter`).
4. El `<iframe>` carga la URL relativa (`src/tools/.../index.html`).
5. Al dispararse el evento `iframe.onload` (o un safety timeout de 700 ms), el loader se desvanece y la herramienta queda interactiva.

### 1.2. Protocolo de Comunicación con el Shell (`api.js` y `Toast.js`)
Cada herramienta implementa una función puente para reutilizar la sesión autenticada y los servicios de base de datos del sistema principal:

```javascript
// Implementado dentro de cada herramienta (iframe)
function getAPIService() {
    // 1. Si está embebida en el sistema principal, usa la API del padre
    if (window.parent && window.parent.API) return window.parent.API;
    // 2. Si se abre de forma independiente, usa su propia instancia
    if (window.API) return window.API;
    return null;
}

function showToast(mensaje, tipo = 'success') {
    if (window.parent && window.parent.Toast) {
        if (tipo === 'success') window.parent.Toast.success(mensaje);
        else if (tipo === 'error') window.parent.Toast.error(mensaje);
        else window.parent.Toast.warning(mensaje);
    } else {
        alert(mensaje);
    }
}
```

---

## 📐 2. Herramienta 1: Calculadora de Tubos (RITEL)

* **Ubicación:** [`src/tools/calculadora-tubos/`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/tools/calculadora-tubos)
* **Objetivo Normativo:** Dimensionar ductos, canalizaciones y bandejas portacables según la normativa técnica **RITEL Colombia** (Reglamento Interno de Telecomunicaciones).

### 2.1. Modos de Cálculo
* **Modo Torres (`torres.html`):** Para edificios residenciales o comerciales de múltiples pisos con ductos montantes (verticales) y de dispersión por piso.
* **Modo Parcelaciones (`parcelaciones.html`):** Para proyectos urbanísticos horizontales, condominios campestres y canalizaciones subterráneas.

### 2.2. Fórmulas RITEL Empleadas
* **Porcentaje Máximo de Ocupación:**
  * 1 cable: máx. $53\%$ de ocupación del área transversal del ducto.
  * 2 cables: máx. $31\%$.
  * 3 o más cables: máx. $40\%$ (norma estándar para red de dispersión y montante).
* **Cálculo de Área de Cables:**
  $$\text{Área Total} = \sum_{i=1}^{n} \left( \frac{\pi \times d_i^2}{4} \right)$$
* Diámetros normalizados evaluados: $1/2"$, $3/4"$, $1"$, $1\frac{1}{4}"$, $1\frac{1}{2}"$, $2"$, $2\frac{1}{2}"$, $3"$, $4"$.

### 2.3. Persistencia y Exportación
* **Guardar en Servidor:** Almacena el árbol de pisos, cables y ductos en `proyectos_calculadoras` con `herramienta = 'calculadora-tubos'`.
* **Exportar Copia de Seguridad:** Genera archivo `.json` descargable para respaldo local (`descargarBackupJSON`).
* **Memoria de Cálculo:** Exportación en PDF con tablas formateadas vía `jspdf.umd.min.js` y `jspdf.plugin.autotable.min.js`.

---

## 📡 3. Herramienta 2: Calculadora de Pérdidas TDT (`loss-gen-app`)

* **Ubicación:** [`src/tools/loss-gen-app/`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/tools/loss-gen-app)
* **Objetivo Técnico:** Diseñar y verificar el balance de potencia de radiofrecuencia (RF) para redes coaxiales de Televisión Digital Terrestre (TDT) y televisión comunitaria.

### 3.1. Parámetros de Simulación y Motor de Cálculo
Ubicados en [`js/constantes.js`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/tools/loss-gen-app/js/constantes.js) y [`js/motor-calculo.js`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/tools/loss-gen-app/js/motor-calculo.js):
* **Frecuencias de Testeo:** Canal bajo ($470\text{ MHz}$) y Canal alto ($698\text{ MHz}$).
* **Atenuación de Cables:** Modelos paramétricos para cable coaxial RG-6 ($14.5\text{ dB}/100\text{m}$ a $700\text{ MHz}$) y RG-11 ($9.2\text{ dB}/100\text{m}$).
* **Dispositivos Pasivos:** Derivadores / Taps (valores de $8\text{ dB}$ hasta $24\text{ dB}$), Splitters (2, 3 y 4 vías) y tomas terminales con carga de $75\,\Omega$.
* **Criterio de Aceptación:** El nivel de señal en cada toma de usuario debe situarse estrictamente en la ventana reglamentaria:
  $$47\text{ dB}\mu\text{V} \le \text{Nivel de Señal} \le 77\text{ dB}\mu\text{V}$$

---

## 🏗️ 4. Herramienta 3: Informes de Obra (`informes-obra`)

* **Ubicación:** [`src/tools/informes-obra/`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/tools/informes-obra)
* **Objetivo Técnico:** Levantamiento en campo de bitácoras de avance de obra para infraestructura de telecomunicaciones.

### 4.1. Funcionalidades Principales
1. **Configuración de la Edificación:** Definición de número de pisos, sótanos, torres y cantidad de apartamentos por piso.
2. **Chequeo de Red Vertical:** Registro del estado de cajas de paso, gabinetes SETI (Salón de Equipos de Telecomunicaciones Inferior) y tuberías principales.
3. **Red de Dispersión e Interior de Usuario:** Estado de tuberías a tomas de telecomunicaciones en salas y habitaciones.
4. **Registro Fotográfico:** Compresión y carga client-side de fotos de inspección.
5. **Firmas y Dictamen:** Canvas interactivo para firma del ingeniero residente y el interventor, compilando el resultado final en un informe técnico exportable.

---

## 💾 5. Formato de Persistencia en Servidor (`proyectos_calculadoras`)

Cualquiera de las 3 herramientas guarda sus proyectos en PostgreSQL bajo este esquema de payload JSON:

```json
{
  "id": "a5e8f4c2-901b-4d7a-b51c-84392a019e5f",
  "herramienta": "calculadora-tubos",
  "nombre_proyecto": "Conjunto Altos del Molino - Torre 1",
  "modo": "torres",
  "resumen": {
    "total_pisos": 12,
    "total_apartamentos": 48,
    "ducto_principal": "3 pulgadas",
    "cumple_norma": true
  },
  "datos_json": {
    "configuracion": { ... },
    "pisos": [ ... ],
    "cables": [ ... ],
    "calculos": [ ... ]
  }
}
```

> [!NOTE]
> Al separar la columna `resumen` de `datos_json`, la lista de proyectos en la interfaz carga de forma ultra-rápida sin necesidad de descargar megabytes de matrices de cálculo detalladas hasta que el usuario efectivamente decide abrir el proyecto.
