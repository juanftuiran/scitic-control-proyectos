# 06. Servicios, Estado Central y Componentes UI

> **Objetivo:** Proporcionar la referencia técnica completa de las clases y módulos que componen la capa de servicios ([`api.js`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/js/services/api.js)), el gestor de estado ([`appState.js`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/js/store/appState.js)) y el sistema de notificaciones ([`Toast.js`](file:///d:/SCITIC/SOFTWARE/scitic-app/src/js/components/Toast.js)).

---

## 🌐 1. Clase `APIService` (`src/js/services/api.js`)

Instanciada globalmente en `window.API`. Gestiona la comunicación asíncrona con **Supabase** y el almacenamiento de sesión local.

### 1.1. Autenticación y Sesión

#### `getCachedSession(): Object | null`
* **Descripción:** Lee de forma síncrona el perfil cacheado en `localStorage.getItem('scitic_user_profile')`.
* **Retorno:** Objeto `{ usuario: string, name: string, role: string }` o `null`.

#### `async login(email, password): Promise<Object | null>`
* **Descripción:** Ejecuta el inicio de sesión nativo en Supabase Auth (`signInWithPassword`). Al tener éxito, consulta la tabla `perfiles` para obtener el nombre real y el rol, almacenándolos en `localStorage`.
* **Retorno:** Perfil del usuario autenticado o `null` si falla.

#### `async logout(): Promise<void>`
* **Descripción:** Borra la clave `scitic_user_profile` del `localStorage` y llama a `this.db.auth.signOut()`.

#### `async getSession(): Promise<Object | null>`
* **Descripción:** Valida la vigencia del token JWT contra Supabase. Si la sesión expiró, purga la caché local. Si sigue vigente, refresca los datos del perfil.

---

### 1.2. Módulo de Usuarios y Saldos a Favor

#### `async getUsuarios(): Promise<Array>`
* **Descripción:** Consulta los registros de `public.perfiles` seleccionando `nombre, rol, saldo_favor` (sin acceso a contraseñas).

#### `async actualizarSaldoFavor(nombreTrabajador, nuevoSaldo): Promise<boolean>`
* **Descripción:** Actualiza el valor monetario en `perfiles.saldo_favor` para el trabajador indicado.

---

### 1.3. Módulo de Gastos y Viáticos

#### `async getGastos(): Promise<Array>`
* **Descripción:** Obtiene todos los gastos de `public.gastos` ordenados por `created_at DESC`.

#### `async crearGasto(gasto): Promise<boolean>`
* **Parámetros:** Objeto con `{ trabajador, proyecto, fecha, item, cantidad, valor, total, estado, observaciones }`.

#### `async actualizarGasto(id, updates): Promise<boolean>`
* **Descripción:** Aplica modificaciones parciales al registro indicado (por ejemplo al cambiar el estado a `'PAGO'` o registrar montos amortizados).

#### `async eliminarGasto(id): Promise<boolean>`
* **Descripción:** Borra permanentemente el registro en `public.gastos`.

---

### 1.4. Módulo de Horas, Auditoría y Proyectos de Herramientas

#### `async getRegistros(): Promise<Array>`
* **Descripción:** Retorna la lista de registros de horas laborales y novedades de `public.registros`.

#### `async crearRegistro(registro): Promise<boolean>`
* **Descripción:** Inserta una jornada en `public.registros`.

#### `async actualizarRegistro(id, registro): Promise<boolean>`
* **Descripción:** Sobrescribe la información de un registro de horas existente.

#### `async eliminarRegistro(id): Promise<boolean>`
* **Descripción:** Elimina una fila de `public.registros`.

#### `async importarRegistros(registrosArray): Promise<boolean>`
* **Descripción:** Inserción masiva de múltiples filas (usado por el importador Excel y por novedades de rango de fechas).

#### `async registrarAuditoria(log): Promise<void>`
* **Parámetros:** `{ fecha_hora, usuario, rol, accion, detalle }`.
* **Descripción:** Registra eventos críticos en la tabla inmutable `public.auditoria`.

#### `async guardarProyectoCalculadora({ id, herramienta, nombreProyecto, modo, datosJson, resumen }): Promise<Object>`
* **Descripción:** Guarda o actualiza un cálculo técnico en `public.proyectos_calculadoras`. Incluye fallback automático si la columna `resumen` no estuviese creada en la base de datos.

#### `async getProyectosCalculadora(herramienta): Promise<Array>`
* **Descripción:** Lista los proyectos guardados correspondientes a la herramienta especificada (`'calculadora-tubos'`, `'loss-gen-app'` o `'informes-obra'`).

---

## 🗃️ 2. Clase `AppStore` (`src/js/store/appState.js`)

Instanciada globalmente en `window.Store`. Maneja el estado global centralizado mediante el patrón *Observer*.

```javascript
class AppStore {
    constructor() {
        this.state = {
            datos: [],
            gastosDatos: [],
            auditoria: [],
            listaFiltradaGlobal: [],
            alertasDetalladasGlobales: [],
            editId: null,
            usuarioActual: null,
            trabajadoresActivosParaPendientes: [],
            config: { meses: [] }
        };
        this.listeners = [];
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
}
```

### Suscripción a Cambios de Estado
Para reaccionar a cambios en cualquier parte de la interfaz:
```javascript
const cancelarSuscripcion = window.Store.subscribe((nuevoEstado) => {
    console.log("El estado ha cambiado:", nuevoEstado);
    // Actualizar badges, totales o tablas
});
```

---

## 🔔 3. Componente `Toast` (`src/js/components/Toast.js`)

Proporciona notificaciones visuales emergentes flotantes (*Glassmorphism*) con auto-cierre a los 3 segundos.

### Métodos Disponibles:
```javascript
Toast.success("Mensaje de éxito");  // Fondo verde translúcido con icono ✅
Toast.error("Mensaje de error");     // Fondo rojo translúcido con icono ❌
Toast.warning("Mensaje de aviso");   // Fondo ámbar translúcido con icono ⚠️
Toast.info("Mensaje informativo");   // Fondo azul translúcido con icono ℹ️
```

### Estructura DOM Generada Dinámicamente:
```html
<div id="toast-container">
    <div class="toast toast-success toast-show">
        <span class="toast-icon">✅</span>
        <span class="toast-message">Registro creado exitosamente.</span>
    </div>
</div>
```
