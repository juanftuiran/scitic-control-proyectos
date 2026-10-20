# 07. Guía de Desarrollo y Modificaciones (Cookbook)

> **Objetivo:** Esta es la guía práctica definitiva para desarrolladores y asistentes de Inteligencia Artificial (Antigravity). Contiene recetas paso a paso, patrones obligatorios y un checklist de verificación para realizar cambios en la aplicación sin generar regresiones.

---

## ⚡ 1. Reglas de Oro del Proyecto

1. **No romper la reactividad de `window.Store`:**  
   Nunca sustituyas directamente el objeto de estado (`Store.state = ...`). Utiliza siempre `Store.setState({ clave: valor })` o las variables sincronizadas (`datos = ...`, `gastosDatos = ...`).
2. **Siempre usar `parsearHoras()` para capturar tiempo:**  
   Cualquier input donde un usuario ingrese tiempo debe procesarse con [`parsearHoras(valor)`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/js/main.js#L36) para garantizar compatibilidad con formatos `1:30`, `1.5`, `90m`, etc.
3. **Respetar la herencia de tarifas en colaboradores:**  
   Si un usuario tiene `rol === 'colaborador'`, nunca permitas que modifique `horas_pres` ni `valor`. El sistema debe heredar estos valores automáticamente de registros previos del proyecto.
4. **Validación dual en Supabase (Frontend + RLS):**  
   Aunque ocultes botones en la interfaz según el rol, asegúrate de que la política RLS en PostgreSQL también restrinja la operación.
5. **No introducir herramientas de compilación externas:**  
   El proyecto funciona de forma nativa en cualquier servidor web estático. Todo el código debe ser JavaScript ES6+ estándar ejecutable directamente por el navegador.

---

## 🍳 2. Recetas Paso a Paso (Cookbook)

---

### 📖 Receta A: Cómo Agregar un Nuevo Campo a un Formulario (Ejemplo: "Número de Factura" en Gastos)

#### Paso 1: Agregar la columna en PostgreSQL (Supabase SQL Editor)
```sql
ALTER TABLE public.gastos 
ADD COLUMN IF NOT EXISTS num_factura TEXT DEFAULT '';
```

#### Paso 2: Agregar el campo en la interfaz HTML ([`index.html`](file:///d:/SCITIC/SOFTWARE/scitic-app/index.html))
Ubica el contenedor `#formularioGasto` y añade el nuevo input:
```html
<div class="form-group">
    <label for="gastoFactura">No. Factura / Recibo</label>
    <input type="text" id="gastoFactura" placeholder="Ej. FAC-10492" autocomplete="off">
</div>
```

#### Paso 3: Mapear el campo en la lógica de guardado ([`src/js/main.js`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/js/main.js))
En la función `guardarGasto()`:
```javascript
const numFactura = (document.getElementById('gastoFactura').value || '').trim();

let gasto = {
    // ... campos existentes
    num_factura: numFactura
};
```

#### Paso 4: Cargar el campo al editar un registro existente
En la función `editarGasto(id)`:
```javascript
document.getElementById('gastoFactura').value = gasto.num_factura || '';
```

#### Paso 5: Limpiar el campo al reiniciar el formulario
En la función `limpiarFormularioGasto()`:
```javascript
document.getElementById('gastoFactura').value = '';
```

#### Paso 6: Mostrar la columna en la tabla de resultados
En la función `renderizarTablaGastos(lista)`:
```javascript
// Agregar <th> en el <thead> y en cada fila <tr>:
`<td>${g.num_factura ? '<span class="badge">' + g.num_factura + '</span>' : '-'}</td>`
```

---

### 🔍 Receta B: Cómo Agregar un Nuevo Filtro de Búsqueda (Ejemplo: Filtro por Estado en Horas)

#### Paso 1: Añadir el elemento select en [`index.html`](file:///d:/SCITIC/SOFTWARE/scitic-app/index.html)
```html
<select id="fTipoActividad" onchange="filtrar()">
    <option value="">Todas las actividades</option>
    <option value="NOVEDADES">Solo Novedades / Permisos</option>
    <option value="PROYECTOS">Solo Proyectos Laborales</option>
</select>
```

#### Paso 2: Modificar la función `filtrar()` en [`src/js/main.js`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/js/main.js)
```javascript
function filtrar() {
    const fAct = document.getElementById('fTipoActividad').value;

    let filtrados = datos.filter(d => {
        // ... filtros existentes (cliente, trabajador, proyecto, mes)

        if (fAct === 'NOVEDADES') {
            const novedades = ['VACACIONES', 'INCAPACIDAD', 'PERMISO REMUNERADO', 'CALAMIDAD DOMÉSTICA', 'DÍA COMPENSATORIO'];
            if (!novedades.includes((d.actividad || '').toUpperCase())) return false;
        } else if (fAct === 'PROYECTOS') {
            const novedades = ['VACACIONES', 'INCAPACIDAD', 'PERMISO REMUNERADO', 'CALAMIDAD DOMÉSTICA', 'DÍA COMPENSATORIO'];
            if (novedades.includes((d.actividad || '').toUpperCase())) return false;
        }
        return true;
    });

    listaFiltradaGlobal = filtrados;
    actualizarTabla(filtrados);
    actualizarDashboard(filtrados);
}
```

#### Paso 3: Reiniciar el filtro en `limpiarFiltros()`
```javascript
document.getElementById('fTipoActividad').value = "";
```

---

### 📈 Receta C: Cómo Añadir una Nueva Tarjeta de Métrica (KPI)

1. **Definir el elemento HTML** en el contenedor correspondiente (`#statsContainer` o `#statsGastosContainer`):
   ```html
   <div class="stat-card">
       <div class="stat-icon">💰</div>
       <div class="stat-info">
           <span class="stat-label">Costo Promedio / Hora</span>
           <span class="stat-value" id="stat-costo-promedio">$0</span>
       </div>
   </div>
   ```
2. **Calcular la métrica en JavaScript** dentro de `actualizarDashboard(lista)`:
   ```javascript
   const totalHoras = lista.reduce((acc, r) => acc + (Number(r.horas) || 0), 0);
   const totalCosto = lista.reduce((acc, r) => acc + (Number(r.pago) || 0), 0);
   const promedio = totalHoras > 0 ? (totalCosto / totalHoras) : 0;

   const elKpi = document.getElementById('stat-costo-promedio');
   if (elKpi) {
       elKpi.textContent = `$${Math.round(promedio).toLocaleString('es-CO')}`;
   }
   ```

---

### 🛠️ Receta D: Cómo Integrar una Nueva Herramienta de Ingeniería

1. **Crear el directorio y archivos:**  
   Crea la carpeta en `src/tools/mi-nueva-herramienta/` con su propio `index.html`.
2. **Incluir la comunicación con la aplicación central:**  
   En el HTML o JS de tu herramienta, agrega las funciones de enlace:
   ```javascript
   function getAPI() {
       return (window.parent && window.parent.API) ? window.parent.API : window.API;
   }
   function notify(msg, type = 'success') {
       if (window.parent && window.parent.Toast) window.parent.Toast[type](msg);
       else alert(msg);
   }
   ```
3. **Agregar la tarjeta al catálogo de herramientas ([`index.html`](file:///d:/SCITIC/SOFTWARE/scitic-app/index.html)):**
   ```html
   <div class="tool-card" onclick="abrirHerramienta('src/tools/mi-nueva-herramienta/index.html', 'Mi Nueva Herramienta')">
       <div class="tool-card-icon">⚡</div>
       <div class="tool-card-body">
           <h3 class="tool-card-title">Mi Nueva Herramienta</h3>
           <p class="tool-card-desc">Descripción técnica de las funciones y cálculos que realiza.</p>
       </div>
       <button class="tool-card-btn">Abrir Aplicación →</button>
   </div>
   ```
4. **Guardar proyectos de la herramienta en Supabase:**
   ```javascript
   const api = getAPI();
   await api.guardarProyectoCalculadora({
       herramienta: 'mi-nueva-herramienta',
       nombreProyecto: 'Proyecto Ejemplo',
       modo: 'estándar',
       resumen: { items: 10, total: 500 },
       datosJson: { ...miEstadoCompleto }
   });
   ```

---

## ✅ 3. Checklist de Verificación Pre-Entrega

Antes de dar por finalizada cualquier modificación en la aplicación, verifica cada uno de los siguientes puntos:

- [ ] **Autenticación:** Iniciar sesión con un usuario `colaborador` y con un `admin` comprobando que las vistas y permisos se adapten correctamente.
- [ ] **Módulo Horas:**
  - [ ] Registrar 1 hora laboral normal.
  - [ ] Registrar una novedad con rango de fechas y verificar que se omitan los domingos.
  - [ ] Verificar que `#horasPreview` muestre la conversión correcta al escribir (ej. `2:15` $\to$ `= 2h 15min`).
  - [ ] Probar la exportación a Excel y confirmar que descargue el `.xlsx` con las columnas correctas.
- [ ] **Módulo Gastos:**
  - [ ] Registrar un gasto y comprobar que `cantidad * valor = total`.
  - [ ] Marcar múltiples gastos y verificar que la barra flotante inferior muestre el monto sumado exacto.
  - [ ] Abrir el modal de liquidación y verificar la amortización en cascada.
  - [ ] Generar el comprobante de pago y simular impresión con `Ctrl + P`.
- [ ] **Módulo Herramientas:**
  - [ ] Abrir una de las herramientas del catálogo y comprobar que el loader frosted glass se desvanezca sin trabarse.
  - [ ] Guardar un proyecto de prueba y verificar que se guarde en `public.proyectos_calculadoras`.
- [ ] **Consola del Navegador:** Abrir las DevTools (`F12`) y verificar que **no existan errores en rojo** de JavaScript o de llamadas a Supabase.
