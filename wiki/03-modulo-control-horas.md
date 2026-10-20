# 03. Módulo de Control de Horas y Novedades

> **Objetivo:** Detallar el funcionamiento integral del módulo de gestión de tiempo y horas de ingeniería: formulación matemática, lógica de novedades laborales, conversión de formatos de tiempo, cálculo presupuestario, alertas tempranas y procesamiento de archivos Excel.

---

## ⏱️ 1. Modos de Captura de Tiempo

El sistema cuenta con un conmutador de modo en el formulario principal que adapta los campos dinámicamente:

```
[ 💼 MODO LABORAL ]   ó   [ 🏖️ MODO NOVEDAD ]
```

### 1.1. Modo Laboral (Operación Normal)
* Destinado al registro diario de actividades de proyectos (diseño, planos, supervisión de obra, reuniones con clientes, etc.).
* **Campos requeridos:** Personal, Proyecto, Cliente, Fecha, Horas trabajadas y Actividad detallada.
* **Campos administrativos:** Horas presupuestadas (`horasPres`) y Valor tarifa hora (`valor`).

> [!NOTE]
> **Protección para Colaboradores:**  
> Si el usuario logueado tiene el rol `colaborador`, los campos `horasPres` y `valor` no son editables directamente. Al escribir el nombre de un proyecto existente, el sistema busca automáticamente registros previos de dicho proyecto y hereda el `horas_pres` y `valor` establecidos por el Administrador.

### 1.2. Modo Novedad (Permisos y Ausencias)
Diseñado para registrar ausencias justificadas sin romper las métricas de nómina ni cargar horas a proyectos comerciales.
* **Tipos de Novedad soportados:**
  * `VACACIONES`
  * `INCAPACIDAD`
  * `PERMISO REMUNERADO`
  * `CALAMIDAD DOMÉSTICA`
  * `DÍA COMPENSATORIO`
* **Modalidades de Duración:**
  1. **Día Completo (`btnDurCompleto`):** Fija automáticamente 8.0 horas en una fecha específica.
  2. **Medio Día / Parcial (`btnDurParcial`):** Permite ingresar horas personalizadas (ej. 4 horas de permiso médico).
  3. **Rango de Fechas (`btnDurRango`):** Permite registrar períodos continuos (ej. 15 días de vacaciones o 3 días de incapacidad).
     * Incluye casilla interactiva: **"Omitir Domingos" (`chkOmitirDomingos`)**.
     * Algoritmo: Itera día a día entre `fechaNovedadDesde` y `fechaNovedadHasta`, excluye domingos si la opción está activa (`curr.getDay() !== 0`), genera un array de objetos y los envía en bloque al backend con `API.importarRegistros()`.

---

## 🧮 2. Motor de Conversión de Tiempos (`HH:MM` ↔ Decimal)

Para evitar errores humanos donde los usuarios ingresan "1:30" creyendo que significa 1.3 horas (cuando en realidad son 1.5 horas decimales), el sistema cuenta con un parser inteligente en [`src/js/main.js`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/js/main.js#L30-L111):

### 2.1. Algoritmo `parsearHoras(input)`
Interpreta múltiples formatos y devuelve siempre un valor `Float` en horas decimales:

| Entrada del Usuario | Interpretación | Salida Numérica |
|---|---|---|
| `"1:30"` | Formato `HH:MM` (1 hora + 30/60 min) | `1.5` |
| `"02:45"` | Formato `HH:MM` (2 horas + 45/60 min) | `2.75` |
| `"1h30m"` ó `"1h 30"` | Formato texto con sufijo | `1.5` |
| `"45m"` | Formato minutos directos | `0.75` |
| `"90"` | Entero mayor a 24 sin punto → asume minutos (90/60) | `1.5` |
| `"1.5"` ó `"1,5"` | Decimal directo | `1.5` |

```javascript
function parsearHoras(input) {
    if (input === null || input === undefined || input === '') return 0;
    const str = String(input).trim();

    // 1. Formato HH:MM o H:MM (ej. 1:30, 01:30)
    const matchColon = str.match(/^(\d+):([0-5]?\d)$/);
    if (matchColon) {
        return parseInt(matchColon[1], 10) + (parseInt(matchColon[2], 10) / 60);
    }

    // 2. Formato con sufijos (ej. 1h30m, 90m)
    const matchHM = str.match(/^(\d+)h\s*(\d+)m?$/i);
    if (matchHM) return parseInt(matchHM[1], 10) + parseInt(matchHM[2], 10) / 60;

    const matchMOnly = str.match(/^(\d+)m$/i);
    if (matchMOnly) return parseInt(matchMOnly[1], 10) / 60;

    // 3. Número puro: si > 24 y entero, asume minutos; si no, horas decimales
    const num = parseFloat(str.replace(',', '.'));
    if (!isNaN(num)) {
        if (Number.isInteger(num) && num > 24 && !str.includes('.')) return num / 60;
        return num;
    }
    return 0;
}
```

### 2.2. Preview en Tiempo Real (`actualizarPreviewHoras`)
Al escribir en el campo de texto de horas, un indicador visual debajo del campo (`#horasPreview`) muestra instantáneamente la conversión legible:
* Si el usuario escribe `1:30`, el preview muestra: `"= 1h 30min"`.
* Si escribe `0.25`, el preview muestra: `"= 15min"`.

---

## 📊 3. Lógica Presupuestal y Alertas de Sobrecosto

Cada registro calcula el costo devengado:
$$\text{pago} = \text{horas} \times \text{valor}$$

### 3.1. Detección de Desbordamiento de Horas
La función `recalcularProgresos()` agrupa todos los registros por proyecto y evalúa:
$$\text{Horas Ejecutadas} = \sum \text{horas}_{\text{proyecto}}$$
$$\text{Porcentaje de Avance} = \left( \frac{\text{Horas Ejecutadas}}{\text{Horas Presupuestadas}} \right) \times 100$$

* Si $\text{Horas Ejecutadas} > \text{Horas Presupuestadas}$:
  * Se cataloga como proyecto en **Sobrecupo**.
  * Se añade al array `Store.state.alertasDetalladasGlobales`.
  * Se muestra en la pestaña de **Alertas** del widget inferior con barra de progreso en rojo brillante y el número de horas excedentes.

### 3.2. Widget de Personal Faltante / Reportes Pendientes
Supervisa que todos los trabajadores activos hayan reportado sus horas en la semana o mes en curso:
* Lee la lista de perfiles activos en la empresa.
* Compara contra los registros del período seleccionado.
* Identifica colaboradores con cero horas reportadas o reportes incompletos, alertando a los líderes de proyecto.

---

## 📑 4. Importación y Exportación Masiva (Excel)

La aplicación utiliza la librería `SheetJS` (`XLSX`) cargada desde CDN para no depender de librerías del lado del servidor.

### 4.1. Importación Masiva (`importarExcel`)
Permite cargar un archivo `.xlsx` con cientos de registros simultáneos:
1. El usuario selecciona el archivo mediante el botón de carga.
2. `FileReader` lee el archivo en binario.
3. Se valida que existan las cabeceras obligatorias: `TRABAJADOR`, `PROYECTO`, `FECHA`, `HORAS`.
4. Cada fila se pasa por el parser `parsearHoras()`.
5. Se insertan en la base de datos Supabase en bloques con `API.importarRegistros(registros)`.

### 4.2. Exportación a Excel (`exportarExcel`)
Descarga un archivo con los registros filtrados en pantalla:
* Genera columnas: `ID`, `CLIENTE`, `PROYECTO`, `TRABAJADOR`, `FECHA`, `HORAS (DECIMAL)`, `TIEMPO (HH:MM)`, `ACTIVIDAD`, `VALOR/H`, `TOTAL PAGO`.
* Aplica formato numérico en moneda colombiana (`COP`) para contabilidad.

---

## 📈 5. Dashboards y Gráficos (`Chart.js`)

En la vista de horas se renderiza el gráfico interactivo canvas (`#grafico`):
* **Modo Proyecto:** Muestra un gráfico de barras horizontales o dona con la concentración de horas trabajadas por proyecto.
* **Modo Actividad:** Permite visualizar qué porcentaje del tiempo se dedica a Diseño, Supervisión, Novedades o Gestión.
* Al hacer clic en un segmento del gráfico, se filtran automáticamente los registros en la tabla inferior.
