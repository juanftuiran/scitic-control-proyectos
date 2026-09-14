// ==========================================
// 1. CONFIGURACIÓN Y VARIABLES GLOBALES
// ==========================================

Object.defineProperty(window, 'datos', { get: () => window.Store.state.datos, set: (v) => window.Store.setState({datos: v}) });
Object.defineProperty(window, 'gastosDatos', { get: () => window.Store.state.gastosDatos, set: (v) => window.Store.setState({gastosDatos: v}) });
Object.defineProperty(window, 'auditoria', { get: () => window.Store.state.auditoria, set: (v) => window.Store.setState({auditoria: v}) });
Object.defineProperty(window, 'listaFiltradaGlobal', { get: () => window.Store.state.listaFiltradaGlobal, set: (v) => window.Store.setState({listaFiltradaGlobal: v}) });
Object.defineProperty(window, 'alertasDetalladasGlobales', { get: () => window.Store.state.alertasDetalladasGlobales, set: (v) => window.Store.setState({alertasDetalladasGlobales: v}) });
Object.defineProperty(window, 'editId', { get: () => window.Store.state.editId, set: (v) => window.Store.setState({editId: v}) });
Object.defineProperty(window, 'usuarioActual', { get: () => window.Store.state.usuarioActual, set: (v) => window.Store.setState({usuarioActual: v}) });
Object.defineProperty(window, 'trabajadoresActivosParaPendientes', { get: () => window.Store.state.trabajadoresActivosParaPendientes, set: (v) => window.Store.setState({trabajadoresActivosParaPendientes: v}) });

// ==========================================
// 1.5. UTILS Y LOADER
// ==========================================
function showLoader(text = "Procesando...") {
    const l = document.getElementById('global-loader');
    if(l) {
        document.getElementById('loader-text').innerText = text;
        l.style.display = 'flex';
    }
}
function hideLoader() {
    const l = document.getElementById('global-loader');
    if(l) l.style.display = 'none';
}

// ==========================================
// 1.6. CONVERSIÓN DE TIEMPO HH:MM ↔ DECIMAL
// ==========================================
/**
 * Convierte un string de tiempo a horas decimales.
 * Acepta: '1:30' → 1.5 | '1.5' → 1.5 | '90' → 1.5 (si >24, interpreta como minutos) | '1h30m' → 1.5
 */
function parsearHoras(input) {
    if (input === null || input === undefined || input === '') return 0;
    const str = String(input).trim();

    // Formato HH:MM o H:MM (ej. 1:30, 01:30)
    const matchColon = str.match(/^(\d+):([0-5]?\d)$/);
    if (matchColon) {
        const hrs = parseInt(matchColon[1], 10);
        const min = parseInt(matchColon[2], 10);
        return hrs + (min / 60);
    }

    // Formato con sufijos (ej. 1h30m, 1h30, 90m)
    const matchHM = str.match(/^(\d+)h\s*(\d+)m?$/i);
    if (matchHM) return parseInt(matchHM[1], 10) + parseInt(matchHM[2], 10) / 60;

    const matchHOnly = str.match(/^(\d+(?:\.\d+)?)h$/i);
    if (matchHOnly) return parseFloat(matchHOnly[1]);

    const matchMOnly = str.match(/^(\d+)m$/i);
    if (matchMOnly) return parseInt(matchMOnly[1], 10) / 60;

    // Número puro: si > 24, asumir minutos; si no, horas decimales
    const num = parseFloat(str.replace(',', '.'));
    if (!isNaN(num)) {
        if (Number.isInteger(num) && num > 24 && !str.includes('.')) return num / 60;
        return num;
    }

    return 0;
}

/**
 * Formatea horas decimales a string legible.
 * 1.5 → '1h 30min' | 0.5 → '30min' | 2.0 → '2h'
 */
function formatearHoras(horas) {
    const h = parseFloat(horas) || 0;
    const totalMin = Math.round(h * 60);
    const hrs = Math.floor(totalMin / 60);
    const min = totalMin % 60;
    if (hrs === 0 && min === 0) return '0h';
    if (hrs === 0) return min + 'min';
    if (min === 0) return hrs + 'h';
    return hrs + 'h ' + min + 'min';
}

/**
 * Convierte horas decimales a formato H:MM para edición.
 * 1.5 → '1:30' | 2.0 → '2:00'
 */
function decimalAHoraMM(horas) {
    const h = parseFloat(horas) || 0;
    const totalMin = Math.round(h * 60);
    const hrs = Math.floor(totalMin / 60);
    const min = totalMin % 60;
    return hrs + ':' + String(min).padStart(2, '0');
}

/**
 * Actualiza el preview en tiempo real del campo de horas.
 */
function actualizarPreviewHoras(val) {
    const preview = document.getElementById('horasPreview');
    if (!preview) return;
    if (!val || val.trim() === '' || val.trim() === '0' || val.trim() === '0:00') {
        preview.textContent = '';
        return;
    }
    const parsed = parsearHoras(val);
    if (parsed > 0) {
        preview.textContent = '= ' + formatearHoras(parsed);
    } else {
        preview.textContent = '';
    }
}

// ==========================================
// 2. INICIALIZACIÓN Y AUTENTICACIÓN
// ==========================================
async function inicializarAuth() {
    // 1. Verificamos de forma síncrona si hay sesión cacheada en el navegador
    const cachedSession = window.API.getCachedSession();

    if (cachedSession) {
        usuarioActual = cachedSession;
        // Iniciar la app de inmediato sin parpadeos de login
        iniciarApp();

        // Validar en segundo plano con Supabase para confirmar vigencia y sincronizar cambios de perfil
        window.API.getSession().then(sesionValida => {
            if (!sesionValida) {
                // Si la sesión fue revocada o expiró
                cerrarSesion();
            } else if (usuarioActual && (sesionValida.role !== usuarioActual.role || sesionValida.name !== usuarioActual.name)) {
                // Si cambiaron datos de perfil en el backend, actualizar reactivamente
                usuarioActual = sesionValida;
                document.getElementById('displayUserName').innerText = usuarioActual.name;
                document.getElementById('displayUserRole').innerText = usuarioActual.role;
                aplicarPermisos();
                aplicarPermisosWidget();
            }
        }).catch(err => {
            console.warn("Validación de sesión en background:", err);
        });
    } else {
        // No hay sesión en caché, verificar con Supabase
        showLoader("Verificando sesión...");
        const sesion = await window.API.getSession();
        hideLoader();
        if (sesion) {
            usuarioActual = sesion;
            iniciarApp();
        } else {
            document.getElementById('loginView').style.display = 'flex';
            document.getElementById('appView').style.display = 'none';
        }
    }
}

// Ejecutar inicialización inmediatamente sin esperar a window.onload
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAuth);
} else {
    inicializarAuth();
}

async function iniciarSesion() {
    const u = document.getElementById('inUser').value.trim().toLowerCase();
    const p = document.getElementById('inPass').value.trim();
    const errorMsg = document.getElementById('loginError');

    if (!u || !p) {
        Toast.warning("Por favor ingrese credenciales.");
        return;
    }

    showLoader("Autenticando...");

    try {
        // Supabase Auth — password se valida en el servidor
        const result = await window.API.login(u, p);

        if (result) {
            usuarioActual = result;
            errorMsg.style.display = 'none';
            sessionStorage.removeItem('scitic_login_audited');
            Toast.success(`Bienvenido, ${usuarioActual.name}`);
            iniciarApp();
        } else {
            errorMsg.style.display = 'block';
            Toast.error("Credenciales incorrectas.");
        }
    } catch (e) {
        Toast.error("Error de conexión con el servidor.");
    } finally {
        hideLoader();
    }
}

async function cerrarSesion() {
    sessionStorage.removeItem('scitic_login_audited');
    await window.API.logout();
    location.reload();
}

function aplicarPermisos() {
    document.querySelectorAll('.oculto-por-rol').forEach(el => el.classList.remove('oculto-por-rol'));

    if (usuarioActual.role !== 'admin') {
        document.querySelectorAll('.perm-admin-only').forEach(el => el.classList.add('oculto-por-rol'));
    }

    if (usuarioActual.role === 'colaborador' || usuarioActual.role === 'moderador') {
        document.querySelectorAll('.perm-financiero').forEach(el => el.classList.add('oculto-por-rol'));
    }

    if (usuarioActual.role === 'colaborador') {
        const inTrab = document.getElementById('trabajador');
        inTrab.value = usuarioActual.name;
        inTrab.setAttribute('readonly', 'true');
        document.querySelectorAll('.perm-trabajador-filtro').forEach(el => el.classList.add('oculto-por-rol'));
        document.querySelectorAll('.perm-mod-admin').forEach(el => el.classList.add('oculto-por-rol'));
    } else {
        document.getElementById('trabajador').removeAttribute('readonly');
    }
}

async function registrarAuditoria(accion, detalle) {
    const log = { fecha_hora: new Date().toLocaleString(), usuario: usuarioActual.name, rol: usuarioActual.role, accion: accion, detalle: detalle };
    await window.API.registrarAuditoria(log);
    auditoria.unshift(log);
}

function descargarAuditoria() {
    if (auditoria.length === 0) return Toast.warning("No hay registros de auditoría aún.");
    const ws = XLSX.utils.json_to_sheet(auditoria);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditoria_Eventos");
    XLSX.writeFile(wb, `SCITIC_Auditoria_${new Date().getTime()}.xlsx`);
    Toast.success("Auditoría descargada exitosamente.");
}

let cargandoApp = false;

async function iniciarApp() {
    if (cargandoApp) return;
    cargandoApp = true;

    showLoader("Cargando entorno de trabajo...");
    document.getElementById('loginView').style.display = 'none';
    const appView = document.getElementById('appView');
    appView.style.display = 'block';
    appView.classList.remove('ios-view-enter');
    void appView.offsetWidth;
    appView.classList.add('ios-view-enter');
    if (usuarioActual) {
        document.getElementById('displayUserName').innerText = usuarioActual.name;
        document.getElementById('displayUserRole').innerText = usuarioActual.role;
    } else {
        document.getElementById('displayUserName').innerText = "Cargando...";
    }

    aplicarPermisos();
    aplicarPermisosWidget();

    try {
        // Carga en paralelo de datos para máxima velocidad
        const [registrosDb, auditDb, gastosDb, usersDb] = await Promise.all([
            window.API.getRegistros(),
            window.API.getAuditoria(),
            window.API.getGastos(),
            window.API.getUsuarios()
        ]);

        if (registrosDb) datos = registrosDb;
        if (auditDb) auditoria = auditDb;
        if (gastosDb) gastosDatos = gastosDb;
        if (usersDb) {
            window.usuariosGlobal = usersDb;
            trabajadoresActivosParaPendientes = usersDb
                .filter(u => u.rol === 'colaborador' || u.rol === 'moderador')
                .map(u => u.nombre.trim());
        }
    } catch (e) {
        console.error("Error al cargar datos iniciales:", e);
    }

    recalcularProgresos();
    document.getElementById('fecha').value = getFechaColombiaString();

    inicializarDatosGlobales();
    inicializarDatosGlobalesGastos();

    if (usuarioActual) {
        document.getElementById('displayUserName').innerText = usuarioActual.name;
        document.getElementById('displayUserRole').innerText = usuarioActual.role;
    }
    hideLoader();
    cargandoApp = false;
    
    // Registrar login sin bloquear la carga y evitando duplicar en refrescos
    if (!sessionStorage.getItem('scitic_login_audited')) {
        sessionStorage.setItem('scitic_login_audited', 'true');
        registrarAuditoria("LOGIN", "El usuario inició sesión.");
    }
}

function generarIdUnico() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

// ==========================================
// 3. LÓGICA DE NEGOCIO Y CÁLCULOS
// ==========================================
function recalcularProgresos() {
    datos.sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0));

    const acumulador = {};
    const proyectosSuperados = new Set();
    alertasDetalladasGlobales = [];

    datos.forEach(d => {
        if (!d.proyecto) return;

        if (!acumulador[d.proyecto]) acumulador[d.proyecto] = 0;

        let horasAntes = acumulador[d.proyecto];
        acumulador[d.proyecto] += Number(d.horas || 0);
        let horasDespues = acumulador[d.proyecto];

        d.acum = horasDespues;
        d.progreso = d.horas_pres > 0 ? ((horasDespues / d.horas_pres) * 100).toFixed(1) : 0;

        if (d.horas_pres > 0 && horasAntes <= d.horas_pres && horasDespues > d.horas_pres && !proyectosSuperados.has(d.proyecto)) {
            proyectosSuperados.add(d.proyecto);
            let exceso = horasDespues - d.horas_pres;
            alertasDetalladasGlobales.push({
                proyecto: d.proyecto,
                cliente: d.cliente || 'N/A',
                trabajador: d.trabajador || 'N/A',
                fecha: d.fecha || 'N/A',
                horasPres: d.horas_pres,
                exceso: exceso
            });
        }
    });
    datos.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
}

// ==========================================
// 4. EVENTOS Y UTILIDADES DE FORMULARIO
// ==========================================

function getBadgeClassActividad(actividad) {
    switch ((actividad || '').trim().toUpperCase()) {
        case 'DISEÑO': return 'badge badge-diseno';
        case 'RRHH': return 'badge badge-rrhh';
        case 'OBRAS': return 'badge badge-obras';
        case 'PERMISO REMUNERADO': return 'badge badge-permiso';
        case 'PERMISO NO REMUNERADO': return 'badge badge-nolaboral';
        case 'INCAPACIDAD MÉDICA': return 'badge badge-incapacidad';
        case 'VACACIONES': return 'badge badge-vacaciones';
        case 'FESTIVO / NO LABORAL': return 'badge badge-nolaboral';
        default: return 'badge bg-blue';
    }
}

let modoRegistroHoras = 'laboral'; // 'laboral' | 'novedad'
let duracionNovedadModo = 'completo'; // 'completo' | 'parcial' | 'rango'

function cambiarModoRegistro(modo) {
    modoRegistroHoras = modo;
    const btnLab = document.getElementById('btnModoLaboral');
    const btnNov = document.getElementById('btnModoNovedad');
    const secNov = document.getElementById('seccionNovedad');
    const grpAct = document.getElementById('grupoActividad');

    if (!btnLab || !btnNov) return;

    if (modo === 'novedad') {
        btnLab.classList.remove('active');
        btnNov.classList.add('active', 'novedad');
        if (secNov) secNov.style.display = 'block';
        if (grpAct) grpAct.style.display = 'none';

        const proyInput = document.getElementById('proyecto');
        const clienteInput = document.getElementById('cliente');
        if (proyInput && (!proyInput.value.trim() || proyInput.value === 'SCITIC INTERNO')) {
            proyInput.value = 'SCITIC INTERNO';
            if (clienteInput) clienteInput.value = 'SCITIC S.A.S';
            document.getElementById('horasPres').value = '0';
            document.getElementById('valor').value = '0';
        }
        manejarCambioTipoNovedad();
        setDuracionNovedad(duracionNovedadModo);
    } else {
        btnLab.classList.add('active');
        btnNov.classList.remove('active', 'novedad');
        if (secNov) secNov.style.display = 'none';
        if (grpAct) grpAct.style.display = 'block';

        const proyInput = document.getElementById('proyecto');
        if (proyInput && proyInput.value === 'SCITIC INTERNO') {
            proyInput.value = '';
            const clienteInput = document.getElementById('cliente');
            if (clienteInput) clienteInput.value = '';
        }
        const filaSimple = document.getElementById('filaFechaHorasSimple');
        const campoRango = document.getElementById('campoRangoFechas');
        if (filaSimple) filaSimple.style.display = 'grid';
        if (campoRango) campoRango.style.display = 'none';
        document.getElementById('actividad').value = 'DISEÑO';
    }
}

function setDuracionNovedad(dur) {
    duracionNovedadModo = dur;
    const bCompleto = document.getElementById('btnDurCompleto');
    const bParcial = document.getElementById('btnDurParcial');
    const bRango = document.getElementById('btnDurRango');
    const filaSimple = document.getElementById('filaFechaHorasSimple');
    const campoRango = document.getElementById('campoRangoFechas');

    if (bCompleto && bParcial && bRango) {
        bCompleto.classList.remove('btn-primary'); bCompleto.classList.add('btn-secondary');
        bParcial.classList.remove('btn-primary'); bParcial.classList.add('btn-secondary');
        bRango.classList.remove('btn-primary'); bRango.classList.add('btn-secondary');

        if (dur === 'completo') {
            bCompleto.classList.remove('btn-secondary'); bCompleto.classList.add('btn-primary');
            if (filaSimple) filaSimple.style.display = 'grid';
            if (campoRango) campoRango.style.display = 'none';
            document.getElementById('horas').value = '8:00';
            actualizarPreviewHoras('8:00');
        } else if (dur === 'parcial') {
            bParcial.classList.remove('btn-secondary'); bParcial.classList.add('btn-primary');
            if (filaSimple) filaSimple.style.display = 'grid';
            if (campoRango) campoRango.style.display = 'none';
        } else if (dur === 'rango') {
            bRango.classList.remove('btn-secondary'); bRango.classList.add('btn-primary');
            if (filaSimple) filaSimple.style.display = 'none';
            if (campoRango) campoRango.style.display = 'block';

            if (!document.getElementById('fechaNovedadDesde').value) {
                document.getElementById('fechaNovedadDesde').value = getFechaColombiaString();
                document.getElementById('fechaNovedadHasta').value = getFechaColombiaString();
            }
        }
    }
}

function manejarCambioTipoNovedad() {
    const tipo = document.getElementById('tipoNovedad');
    const act = document.getElementById('actividad');
    if (tipo && act) {
        act.value = tipo.value;
    }
}
function manejarCambiosFormulario() {
    const inputTrab = (document.getElementById('trabajador').value || '').trim().toUpperCase();
    const inputProy = (document.getElementById('proyecto').value || '').trim().toUpperCase();
    const inputCliente = (document.getElementById('cliente').value || '').trim().toUpperCase();

    // 1. AUTOCOMPLETAR EXACTO (Actualiza siempre el cliente cuando detecta un proyecto existente)
    if (inputProy) {
        const proyExistente = datos.find(d => (d.proyecto || '').trim().toUpperCase() === inputProy);
        if (proyExistente) {
            document.getElementById('cliente').value = (proyExistente.cliente || "").trim();
            document.getElementById('horasPres').value = proyExistente.horas_pres || 0;
            document.getElementById('valor').value = proyExistente.valor || 0;
        }
    }

    // 2. FILTRAR DATALISTS (Limpiando espacios)
    let datosSugerencias = datos;

    if (inputTrab) {
        datosSugerencias = datosSugerencias.filter(d => (d.trabajador || '').trim().toUpperCase() === inputTrab);
    }

    if (inputCliente) {
        datosSugerencias = datosSugerencias.filter(d => (d.cliente || '').trim().toUpperCase() === inputCliente);
    }

    const clientesSet = new Set();
    const proyectosSet = new Set();
    const trabajadoresSet = new Set();

    datos.forEach(d => { if (d.trabajador) trabajadoresSet.add(d.trabajador.trim()); });

    datosSugerencias.forEach(d => {
        if (d.cliente) clientesSet.add(d.cliente.trim());
        if (d.proyecto) proyectosSet.add(d.proyecto.trim());
    });

    if (proyectosSet.size === 0) datos.forEach(d => { if (d.proyecto) proyectosSet.add(d.proyecto.trim()); });
    if (clientesSet.size === 0) datos.forEach(d => { if (d.cliente) clientesSet.add(d.cliente.trim()); });

    document.getElementById("clientesList").innerHTML = [...clientesSet].sort().map(c => `<option value="${c}"></option>`).join('');
    document.getElementById("proyectosList").innerHTML = [...proyectosSet].sort().map(p => `<option value="${p}"></option>`).join('');
    document.getElementById("trabajadoresList").innerHTML = [...trabajadoresSet].sort().map(t => `<option value="${t}"></option>`).join('');
}

function obtenerMesPorDefectoHoras() {
    const mesesGlobales = new Set();
    datos.forEach(d => {
        if (d.fecha && d.fecha.length >= 7) mesesGlobales.add(d.fecha.substring(0, 7));
    });
    const mesActualHoy = getFechaColombiaString().substring(0, 7);
    const listaMesesOrdenados = [...mesesGlobales].sort().reverse();
    if (mesesGlobales.has(mesActualHoy)) return mesActualHoy;
    if (listaMesesOrdenados.length > 0) return listaMesesOrdenados[0];
    return '';
}

function inicializarDatosGlobales() {
    const mesesGlobales = new Set();

    datos.forEach(d => {
        if (d.fecha && d.fecha.length >= 7) mesesGlobales.add(d.fecha.substring(0, 7));
    });

    const listaMesesOrdenados = [...mesesGlobales].sort().reverse();

    let fMes = document.getElementById("fMes");
    let valMesActual = fMes ? fMes.value : '';

    // Si el usuario no ha cambiado manualmente el mes o el valor actual ya no es válido, asignar mes por defecto
    let mesPorDefecto = valMesActual;
    if (!fMes || !fMes.dataset.userChanged || (valMesActual && !mesesGlobales.has(valMesActual))) {
        mesPorDefecto = obtenerMesPorDefectoHoras();
    }

    let htmlMeses = '<option value="">Todos los meses</option>';
    listaMesesOrdenados.forEach(val => {
        const selected = val === mesPorDefecto ? 'selected' : '';
        htmlMeses += `<option value="${val}" ${selected}>${val}</option>`;
    });

    if (fMes) {
        fMes.innerHTML = htmlMeses;
        fMes.value = mesPorDefecto || '';
    }

    manejarCambiosFormulario();
    filtrar();
}

// ==========================================
// 5. CORE: FILTROS Y CRUD
// ==========================================
function filtrar() {
    const fc = document.getElementById('fCliente').value;
    let ft = document.getElementById('fTrabajador').value;
    if (usuarioActual.role === 'colaborador') ft = usuarioActual.name;

    const fp = document.getElementById('fProyecto').value;
    const fMes = document.getElementById('fMes').value;
    const fBusqueda = document.getElementById('fBusqueda').value.toLowerCase();

    listaFiltradaGlobal = datos.filter(d => {
        const matchCliente = !fc || (d.cliente || '').trim() === fc;
        const matchTrabajador = !ft || (d.trabajador || '').trim() === ft;
        const matchProyecto = !fp || (d.proyecto || '').trim() === fp;
        const matchMes = !fMes || ((d.fecha || '') && (d.fecha || '').substring(0, 7) === fMes);

        let matchBusqueda = true;
        if (fBusqueda) {
            const textoFila = `${d.cliente || ''} ${d.proyecto || ''} ${d.trabajador || ''} ${d.actividad || ''}`.toLowerCase();
            matchBusqueda = textoFila.includes(fBusqueda);
        }
        return matchCliente && matchTrabajador && matchProyecto && matchMes && matchBusqueda;
    });

    mostrar(listaFiltradaGlobal);
    graficar(listaFiltradaGlobal);
    if (usuarioActual.role === 'admin') {
        generarAlertas();
        generarDesgloseAdmin(listaFiltradaGlobal);
    }
    generarPendientes();

    const datosParaCliente = datos.filter(d => (!ft || (d.trabajador || '').trim() === ft) && (!fp || (d.proyecto || '').trim() === fp));
    const clientesSet = new Set(datosParaCliente.map(d => (d.cliente || '').trim()).filter(Boolean));

    const datosParaTrabajador = datos.filter(d => (!fc || (d.cliente || '').trim() === fc) && (!fp || (d.proyecto || '').trim() === fp));
    const trabajadoresSet = new Set(datosParaTrabajador.map(d => (d.trabajador || '').trim()).filter(Boolean));

    const datosParaProyecto = datos.filter(d => (!fc || (d.cliente || '').trim() === fc) && (!ft || (d.trabajador || '').trim() === ft));
    const proyectosSet = new Set(datosParaProyecto.map(d => (d.proyecto || '').trim()).filter(Boolean));

    llenarSelectManteniendoValor('fCliente', clientesSet, fc);
    if (usuarioActual.role !== 'colaborador') llenarSelectManteniendoValor('fTrabajador', trabajadoresSet, ft);
    llenarSelectManteniendoValor('fProyecto', proyectosSet, fp);
}

function llenarSelectManteniendoValor(id, set, valorActual) {
    const el = document.getElementById(id);
    if (!el) return;
    let html = '<option value="">Todos</option>';
    [...set].sort().forEach(val => {
        const selected = val === valorActual ? 'selected' : '';
        html += `<option value="${val}" ${selected}>${val}</option>`;
    });
    el.innerHTML = html;
}

function limpiarFiltros() {
    document.getElementById('fCliente').value = "";
    if (usuarioActual.role !== 'colaborador') document.getElementById('fTrabajador').value = "";
    document.getElementById('fProyecto').value = "";
    const fMes = document.getElementById('fMes');
    if (fMes) {
        delete fMes.dataset.userChanged;
        fMes.value = obtenerMesPorDefectoHoras();
    }
    document.getElementById('fBusqueda').value = "";
    filtrar();
}

async function guardar() {
    let trabajadorVal = document.getElementById('trabajador').value;
    if (usuarioActual.role === 'colaborador') trabajadorVal = usuarioActual.name;

    trabajadorVal = (trabajadorVal || '').trim();
    const proyectoVal = (document.getElementById('proyecto').value || '').trim();
    const clienteVal = (document.getElementById('cliente').value || '').trim();

    if (!trabajadorVal) return Toast.warning("Debe ingresar el nombre del personal.");
    if (!proyectoVal) return Toast.warning("Debe ingresar el nombre del proyecto.");

    // Caso Rango de Fechas para Novedades (Incapacidades prolongadas / vacaciones)
    if (modoRegistroHoras === 'novedad' && duracionNovedadModo === 'rango' && editId === null) {
        const fechaDesde = document.getElementById('fechaNovedadDesde').value;
        const fechaHasta = document.getElementById('fechaNovedadHasta').value;
        const chkDomingos = document.getElementById('chkOmitirDomingos');
        const omitirDomingos = chkDomingos ? chkDomingos.checked : true;
        const tipoNovedad = document.getElementById('tipoNovedad') ? document.getElementById('tipoNovedad').value : 'PERMISO REMUNERADO';

        if (!fechaDesde || !fechaHasta) return Toast.warning("Debe ingresar fecha inicial y final del rango.");
        if (fechaDesde > fechaHasta) return Toast.warning("La fecha inicial no puede ser posterior a la fecha final.");

        showLoader("Registrando período de novedad...");
        const dInicio = new Date(fechaDesde + 'T00:00:00');
        const dFin = new Date(fechaHasta + 'T00:00:00');
        let curr = new Date(dInicio);
        const nuevosRegistros = [];
        const valorHora = Number(document.getElementById('valor').value) || 0;

        while (curr <= dFin) {
            const dayOfWeek = curr.getDay(); // 0 = Domingo
            if (!omitirDomingos || dayOfWeek !== 0) {
                const fStr = curr.toISOString().split('T')[0];
                nuevosRegistros.push({
                    id: generarIdUnico(),
                    cliente: clienteVal || "SCITIC S.A.S",
                    proyecto: proyectoVal || "SCITIC INTERNO",
                    trabajador: trabajadorVal,
                    fecha: fStr,
                    horas: 8,
                    actividad: tipoNovedad,
                    horas_pres: 0,
                    valor: valorHora,
                    pago: valorHora * 8
                });
            }
            curr.setDate(curr.getDate() + 1);
        }

        if (nuevosRegistros.length === 0) {
            hideLoader();
            return Toast.warning("No hay días hábiles dentro del rango seleccionado.");
        }

        const success = await window.API.importarRegistros(nuevosRegistros);
        if (success) {
            datos = datos.concat(nuevosRegistros);
            recalcularProgresos();
            await registrarAuditoria("NOVEDAD_RANGO", `Registró ${nuevosRegistros.length} días de ${tipoNovedad} para ${trabajadorVal} (${fechaDesde} a ${fechaHasta}).`);
            inicializarDatosGlobales();
            limpiarFormulario();
            Toast.success(`Se registraron ${nuevosRegistros.length} días de ${tipoNovedad} correctamente.`);
        }
        hideLoader();
        return;
    }

    showLoader("Guardando registro...");

    let obj = {
        id: editId !== null ? editId : generarIdUnico(),
        cliente: clienteVal,
        proyecto: proyectoVal,
        trabajador: trabajadorVal,
        fecha: document.getElementById('fecha').value,
        horas: parsearHoras(document.getElementById('horas').value),
        actividad: document.getElementById('actividad').value,
        horas_pres: Number(document.getElementById('horasPres').value) || 0,
        valor: Number(document.getElementById('valor').value) || 0
    };

    if (usuarioActual.role === 'colaborador') {
        const proyExistente = datos.find(d => (d.proyecto || '').trim().toUpperCase() === obj.proyecto.toUpperCase());
        if (proyExistente) {
            obj.horas_pres = proyExistente.horas_pres || 0;
            obj.valor = proyExistente.valor || 0;
            if (!obj.cliente) obj.cliente = (proyExistente.cliente || "").trim();
        }
    }

    obj.pago = obj.horas * obj.valor;
    let accionAuditoria = "";

    if (editId !== null) {
        const index = datos.findIndex(d => d.id === editId);
        if (index !== -1) {
            const success = await window.API.actualizarRegistro(editId, obj);
            if (success) {
                datos[index] = obj;
                accionAuditoria = `EDITAR: Modificó horas a ${formatearHoras(obj.horas)} en proy. ${obj.proyecto}`;
                Toast.success("Registro actualizado exitosamente.");
            }
        }
    } else {
        const success = await window.API.crearRegistro(obj);
        if (success) {
            datos.push(obj);
            accionAuditoria = `CREAR: Registró ${formatearHoras(obj.horas)} en proy. ${obj.proyecto}`;
            Toast.success("Registro creado exitosamente.");
        }
    }

    recalcularProgresos();
    registrarAuditoria(editId ? "EDICIÓN" : "CREACIÓN", accionAuditoria);

    inicializarDatosGlobales();
    limpiarFormulario();
    hideLoader();
}

function generarAlertas() {
    const container = document.getElementById('alertasContainer');

    if (alertasDetalladasGlobales.length === 0) {
        container.innerHTML = `<div class="alert-item" style="cursor: default; background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.2); flex-direction: row; align-items: center; justify-content: center; height: 100%;"><span style="font-size: 2rem; margin-right:15px;">✨</span><p style="color: var(--success); margin: 0; font-weight: 600; font-size: 1rem;">Márgenes operativos saludables.</p></div>`;
        return;
    }

    let html = '';
    alertasDetalladasGlobales.forEach((al, i) => {
        html += `
        <div class="alert-item" onclick="verDetalle('${al.proyecto}')" style="animation-delay: ${i * 0.05}s;">
            <div class="alert-header">
                <strong style="color: var(--scitic-dark); font-size: 1.05rem;">${al.proyecto}</strong>
                <span style="background: var(--danger-bg); color: var(--danger); padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 700; font-size:0.75rem; border: 1px solid rgba(239,68,68,0.3);">+${formatearHoras(al.exceso)}</span>
            </div>
            <small style="color: var(--text-muted);">${al.cliente || 'Sin Cliente'}</small>
            <div class="alert-detail">
                🚨 <strong>${al.trabajador}</strong> reportó horas que superaron el límite de ${formatearHoras(al.horasPres)} el <strong>${al.fecha}</strong>.
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function filtrarDesdeDesglose(proyecto) {
    document.getElementById('fProyecto').value = proyecto;
    filtrar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function generarDesgloseAdmin(lista) {
    if (usuarioActual.role !== 'admin') return;

    const container = document.getElementById('adminDesgloseContainer');
    const content = document.getElementById('adminDesgloseContent');
    container.style.display = 'block';

    const resumenAdmin = {};
    lista.forEach(d => {
        if (!d.proyecto) return;
        const proyTrim = d.proyecto.trim();
        if (!resumenAdmin[proyTrim]) {
            resumenAdmin[proyTrim] = { horasPres: d.horas_pres || 0, trabajadores: {}, totalHoras: 0 };
        }
        const trab = (d.trabajador || 'Desconocido').trim();
        if (!resumenAdmin[proyTrim].trabajadores[trab]) {
            resumenAdmin[proyTrim].trabajadores[trab] = { horas: 0, costo: 0 };
        }
        resumenAdmin[proyTrim].trabajadores[trab].horas += Number(d.horas || 0);
        resumenAdmin[proyTrim].trabajadores[trab].costo += Number(d.pago || 0);
        resumenAdmin[proyTrim].totalHoras += Number(d.horas || 0);
    });

    let html = '';
    for (const [proyecto, data] of Object.entries(resumenAdmin)) {
        let colorClase = data.totalHoras > data.horasPres && data.horasPres > 0 ? "color: var(--danger)" : "color: var(--success)";

        html += `<div class="admin-project-card">
            <h4 class="admin-project-title" onclick="filtrarDesdeDesglose('${proyecto}')">
                ${proyecto} 
                <span style="font-size:0.75rem; font-weight:normal; ${colorClase}; display:block; margin-top:6px; letter-spacing: 0.5px;">(${formatearHoras(data.totalHoras)} USADAS / ${formatearHoras(data.horasPres)} PRESUP.)</span>
            </h4>`;

        for (const [trabajador, stats] of Object.entries(data.trabajadores)) {
            html += `<div class="worker-stat">
                <span class="worker-name"><span style="color:var(--text-muted)">👤</span> ${trabajador}</span>
                <span style="text-align: right"><strong title="${stats.horas} h">${formatearHoras(stats.horas)}</strong> <br><small style="color: var(--primary)">$${stats.costo.toLocaleString('es-CO')}</small></span>
            </div>`;
        }
        html += `</div>`;
    }
    content.innerHTML = html;
}

function mostrar(lista) {
    let totalH = 0; let totalP = 0; const proyActivos = new Set(); let htmlTabla = "";

    const listaOrdenada = [...lista].sort((a, b) => {
        const fechaA = new Date(a.fecha || 0); const fechaB = new Date(b.fecha || 0);
        if (fechaB.getTime() === fechaA.getTime()) return (b.id || '').localeCompare(a.id || '');
        return fechaB - fechaA;
    });

    const esAdmin = usuarioActual.role === 'admin';

    listaOrdenada.forEach((d, index) => {
        totalH += Number(d.horas || 0); totalP += Number(d.pago || 0);
        if (d.proyecto) proyActivos.add(d.proyecto.trim());
        const animDelay = Math.min(index * 0.02, 0.5);

        const puedeEditar = esAdmin || usuarioActual.role === 'moderador' || ((d.trabajador || '').trim() === usuarioActual.name.trim());

        htmlTabla += `
        <tr class="animated-row" style="animation-delay: ${animDelay}s;">
            <td style="color:var(--text-muted); font-size: 0.85rem; font-weight: 500;">${d.fecha || 'N/A'}</td>
            <td><span class="project-link" onclick="verDetalle('${(d.proyecto || '').trim()}')">${(d.proyecto || '').trim() || 'N/A'}</span><br><small style="color:var(--text-muted)">${(d.cliente || '').trim() || ''}</small></td>
            <td style="font-weight: 500;">${(d.trabajador || '').trim() || 'N/A'}</td>
            <td><strong style="color: var(--scitic-dark);" title="${d.horas || 0} h decimal">${formatearHoras(d.horas || 0)}</strong></td>
            ${esAdmin ? `<td style="color: var(--primary); font-weight: 600;">$${Number(d.pago || 0).toLocaleString('es-CO')}</td>` : ''}
            ${esAdmin ? `<td><div class="progress-bar-container"><div class="progress-bar" style="width: ${Math.min(d.progreso || 0, 100)}%; ${Number(d.progreso || 0) > 100 ? 'background:linear-gradient(135deg, #ef4444, #dc2626);' : ''}"></div></div><small style="${Number(d.progreso || 0) > 100 ? 'color: var(--danger); font-weight:bold;' : ''}">${d.progreso || 0}%</small></td>` : ''}
            <td><span class="${getBadgeClassActividad(d.actividad)}">${d.actividad || 'N/A'}</span></td>
            <td><div class="action-btns">
                    ${puedeEditar ? `<button onclick="editar('${d.id}')" style="color: var(--accent); font-weight: 600;">Editar</button>` : ''}
                    ${esAdmin ? `<button onclick="eliminar('${d.id}')" style="color: var(--danger); font-weight: 600;">Borrar</button>` : ''}
            </div></td>
        </tr>`;
    });

    document.getElementById('tabla').innerHTML = htmlTabla;
    // Animar las horas filtradas; al terminar, mostrar en formato legible
    animarNumero('stat-horas', totalH, " h");
    if (esAdmin) animarNumero('stat-presupuesto', totalP, "$", true);
    animarNumero('stat-proyectos', proyActivos.size, "");
}

function animarNumero(id, finalValue, sufijo, esMoneda = false) {
    const obj = document.getElementById(id); 
    if (!obj) return;
    
    // Safety check for NaN / null / undefined
    let val = parseFloat(finalValue);
    if (isNaN(val) || val === null || val === undefined) val = 0;

    const formatearValor = (v) => {
        if (id === 'stat-horas') {
            return formatearHoras(v);
        }
        if (esMoneda) {
            return sufijo + Math.round(v).toLocaleString('es-CO');
        }
        return Math.round(v).toLocaleString('es-CO') + (sufijo || '');
    };

    // Si el elemento no es visible (display:none), asignar formateado directamente
    if (obj.offsetParent === null) {
        obj.innerHTML = formatearValor(val);
        return;
    }

    if (obj._animFrameId) {
        window.cancelAnimationFrame(obj._animFrameId);
    }

    let startTimestamp = null; 
    const duration = 600;

    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = easeOut * val;

        if (progress < 1) {
            obj.innerHTML = formatearValor(currentVal);
            obj._animFrameId = window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = formatearValor(val);
            obj._animFrameId = null;
        }
    };

    obj._animFrameId = window.requestAnimationFrame(step);
}

function verDetalle(nombre) {
    if (!nombre) return;
    const registros = datos.filter(d => (d.proyecto || '').trim() === nombre);
    if (registros.length === 0) return;
    document.getElementById('modalNombreProy').innerText = nombre;
    document.getElementById('modalCliente').innerText = (registros[0].cliente || '').trim();
    let h = 0, c = 0; let act = { DISEÑO: 0, RRHH: 0, OBRAS: 0 };
    registros.forEach(r => { h += Number(r.horas || 0); c += Number(r.pago || 0); if (act[r.actividad] !== undefined) act[r.actividad] += Number(r.horas || 0); });
        document.getElementById('mHoras').innerText = formatearHoras(h);
    document.getElementById('mCosto').innerText = "$" + c.toLocaleString('es-CO');
    document.getElementById('mActividades').innerHTML = Object.entries(act).map(([k, v]) => `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;"><span style="font-weight: 600; color: var(--scitic-dark);"><span class="badge bg-blue">${k}</span></span><span style="font-size: 1.1rem; color: var(--primary); font-weight: 600;">${formatearHoras(v)}</span></div>`).join("");
    document.getElementById('detalleModal').classList.add('show');
}

function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => { if (!modal.classList.contains('show')) modal.style.display = 'none'; modal.style.display = ''; }, 300);
}

// ==========================================
// 6. UI Y GRÁFICOS
// ==========================================
let actividadGraficoHoras = 'DISEÑO';

function coincideActividadGrafico(actDato, actFiltro) {
    if (!actFiltro || actFiltro === 'TODAS') return true;
    if (!actDato) return false;
    const cleanDato = String(actDato).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleanFiltro = String(actFiltro).trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return cleanDato === cleanFiltro;
}

function cambiarActividadGrafico(act) {
    actividadGraficoHoras = act || 'DISEÑO';
    const container = document.getElementById('actividadGraficoTabs');
    if (container) {
        container.querySelectorAll('.widget-tab').forEach(tab => {
            if (tab.getAttribute('data-act') === actividadGraficoHoras) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }
    graficar(listaFiltradaGlobal || []);
}

function graficar(listaFiltrada) {
    const ctx = document.getElementById("grafico"); 
    if(!ctx || ctx.offsetParent === null) return; // No graficar si está oculto

    // Filtrar por la actividad seleccionada en los tabs si no es 'TODAS'
    const datosGrafico = (actividadGraficoHoras && actividadGraficoHoras !== 'TODAS')
        ? (listaFiltrada || []).filter(d => coincideActividadGrafico(d.actividad, actividadGraficoHoras))
        : (listaFiltrada || []);

    const resumen = {};
    datosGrafico.forEach(d => {
        if (d.proyecto) {
            const p = d.proyecto.trim();
            resumen[p] = (resumen[p] || 0) + Number(d.horas || 0);
        }
    });
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';
    if (window.chart) window.chart.destroy();

    // Colores personalizados según la actividad seleccionada
    let colorStart = '#ea580c', colorEnd = '#c2410c', hoverColor = '#f97316';
    if (actividadGraficoHoras === 'OBRAS') {
        colorStart = '#10b981'; colorEnd = '#059669'; hoverColor = '#34d399';
    } else if (actividadGraficoHoras === 'RRHH') {
        colorStart = '#8b5cf6'; colorEnd = '#6d28d9'; hoverColor = '#a78bfa';
    } else if (actividadGraficoHoras === 'TODAS') {
        colorStart = '#3b82f6'; colorEnd = '#1d4ed8'; hoverColor = '#60a5fa';
    }

    let gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);

    // Ordenar de mayor a menor horas para una mejor visualización ejecutiva
    const sortedEntries = Object.entries(resumen).sort((a, b) => b[1] - a[1]);
    const labels = sortedEntries.map(e => e[0]);
    const dataValues = sortedEntries.map(e => e[1]);

    const actNombreDisplay = actividadGraficoHoras === 'DISEÑO' ? 'Diseño'
        : actividadGraficoHoras === 'OBRAS' ? 'Obras'
        : actividadGraficoHoras === 'RRHH' ? 'RRHH'
        : 'Todas';

    window.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Horas (${actNombreDisplay})`,
                data: dataValues,
                backgroundColor: gradient,
                hoverBackgroundColor: hoverColor,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#94a3b8',
                    padding: 12,
                    cornerRadius: 8,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return ` ${context.parsed.y || 0} horas`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    beginAtZero: true
                },
                x: {
                    grid: { display: false }
                }
            },
            onClick: (e, items) => {
                if (items.length > 0) {
                    document.getElementById('fProyecto').value = window.chart.data.labels[items[0].index];
                    filtrar();
                }
            }
        }
    });
}

// ==========================================
// 7. IMPORTACIÓN Y EXPORTACIÓN (EXCEL)
// ==========================================
function formatExcelDate(excelDate) {
    if (!excelDate) return ""; if (typeof excelDate === 'string') return excelDate;
    if (typeof excelDate === 'number') {
        const jsDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        jsDate.setMinutes(jsDate.getMinutes() + jsDate.getTimezoneOffset());
        return `${jsDate.getFullYear()}-${String(jsDate.getMonth() + 1).padStart(2, '0')}-${String(jsDate.getDate()).padStart(2, '0')}`;
    }
    return String(excelDate);
}

function esDatoBasura(str) {
    if (!str) return true;
    const texto = str.toString().toUpperCase().trim();
    const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    return meses.includes(texto) || ["CLIENTE", "PROYECTO", "TRABAJADOR"].includes(texto);
}

function importarExcel() {
    if (usuarioActual.role !== 'admin') return Toast.error("Acceso denegado.");
    const file = document.getElementById('excelFile').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
        showLoader("Importando registros...");
        const data = new Uint8Array(e.target.result); const wb = XLSX.read(data, { type: "array" });
        let importados = [];
        wb.SheetNames.forEach(sheetName => {
            const raw = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
            let headerIdx = 0; for (let i = 0; i < 15; i++) { if (raw[i] && (raw[i].includes("Proyecto") || raw[i].includes("Cliente"))) { headerIdx = i; break; } }
            const json = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { range: headerIdx, defval: "" });
            json.forEach(r => {
                if (esDatoBasura(r.Cliente) && esDatoBasura(r.Proyecto)) return;
                if (!r.Proyecto && !r.Trabajador) return;
                importados.push({
                    id: generarIdUnico(), cliente: (r.Cliente || "").trim(), proyecto: (r.Proyecto || "").trim(), trabajador: (r.Trabajador || sheetName).trim(),
                    horas_pres: Number(r["Horas Presupuestadas"]) || 0, fecha: formatExcelDate(r.Fecha) || "", horas: Number(r["Horas Trabajadas"]) || 0,
                    valor: Number(r["Valor Hora"]) || 0, actividad: r.Actividad || "DISEÑO", pago: Number(r["Pago Día"]) || (Number(r["Horas Trabajadas"]) * Number(r["Valor Hora"])) || 0,
                });
            });
        });

        const success = await window.API.importarRegistros(importados);
        if (success) {
            datos = datos.concat(importados);
            recalcularProgresos();
            await registrarAuditoria("IMPORTAR", `Se importaron ${importados.length} registros desde Excel.`);
            inicializarDatosGlobales();
            document.getElementById('excelFile').value = '';
            Toast.success(`Éxito: Se importaron ${importados.length} registros.`);
        }
        hideLoader();
    };
    reader.readAsArrayBuffer(file);
}

async function exportarExcel() {
    if (listaFiltradaGlobal.length === 0) return Toast.warning("No hay datos para exportar.");
    const esAdmin = usuarioActual.role === 'admin';
    const datosSalida = listaFiltradaGlobal.map(d => {
        let fila = { "Fecha": d.fecha, "Cliente": (d.cliente || '').trim(), "Proyecto": (d.proyecto || '').trim(), "Trabajador": (d.trabajador || '').trim(), "Actividad": d.actividad, "Horas Trabajadas": d.horas };
        if (esAdmin) {
            fila["Horas Presupuestadas"] = d.horas_pres; fila["Valor Hora"] = d.valor;
            fila["Pago Día"] = d.pago; fila["Horas Acumuladas"] = d.acum;
            fila["Progreso (%)"] = d.progreso ? (Number(d.progreso) / 100) : 0;
        }
        return fila;
    });
    await registrarAuditoria("EXPORTAR", `El usuario exportó un reporte a Excel.`);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datosSalida), "Reporte");
    XLSX.writeFile(wb, `SCITIC_Reporte_${new Date().toISOString().split('T')[0]}.xlsx`);
    Toast.success("Reporte exportado exitosamente.");
}

function limpiarFormulario() {
    document.getElementById('cliente').value = "";
    document.getElementById('proyecto').value = "";
    if (usuarioActual.role !== 'colaborador') {
        document.getElementById('trabajador').value = "";
    }
    document.getElementById('horasPres').value = "0";
    document.getElementById('horas').value = "0";
    const previewEl = document.getElementById('horasPreview');
    if (previewEl) previewEl.textContent = '';
    document.getElementById('valor').value = "0";
    document.getElementById('fecha').value = getFechaColombiaString();
    document.getElementById('actividad').value = "DISEÑO";

    cambiarModoRegistro('laboral');

    editId = null;
    document.getElementById('formTitle').innerText = "Nuevo Registro";
    document.getElementById('formularioRegistro').classList.remove('editing-mode');
    document.getElementById('btnGuardar').innerText = "Guardar Actividad";

    document.getElementById('btnLimpiar').style.display = "block";
    document.getElementById('btnCancelar').style.display = "none";

    // Recalcular las listas desplegables vacías (o filtradas por el trabajador si es colaborador)
    manejarCambiosFormulario();

    // Ocultar botones × de limpieza
    document.querySelectorAll('.btn-clear').forEach(btn => btn.classList.remove('visible'));
}

async function eliminar(id) {
    if (usuarioActual.role !== 'admin') return;
    const registro = datos.find(d => d.id === id);
    if (confirm("¿Seguro que deseas eliminar permanentemente este registro?")) {
        showLoader("Eliminando registro...");
        const success = await window.API.eliminarRegistro(id);
        if (success) {
            datos = datos.filter(d => d.id !== id);
            recalcularProgresos();
            await registrarAuditoria("ELIMINAR", `Se borró registro de ${formatearHoras(registro.horas)} de ${registro.trabajador} en ${registro.proyecto}.`);
            inicializarDatosGlobales();
            if (editId === id) limpiarFormulario();
            Toast.success("Registro eliminado.");
        }
        hideLoader();
    }
}

function editar(id) {
    const d = datos.find(x => x.id === id); if (!d) return;
    if (usuarioActual.role === 'colaborador' && (d.trabajador || '').trim() !== usuarioActual.name.trim()) return Toast.error("Permiso denegado.");

    document.getElementById('cliente').value = (d.cliente || '').trim();
    document.getElementById('proyecto').value = (d.proyecto || '').trim();
    document.getElementById('trabajador').value = (d.trabajador || '').trim();
    document.getElementById('horasPres').value = d.horas_pres || 0;
    document.getElementById('fecha').value = d.fecha || new Date().toISOString().split('T')[0];
    document.getElementById('horas').value = d.horas ? decimalAHoraMM(d.horas) : '0:00';
    actualizarPreviewHoras(document.getElementById('horas').value);
    document.getElementById('valor').value = d.valor || 0;

    const esNovedad = ['PERMISO REMUNERADO', 'PERMISO NO REMUNERADO', 'INCAPACIDAD MÉDICA', 'VACACIONES', 'FESTIVO / NO LABORAL'].includes((d.actividad || '').trim().toUpperCase());
    if (esNovedad) {
        cambiarModoRegistro('novedad');
        const tipoNov = document.getElementById('tipoNovedad');
        if (tipoNov) tipoNov.value = d.actividad;
        setDuracionNovedad('parcial');
    } else {
        cambiarModoRegistro('laboral');
    }
    document.getElementById('actividad').value = d.actividad || "DISEÑO";

    editId = id;
    document.getElementById('formTitle').innerText = "Editando Actividad";
    document.getElementById('formularioRegistro').classList.add('editing-mode');
    document.getElementById('btnGuardar').innerText = "Actualizar Registro";

    document.getElementById('btnLimpiar').style.display = "none";
    document.getElementById('btnCancelar').style.display = "block";

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Mostrar botones × en campos que tengan valor
    ['trabajador', 'proyecto', 'cliente'].forEach(id => {
        const inp = document.getElementById(id);
        if (inp) toggleClearBtn(inp);
    });
}

// ==========================================
// 8. UTILIDADES DE UX (Clear Buttons & Widgets)
// ==========================================
function clearInput(inputId) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    inp.value = '';
    toggleClearBtn(inp);

    // Si se limpia "proyecto", también limpiar "cliente"
    if (inputId === 'proyecto') {
        const clienteInp = document.getElementById('cliente');
        if (clienteInp) {
            clienteInp.value = '';
            toggleClearBtn(clienteInp);
        }
    }

    manejarCambiosFormulario();
    inp.focus();
}

function toggleClearBtn(inputEl) {
    const btn = inputEl.parentElement.querySelector('.btn-clear');
    if (!btn) return;
    if (inputEl.value.trim().length > 0) {
        btn.classList.add('visible');
    } else {
        btn.classList.remove('visible');
    }
}

// ==========================================
// 9. WIDGET TABS (Alertas / Pendientes)
// ==========================================
function switchWidget(panel) {
    const panelAlertas = document.getElementById('widgetAlertas');
    const panelPendientes = document.getElementById('widgetPendientes');
    const tabAlertas = document.getElementById('tabAlertas');
    const tabPendientes = document.getElementById('tabPendientes');

    if (panel === 'alertas') {
        panelAlertas.style.display = 'block';
        panelPendientes.style.display = 'none';
        tabAlertas.classList.add('active');
        tabPendientes.classList.remove('active');
    } else {
        panelAlertas.style.display = 'none';
        panelPendientes.style.display = 'block';
        tabAlertas.classList.remove('active');
        tabPendientes.classList.add('active');
    }
}

function aplicarPermisosWidget() {
    const tabAlertas = document.getElementById('tabAlertas');

    if (usuarioActual.role === 'colaborador' || usuarioActual.role === 'moderador') {
        // Colaboradores/moderadores: solo ven Pendientes, ocultar tab de Alertas
        tabAlertas.style.display = 'none';
        switchWidget('pendientes');
    } else {
        // Admin: ve ambas tabs, empieza en Alertas
        tabAlertas.style.display = '';
        switchWidget('alertas');
    }
}

function generarPendientes() {
    const container = document.getElementById('pendientesContainer');
    if (!container) return;

    // 1. Determinar el mes a analizar
    let mesAnalisis = document.getElementById('fMes').value;

    // Si no hay filtro, buscamos el mes más reciente con registros en la base de datos
    if (!mesAnalisis && datos.length > 0) {
        const fechas = datos.map(d => d.fecha).filter(Boolean).sort().reverse();
        if (fechas.length > 0) {
            mesAnalisis = fechas[0].substring(0, 7); // YYYY-MM del registro más nuevo
        }
    }

    // Fallback al mes actual si no hay datos ni filtros
    if (!mesAnalisis) {
        const d = new Date();
        mesAnalisis = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    if (trabajadoresActivosParaPendientes.length < 2) {
        container.innerHTML = `<div style="text-align: center; padding: 20px;"><span style="font-size: 2rem;">✅</span><p style="color: var(--text-muted); margin: 8px 0 0; font-weight: 500;">No hay suficientes trabajadores activos para comparar.</p></div>`;
        return;
    }

    // Agrupar registros existentes por fecha
    const registrosPorFecha = {};
    datos.forEach(d => {
        if (!d.fecha || !d.trabajador) return;
        if (!registrosPorFecha[d.fecha]) registrosPorFecha[d.fecha] = new Set();
        registrosPorFecha[d.fecha].add(d.trabajador.trim());
    });

    const hoy = new Date();
    const hace60DiasAlertas = new Date(hoy.getTime() - 60 * 24 * 60 * 60 * 1000);
    const pendientes = [];
    const fechasOrdenadas = Object.keys(registrosPorFecha).sort().reverse();

    for (const fecha of fechasOrdenadas) {
        // FILTRO DE MES: Solo evaluamos fechas que coincidan con el mes de análisis
        if (!fecha.startsWith(mesAnalisis)) continue;

        const fechaDate = new Date(fecha);
        if (fechaDate < hace60DiasAlertas && !document.getElementById('fMes').value) continue;

        const trabajadoresConRegistro = registrosPorFecha[fecha];

        // Solo evaluamos días donde al menos 2 personas registraron (día laborable probable)
        if (trabajadoresConRegistro.size < 2) continue;

        const faltantes = [];
        trabajadoresActivosParaPendientes.forEach(t => {
            if (!trabajadoresConRegistro.has(t)) {
                faltantes.push(t);
            }
        });

        if (faltantes.length > 0 && faltantes.length < trabajadoresActivosParaPendientes.length) {
            pendientes.push({ fecha, faltantes, totalActivos: trabajadoresConRegistro.size });
        }
    }

    if (pendientes.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 20px;"><span style="font-size: 2rem;">🎉</span><p style="color: var(--success); margin: 8px 0 0; font-weight: 600;">Todos los registros están al día.</p></div>`;
        return;
    }

    // Mostrar máximo 15 fechas
    let html = '';
    pendientes.slice(0, 15).forEach(p => {
        html += `<div class="pendiente-item">
            <div class="pendiente-fecha">📅 ${p.fecha}</div>
            <div class="pendiente-nombres">Falta: <strong>${p.faltantes.join(', ')}</strong></div>
        </div>`;
    });

    container.innerHTML = html;
}

// ==========================================
// 10. MÓDULO DE GASTOS
// ==========================================
let editIdGasto = null;
let listaFiltradaGastos = [];
let tipoGraficoGastos = 'proyecto';
let gastosSeleccionadosIds = new Set();
let modoLiquidacionActual = 'abono'; // 'seleccion' | 'abono'

function cambiarGraficoGastos(tipo) {
    tipoGraficoGastos = tipo;
    
    const btnProy = document.getElementById('btnChartProyecto');
    const btnItem = document.getElementById('btnChartItem');
    if (btnProy && btnItem) {
        btnProy.classList.remove('active');
        btnItem.classList.remove('active');
        if (tipo === 'proyecto') btnProy.classList.add('active');
        else btnItem.classList.add('active');
    }
    
    if (usuarioActual.role === 'admin' || usuarioActual.role === 'moderador') {
        graficarGastos(listaFiltradaGastos);
    }
}

function getFechaColombiaString() {
    const d = new Date();
    // Colombia es UTC-5
    const colTime = new Date(d.getTime() - (5 * 3600000));
    return colTime.toISOString().split('T')[0];
}

function inicializarDatosGlobalesGastos() {
    const meses = new Set();
    const trabajadores = new Set();
    const proyectos = new Set();

    gastosDatos.forEach(g => {
        if (g.fecha && g.fecha.length >= 7) meses.add(g.fecha.substring(0, 7));
        if (g.trabajador) trabajadores.add(g.trabajador.trim());
        if (g.proyecto) proyectos.add(g.proyecto.trim());
    });

    (window.usuariosGlobal || []).forEach(u => {
        if (u.nombre) trabajadores.add(u.nombre.trim());
    });

    let fMes = document.getElementById("fMesGasto");
    if (fMes) {
        const mesActual = getFechaColombiaString().substring(0, 7);
        let htmlMeses = '<option value="">Todos (Histórico)</option>';
        [...meses].sort().reverse().forEach(val => {
            const selected = val === mesActual ? 'selected' : '';
            htmlMeses += `<option value="${val}" ${selected}>${val}</option>`;
        });
        if (!meses.has(mesActual)) {
            htmlMeses += `<option value="${mesActual}" selected>${mesActual}</option>`;
        }
        fMes.innerHTML = htmlMeses;
    }

    llenarSelectManteniendoValor('fTrabajadorGasto', trabajadores, '');
    llenarSelectManteniendoValor('fProyectoGasto', proyectos, '');

    filtrarGastos();
}

function filtrarGastos() {
    const fMesEl = document.getElementById('fMesGasto');
    const fTrabEl = document.getElementById('fTrabajadorGasto');
    const fProyEl = document.getElementById('fProyectoGasto');
    const fEstEl = document.getElementById('fEstadoGasto');
    const fBusqEl = document.getElementById('fBusquedaGasto');

    let fMes = fMesEl ? fMesEl.value : '';
    let fTrabajador = fTrabEl ? fTrabEl.value : '';
    let fProyecto = fProyEl ? fProyEl.value : '';
    let fEstado = fEstEl ? fEstEl.value : '';
    let fBusqueda = fBusqEl ? fBusqEl.value.toLowerCase().trim() : '';

    if (usuarioActual && usuarioActual.role === 'colaborador') {
        fTrabajador = usuarioActual.name;
    }

    listaFiltradaGastos = gastosDatos.filter(g => {
        const matchMes = !fMes || (g.fecha && g.fecha.substring(0, 7) === fMes);
        const matchTrabajador = !fTrabajador || (g.trabajador && g.trabajador.trim() === fTrabajador);
        const matchProyecto = !fProyecto || (g.proyecto && g.proyecto.trim() === fProyecto);
        const matchEstado = !fEstado || g.estado === fEstado;

        let matchBusqueda = true;
        if (fBusqueda) {
            const texto = `${g.item || ''} ${g.observaciones || ''} ${g.trabajador || ''} ${g.proyecto || ''}`.toLowerCase();
            matchBusqueda = texto.includes(fBusqueda);
        }
        return matchMes && matchTrabajador && matchProyecto && matchEstado && matchBusqueda;
    });

    // Ordenar descendente por fecha, luego por id como fallback
    listaFiltradaGastos.sort((a, b) => {
        const fechaA = new Date(a.fecha || 0);
        const fechaB = new Date(b.fecha || 0);
        if (fechaB.getTime() === fechaA.getTime()) {
            return (b.id || '').localeCompare(a.id || '');
        }
        return fechaB - fechaA;
    });

    mostrarGastos(listaFiltradaGastos);
    if (usuarioActual && (usuarioActual.role === 'admin' || usuarioActual.role === 'moderador')) {
        graficarGastos(listaFiltradaGastos);
        generarTablaPendientesGastos(listaFiltradaGastos);
    }
}

function generarTablaPendientesGastos(lista) {
    const contenedor = document.getElementById('tablaPendientesGastos');
    if (!contenedor) return;

    const pendientes = {};
    let totalPendienteGlobal = 0;

    lista.forEach(g => {
        if (g.estado === 'PENDIENTE') {
            const p = (g.proyecto || 'N/A').trim();
            const deuda = Number(g.total || 0) - Number(g.monto_pagado || 0);
            pendientes[p] = (pendientes[p] || 0) + deuda;
            totalPendienteGlobal += deuda;
        }
    });

    if (Object.keys(pendientes).length === 0) {
        contenedor.innerHTML = `<p style="text-align: center; color: var(--success); font-size: 0.85rem; margin-top: 20px;">Todo está pagado y al día 🎉</p>`;
        return;
    }

    let html = '';
    const proyectosOrdenados = Object.entries(pendientes).sort((a, b) => b[1] - a[1]);

    proyectosOrdenados.forEach(([proy, total]) => {
        html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.85rem;">
            <span style="color: var(--text-main); font-weight: 500;">${proy}</span>
            <span style="color: #f97316; font-weight: 700;">$${total.toLocaleString('es-CO')}</span>
        </div>`;
    });
    
    html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0 0; font-size: 0.9rem; margin-top: 5px;">
            <span style="color: var(--text-muted); font-weight: 700;">TOTAL DEUDA FILTRADA</span>
            <span style="color: #ef4444; font-weight: 800;">$${totalPendienteGlobal.toLocaleString('es-CO')}</span>
        </div>`;

    const trabajadoresConSaldo = (window.usuariosGlobal || []).filter(u => Number(u.saldo_favor) > 0);
    if (trabajadoresConSaldo.length > 0) {
        html += `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
            <h5 style="color: #22d3ee; margin: 0 0 10px 0; font-size: 0.8rem; text-transform: uppercase; display: flex; align-items: center; gap: 6px;">
                <span>💳</span> Saldos a Favor Disponibles
            </h5>`;
        trabajadoresConSaldo.forEach(t => {
            html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 0.8rem;">
                <span style="color: var(--text-main); font-weight: 500;">👤 ${t.nombre}</span>
                <span style="color: #22d3ee; font-weight: 700;">$${Number(t.saldo_favor).toLocaleString('es-CO')}</span>
            </div>`;
        });
        html += `</div>`;
    }

    contenedor.innerHTML = html;
}

function limpiarFiltrosGastos() {
    const mesActual = getFechaColombiaString().substring(0, 7);
    const fMes = document.getElementById('fMesGasto');
    const fTrab = document.getElementById('fTrabajadorGasto');
    const fProy = document.getElementById('fProyectoGasto');
    const fEst = document.getElementById('fEstadoGasto');
    const fBusq = document.getElementById('fBusquedaGasto');

    if (fMes) fMes.value = mesActual;
    if (fTrab) fTrab.value = "";
    if (fProy) fProy.value = "";
    if (fEst) fEst.value = "";
    if (fBusq) fBusq.value = "";
    filtrarGastos();
}

function switchModule(moduleName) {
    const horasModule = document.getElementById('horasModule');
    const gastosModule = document.getElementById('gastosModule');
    const herramientasModule = document.getElementById('herramientasModule');
    
    const tabHoras = document.getElementById('tabHoras');
    const tabGastos = document.getElementById('tabGastos');
    const tabHerramientas = document.getElementById('tabHerramientas');

    const modules = [
        { name: 'horas', el: horasModule, tab: tabHoras },
        { name: 'gastos', el: gastosModule, tab: tabGastos },
        { name: 'herramientas', el: herramientasModule, tab: tabHerramientas }
    ];

    modules.forEach(m => {
        if (m.el) {
            m.el.style.display = 'none';
            m.el.classList.remove('ios-view-enter');
        }
        if (m.tab) m.tab.classList.remove('active');
    });

    const activeMod = modules.find(m => m.name === moduleName);
    if (activeMod && activeMod.el) {
        activeMod.el.style.display = 'block';
        void activeMod.el.offsetWidth; // Forzar reflow para animación suave iOS
        activeMod.el.classList.add('ios-view-enter');
        if (activeMod.tab) activeMod.tab.classList.add('active');
    }

    if (moduleName === 'gastos') {
        if (usuarioActual && usuarioActual.role === 'colaborador') {
            const inTrab = document.getElementById('gastoTrabajador');
            if (inTrab) {
                inTrab.value = usuarioActual.name;
                inTrab.setAttribute('readonly', 'true');
            }
        }
        const gFecha = document.getElementById('gastoFecha');
        if (gFecha && !gFecha.value) {
            gFecha.value = getFechaColombiaString();
        }
        filtrarGastos();
    } else if (moduleName === 'horas') {
        setTimeout(() => {
            graficar(listaFiltradaGlobal);
        }, 50);
    }
}

let toolTransitionTimeout = null;
let loaderSafetyTimeout = null;

function ocultarLoaderHerramienta() {
    clearTimeout(loaderSafetyTimeout);
    const loader = document.getElementById('iframeLoader');
    const iframe = document.getElementById('iframeHerramienta');
    if (loader) {
        loader.classList.add('hidden');
        loader.style.opacity = '0';
        loader.style.visibility = 'hidden';
        loader.style.pointerEvents = 'none';
        setTimeout(() => {
            if (loader.classList.contains('hidden')) {
                loader.style.display = 'none';
            }
        }, 350);
    }
    if (iframe) {
        iframe.classList.add('loaded');
        iframe.style.opacity = '1';
        iframe.style.transform = 'scale(1)';
    }
}

function abrirHerramienta(url, nombre) {
    const catalogo = document.getElementById('herramientasCatalogo');
    const visor = document.getElementById('herramientasVisor');
    const iframe = document.getElementById('iframeHerramienta');
    const loader = document.getElementById('iframeLoader');
    const loaderText = document.getElementById('iframeLoaderText');
    const lblTitulo = document.getElementById('lblTituloHerramienta');

    if (lblTitulo) lblTitulo.textContent = nombre || 'Herramienta de Ingeniería';
    if (loaderText) loaderText.textContent = `Iniciando ${nombre || 'aplicación'}...`;

    // 1. Mostrar loader frosted glass y preparar iframe
    if (loader) {
        loader.style.display = 'flex';
        loader.classList.remove('hidden');
        loader.style.opacity = '1';
        loader.style.visibility = 'visible';
        loader.style.pointerEvents = 'auto';
    }
    if (iframe) {
        iframe.classList.remove('loaded');
        iframe.style.opacity = '0';
        iframe.style.transform = 'scale(0.992)';
    }

    // 2. Transición suave del catálogo hacia el visor estilo Apple
    if (catalogo) {
        catalogo.classList.remove('ios-view-enter');
        catalogo.classList.add('ios-view-leave');
    }

    clearTimeout(toolTransitionTimeout);
    clearTimeout(loaderSafetyTimeout);

    toolTransitionTimeout = setTimeout(() => {
        if (catalogo) {
            catalogo.style.display = 'none';
            catalogo.classList.remove('ios-view-leave');
        }
        if (visor) {
            visor.style.display = 'block';
            visor.classList.remove('ios-view-leave');
            void visor.offsetWidth;
            visor.classList.add('ios-view-enter');
        }

        // 3. Cargar la URL en el iframe con listeners y safety timeout
        if (iframe) {
            iframe.onload = () => {
                setTimeout(ocultarLoaderHerramienta, 80);
            };
            iframe.src = url;

            // Safety timeout: si el evento load se retrasa o el archivo está en caché, abrir automáticamente
            loaderSafetyTimeout = setTimeout(ocultarLoaderHerramienta, 700);
        }
    }, 140);
}

function cerrarHerramienta() {
    clearTimeout(toolTransitionTimeout);
    clearTimeout(loaderSafetyTimeout);
    const catalogo = document.getElementById('herramientasCatalogo');
    const visor = document.getElementById('herramientasVisor');
    const iframe = document.getElementById('iframeHerramienta');
    const loader = document.getElementById('iframeLoader');

    if (visor) {
        visor.classList.remove('ios-view-enter');
        visor.classList.add('ios-view-leave');
    }

    toolTransitionTimeout = setTimeout(() => {
        if (visor) {
            visor.style.display = 'none';
            visor.classList.remove('ios-view-leave');
        }
        if (catalogo) {
            catalogo.style.display = 'block';
            void catalogo.offsetWidth;
            catalogo.classList.add('ios-view-enter');
        }
        if (iframe) {
            iframe.onload = null;
            iframe.src = '';
            iframe.classList.remove('loaded');
            iframe.style.opacity = '0';
        }
        if (loader) {
            loader.classList.add('hidden');
            loader.style.display = 'none';
            loader.style.opacity = '0';
        }
    }, 180);
}

function calcularTotalGasto() {
    const cantidad = parseFloat(document.getElementById('gastoCantidad').value) || 0;
    const valor = parseFloat(document.getElementById('gastoValor').value) || 0;
    document.getElementById('gastoTotal').value = cantidad * valor;
}

function limpiarFormularioGasto() {
    if (usuarioActual && usuarioActual.role !== 'colaborador') {
        document.getElementById('gastoTrabajador').value = '';
    }
    document.getElementById('gastoProyecto').value = '';
    document.getElementById('gastoFecha').value = getFechaColombiaString();
    document.getElementById('gastoItem').selectedIndex = 0;
    document.getElementById('gastoCantidad').value = 1;
    document.getElementById('gastoValor').value = 0;
    document.getElementById('gastoTotal').value = 0;
    document.getElementById('gastoObservaciones').value = '';

    editIdGasto = null;
    document.getElementById('formTitleGasto').innerText = "Registrar Gasto";
    document.getElementById('btnGuardarGasto').innerText = "💾 Guardar Gasto";
    document.getElementById('btnLimpiarGasto').style.display = "block";
    document.getElementById('btnCancelarGasto').style.display = "none";
}

async function guardarGasto() {
    let trabajador = document.getElementById('gastoTrabajador').value.trim();
    if (usuarioActual && usuarioActual.role === 'colaborador') trabajador = usuarioActual.name;
    const proyecto = document.getElementById('gastoProyecto').value.trim();
    const fecha = document.getElementById('gastoFecha').value;
    const item = document.getElementById('gastoItem').value;
    const cantidad = parseFloat(document.getElementById('gastoCantidad').value) || 0;
    const valor_unitario = parseFloat(document.getElementById('gastoValor').value) || 0;
    const total = cantidad * valor_unitario;
    const observaciones = document.getElementById('gastoObservaciones').value.trim();

    if (!trabajador) return Toast.warning("Debe ingresar el trabajador.");
    if (!item) return Toast.warning("Debe seleccionar un ítem.");
    if (total <= 0) return Toast.warning("El total debe ser mayor a 0.");

    showLoader("Guardando gasto...");

    const gasto = {
        trabajador,
        proyecto,
        fecha,
        item,
        cantidad,
        valor_unitario,
        total,
        observaciones,
        estado: 'PENDIENTE',
        monto_pagado: 0
    };

    if (editIdGasto === null) {
        const workerProfile = (window.usuariosGlobal || []).find(u => u.nombre && u.nombre.trim() === trabajador);
        if (workerProfile && workerProfile.saldo_favor > 0) {
            let sf = Number(workerProfile.saldo_favor);
            if (sf >= gasto.total) {
                gasto.monto_pagado = gasto.total;
                gasto.estado = 'PAGO';
                gasto.fecha_pago = fecha;
                workerProfile.saldo_favor = sf - gasto.total;
                await window.API.actualizarSaldoFavor(trabajador, sf - gasto.total);
                Toast.success("Gasto cubierto automáticamente con Saldo a Favor disponible.");
            } else {
                gasto.monto_pagado = sf;
                workerProfile.saldo_favor = 0;
                await window.API.actualizarSaldoFavor(trabajador, 0);
                Toast.success("Se aplicó Saldo a Favor. Queda un saldo restante pendiente.");
            }
        }
    }

    if (editIdGasto !== null) {
        const success = await window.API.actualizarGasto(editIdGasto, gasto);
        if (success) {
            Toast.success("Gasto actualizado exitosamente.");
            const index = gastosDatos.findIndex(g => g.id === editIdGasto);
            if(index !== -1) gastosDatos[index] = { ...gastosDatos[index], ...gasto };
            filtrarGastos();
            limpiarFormularioGasto();
            registrarAuditoria("GASTO_EDITAR", `Se editó gasto de ${item} por $${total} para ${trabajador}.`);
        }
    } else {
        const success = await window.API.crearGasto(gasto);
        if (success) {
            Toast.success("Gasto registrado exitosamente.");
            const gastosDb = await window.API.getGastos();
            if (gastosDb) gastosDatos = gastosDb;
            filtrarGastos();
            limpiarFormularioGasto();
            registrarAuditoria("GASTO_CREAR", `Se registró gasto de ${item} por $${total} para ${trabajador}.`);
        }
    }
    hideLoader();
}

function editarGasto(id) {
    const g = gastosDatos.find(x => x.id === id); 
    if (!g) return;
    if (usuarioActual.role === 'colaborador' && (g.trabajador || '').trim() !== usuarioActual.name.trim()) {
        return Toast.error("Permiso denegado.");
    }

    document.getElementById('gastoTrabajador').value = (g.trabajador || '').trim();
    document.getElementById('gastoProyecto').value = (g.proyecto || '').trim();
    document.getElementById('gastoFecha').value = g.fecha || getFechaColombiaString();
    document.getElementById('gastoItem').value = g.item || "Transporte";
    document.getElementById('gastoCantidad').value = g.cantidad || 1;
    document.getElementById('gastoValor').value = g.valor_unitario || 0;
    document.getElementById('gastoTotal').value = g.total || 0;
    document.getElementById('gastoObservaciones').value = g.observaciones || "";

    editIdGasto = id;
    document.getElementById('formTitleGasto').innerText = "Editando Gasto";
    document.getElementById('btnGuardarGasto').innerText = "Actualizar Registro";
    document.getElementById('btnLimpiarGasto').style.display = "none";
    document.getElementById('btnCancelarGasto').style.display = "block";

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 10.1. GESTIÓN DE SELECCIÓN MÚLTIPLE DE GASTOS
// ==========================================

function toggleSelectAllGastos(checked) {
    gastosSeleccionadosIds.clear();
    if (checked) {
        listaFiltradaGastos.forEach(g => {
            if (g.estado === 'PENDIENTE') {
                gastosSeleccionadosIds.add(g.id);
            }
        });
    }
    document.querySelectorAll('.chk-gasto').forEach(chk => {
        chk.checked = checked;
    });
    actualizarBarraSeleccion();
}

function toggleSeleccionGasto(id) {
    if (gastosSeleccionadosIds.has(id)) {
        gastosSeleccionadosIds.delete(id);
    } else {
        gastosSeleccionadosIds.add(id);
    }
    const selectAll = document.getElementById('selectAllGastos');
    if (selectAll) {
        const totalPendientes = listaFiltradaGastos.filter(g => g.estado === 'PENDIENTE').length;
        selectAll.checked = totalPendientes > 0 && gastosSeleccionadosIds.size === totalPendientes;
    }
    actualizarBarraSeleccion();
}

function deseleccionarTodosGastos() {
    gastosSeleccionadosIds.clear();
    const selectAll = document.getElementById('selectAllGastos');
    if (selectAll) selectAll.checked = false;
    document.querySelectorAll('.chk-gasto').forEach(chk => chk.checked = false);
    actualizarBarraSeleccion();
}

function actualizarBarraSeleccion() {
    const barra = document.getElementById('barraSeleccionGastos');
    const cantEl = document.getElementById('cantGastosSeleccionados');
    const totalEl = document.getElementById('totalMontoSeleccionado');
    if (!barra) return;

    if (gastosSeleccionadosIds.size > 0) {
        let sumaTotal = 0;
        gastosDatos.filter(g => gastosSeleccionadosIds.has(g.id)).forEach(g => {
            const deuda = Number(g.total || 0) - Number(g.monto_pagado || 0);
            sumaTotal += deuda;
        });

        if (cantEl) cantEl.innerText = gastosSeleccionadosIds.size;
        if (totalEl) totalEl.innerText = "$" + sumaTotal.toLocaleString('es-CO');
        barra.style.display = 'flex';
    } else {
        barra.style.display = 'none';
    }
}

// ==========================================
// 10.2. RENDERIZADO DE GASTOS Y KPIS
// ==========================================

function mostrarGastos(lista) {
    let html = '';
    const esAdmin = usuarioActual && (usuarioActual.role === 'admin' || usuarioActual.role === 'moderador');
    let totalGeneral = 0;
    let totalPagado = 0;
    let totalPendiente = 0;

    lista.forEach(g => {
        const totalGasto = Number(g.total || 0);
        const montoPagadoGasto = Number(g.monto_pagado || 0);
        totalGeneral += totalGasto;

        let deudaReal = totalGasto - montoPagadoGasto;
        if (g.estado === 'PAGO') {
            totalPagado += totalGasto;
        } else {
            totalPendiente += deudaReal;
            totalPagado += montoPagadoGasto;
        }

        const isChecked = gastosSeleccionadosIds.has(g.id);
        let checkboxHtml = '';
        if (g.estado === 'PENDIENTE') {
            checkboxHtml = `<input type="checkbox" class="chk-gasto" data-id="${g.id}" ${isChecked ? 'checked' : ''} onchange="toggleSeleccionGasto('${g.id}')">`;
        } else {
            checkboxHtml = `<span style="color:var(--success); font-weight:bold;">✓</span>`;
        }

        let badgeHtml = '';
        if (g.estado === 'PAGO') {
            badgeHtml = `<span class="badge badge-pago"><span class="status-pill-dot dot-green"></span>PAGO ${g.fecha_pago ? `(${g.fecha_pago})` : ''}</span>`;
        } else if (montoPagadoGasto > 0) {
            badgeHtml = `<span class="badge badge-abono"><span class="status-pill-dot dot-yellow"></span>ABONO</span>`;
        } else {
            badgeHtml = `<span class="badge badge-pendiente"><span class="status-pill-dot dot-orange"></span>PENDIENTE</span>`;
        }

        let obs = g.observaciones || '';
        let obsTrun = obs;
        let btnObs = '';
        if (obs.length > 25) {
            obsTrun = obs.substring(0, 25) + '...';
            btnObs = `<button onclick="verObservacionesGasto('${encodeURIComponent(obs)}')" style="color:var(--primary); font-size:0.75rem; padding:0; background:none; text-decoration:underline; border:none; cursor:pointer;">Ver más</button>`;
        }

        const puedeEditar = esAdmin || ((g.trabajador || '').trim() === usuarioActual.name.trim());

        html += `
        <tr style="${g.estado === 'PAGO' ? 'background: rgba(16, 185, 129, 0.04);' : ''}">
            <td class="perm-mod-admin" style="text-align: center;">${checkboxHtml}</td>
            <td style="font-size: 0.85rem; color: var(--text-muted);">${g.fecha || ''}</td>
            <td style="font-weight: 600; color: var(--text-main);">${g.trabajador || ''}</td>
            <td><strong style="color: var(--scitic-dark);">${g.proyecto || 'N/A'}</strong></td>
            <td>${g.item || ''}</td>
            <td style="text-align: center;">${g.cantidad || 1}</td>
            <td style="text-align: right;">$${Number(g.valor_unitario || 0).toLocaleString('es-CO')}</td>
            <td style="text-align: right; font-weight: bold; color: var(--scitic-dark);">
                $${totalGasto.toLocaleString('es-CO')}
                ${montoPagadoGasto > 0 && g.estado === 'PENDIENTE' ? `<br><small style="color:#10b981; font-weight:600;">Abonado: $${montoPagadoGasto.toLocaleString('es-CO')}</small><br><small style="color:#ef4444; font-weight:600;">Resta: $${deudaReal.toLocaleString('es-CO')}</small>` : ''}
            </td>
            <td>${badgeHtml}</td>
            <td><small>${obsTrun}</small> ${btnObs}</td>
            <td style="text-align: center;">
                <div class="action-btns" style="flex-direction: column; gap: 4px;">
                    ${puedeEditar ? `<button onclick="editarGasto('${g.id}')" style="color: var(--accent); font-weight: 600;">Editar</button>` : ''}
                    ${(esAdmin || g.estado === 'PENDIENTE') ? `<button onclick="eliminarGasto('${g.id}')" style="color: var(--danger); font-weight: 600;">Eliminar</button>` : ''}
                </div>
            </td>
        </tr>
        `;
    });

    const tablaGastos = document.getElementById('tablaGastos');
    if (tablaGastos) tablaGastos.innerHTML = html;

    animarNumero('stat-gastos-total', totalGeneral, "$", true);
    animarNumero('stat-gastos-pagado', totalPagado, "$", true);
    animarNumero('stat-gastos-pendiente', totalPendiente, "$", true);

    actualizarTarjetaSaldoFavor();

    const countPendientes = gastosDatos.filter(g => g.estado === 'PENDIENTE').length;
    const badgeP = document.getElementById('badgeGastosPendientes');
    if (badgeP) {
        if (countPendientes > 0) {
            badgeP.innerText = countPendientes;
            badgeP.style.display = 'inline-block';
        } else {
            badgeP.style.display = 'none';
        }
    }

    actualizarBarraSeleccion();
    aplicarPermisos();
}

function actualizarTarjetaSaldoFavor() {
    const cardSaldoFavor = document.getElementById('cardSaldoFavorGastos');
    if (!cardSaldoFavor) return;

    const statSaldoFavorTitulo = document.getElementById('stat-saldo-favor-titulo');
    const statSaldoFavorPersona = document.getElementById('stat-saldo-favor-persona');
    const txtNombreSaldoFavor = document.getElementById('txtNombreSaldoFavor');

    // Determinar si hay un trabajador específico filtrado o si el usuario conectado es colaborador
    let trabajadorFiltro = '';
    if (usuarioActual && usuarioActual.role === 'colaborador') {
        trabajadorFiltro = (usuarioActual.name || '').trim();
    } else {
        const fTrabEl = document.getElementById('fTrabajadorGasto');
        if (fTrabEl && fTrabEl.value.trim()) {
            trabajadorFiltro = fTrabEl.value.trim();
        }
    }

    let montoSaldoFavor = 0;
    let mostrarTarjeta = false;
    let nombreTrabajadorMostrar = '';
    let esTrabajadorUnico = false;
    let tooltipDetalle = '';

    if (trabajadorFiltro) {
        // Vista filtrada por un trabajador específico
        const perfil = (window.usuariosGlobal || []).find(u => 
            (u.nombre || '').trim().toLowerCase() === trabajadorFiltro.toLowerCase()
        );
        const sf = perfil ? Number(perfil.saldo_favor || 0) : 0;
        if (sf > 0) {
            montoSaldoFavor = sf;
            mostrarTarjeta = true;
            nombreTrabajadorMostrar = perfil ? perfil.nombre : trabajadorFiltro;
            esTrabajadorUnico = true;
            tooltipDetalle = `Saldo a favor exclusivo de ${nombreTrabajadorMostrar}`;
        }
    } else {
        // Vista general / global (para admin o moderador sin filtro de trabajador específico)
        const conSaldo = (window.usuariosGlobal || []).filter(u => Number(u.saldo_favor) > 0);
        if (conSaldo.length === 1) {
            // Solo UN trabajador en todo el sistema tiene saldo a favor: mostramos su nombre directamente
            montoSaldoFavor = Number(conSaldo[0].saldo_favor);
            mostrarTarjeta = true;
            nombreTrabajadorMostrar = conSaldo[0].nombre;
            esTrabajadorUnico = true;
            tooltipDetalle = `Saldo a favor de ${conSaldo[0].nombre}`;
        } else if (conSaldo.length > 1) {
            // Múltiples trabajadores con saldo
            montoSaldoFavor = conSaldo.reduce((acc, u) => acc + (Number(u.saldo_favor) || 0), 0);
            mostrarTarjeta = true;
            nombreTrabajadorMostrar = `${conSaldo.length} colaboradores con saldo`;
            esTrabajadorUnico = false;
            tooltipDetalle = conSaldo.map(t => `${t.nombre}: $${Number(t.saldo_favor).toLocaleString('es-CO')}`).join('\n');
        }
    }

    if (mostrarTarjeta && montoSaldoFavor > 0) {
        cardSaldoFavor.style.display = 'block';
        if (statSaldoFavorTitulo) {
            statSaldoFavorTitulo.innerText = esTrabajadorUnico ? 'Saldo a Favor' : 'Saldos a Favor Disp.';
        }
        if (statSaldoFavorPersona && txtNombreSaldoFavor) {
            txtNombreSaldoFavor.innerText = nombreTrabajadorMostrar;
            statSaldoFavorPersona.style.display = 'inline-flex';
            statSaldoFavorPersona.title = tooltipDetalle;
        }
        animarNumero('stat-gastos-saldo-favor', montoSaldoFavor, "$", true);
    } else {
        cardSaldoFavor.style.display = 'none';
    }
}

function verObservacionesGasto(obsEncoded) {
    document.getElementById('obsContent').innerText = decodeURIComponent(obsEncoded);
    document.getElementById('obsModal').classList.add('show');
}

function graficarGastos(lista) {
    const ctx = document.getElementById("graficoGastos"); 
    if(!ctx || ctx.offsetParent === null) return;

    const resumen = {};
    lista.forEach(g => {
        let clave = tipoGraficoGastos === 'proyecto' ? (g.proyecto || 'N/A').trim() : (g.item || 'Otros').trim();
        resumen[clave] = (resumen[clave] || 0) + Number(g.total || 0);
    });

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';
    if (window.chartGastos) window.chartGastos.destroy();

    let gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#10b981'); gradient.addColorStop(1, '#059669');

    const typeChart = tipoGraficoGastos === 'proyecto' ? 'bar' : 'doughnut';

    let config = {
        type: typeChart, 
        data: { 
            labels: Object.keys(resumen), 
            datasets: [{ 
                label: 'Gastos ($)', 
                data: Object.values(resumen), 
                backgroundColor: tipoGraficoGastos === 'proyecto' ? gradient : ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'], 
                hoverBackgroundColor: tipoGraficoGastos === 'proyecto' ? '#34d399' : undefined, 
                borderRadius: tipoGraficoGastos === 'proyecto' ? 6 : 0,
                borderWidth: tipoGraficoGastos === 'proyecto' ? 0 : 2,
                borderColor: '#020617'
            }] 
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { 
                legend: { 
                    display: tipoGraficoGastos === 'item',
                    position: 'right',
                    labels: { color: '#f8fafc', font: { family: 'Inter' } }
                }, 
                tooltip: { 
                    callbacks: { label: function(context) { return '$' + context.raw.toLocaleString('es-CO'); } },
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', titleColor: '#fff', bodyColor: '#94a3b8', padding: 12, cornerRadius: 8 
                } 
            }, 
            scales: tipoGraficoGastos === 'proyecto' ? { 
                y: { 
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('es-CO');
                        }
                    }
                }, 
                x: { grid: { display: false } } 
            } : undefined,
            onClick: (e, items) => { 
                if (items.length > 0 && tipoGraficoGastos === 'proyecto') { 
                    document.getElementById('fProyectoGasto').value = window.chartGastos.data.labels[items[0].index]; 
                    filtrarGastos(); 
                } 
            } 
        }
    };

    window.chartGastos = new Chart(ctx, config);
}

// ==========================================
// 10.3. EXPORTACIÓN DE GASTOS A EXCEL
// ==========================================

function exportarGastosExcel() {
    if (listaFiltradaGastos.length === 0) return Toast.warning("No hay gastos filtrados para exportar.");

    let totalGeneral = 0;
    let totalPagado = 0;
    let totalPendiente = 0;

    const filas = listaFiltradaGastos.map(g => {
        const total = Number(g.total || 0);
        const pagado = g.estado === 'PAGO' ? total : Number(g.monto_pagado || 0);
        const pendiente = total - pagado;

        totalGeneral += total;
        totalPagado += pagado;
        totalPendiente += pendiente;

        return {
            "Fecha": g.fecha || "",
            "Personal": (g.trabajador || "").trim(),
            "Proyecto": (g.proyecto || "").trim(),
            "Ítem / Concepto": g.item || "",
            "Cantidad": Number(g.cantidad || 1),
            "Valor Unitario ($)": Number(g.valor_unitario || 0),
            "Total ($)": total,
            "Monto Pagado ($)": pagado,
            "Saldo Pendiente ($)": pendiente,
            "Estado": g.estado || "PENDIENTE",
            "Fecha Pago": g.fecha_pago || "",
            "Observaciones": (g.observaciones || "").trim()
        };
    });

    filas.push({
        "Fecha": "TOTALES",
        "Personal": "",
        "Proyecto": "",
        "Ítem / Concepto": "",
        "Cantidad": "",
        "Valor Unitario ($)": "",
        "Total ($)": totalGeneral,
        "Monto Pagado ($)": totalPagado,
        "Saldo Pendiente ($)": totalPendiente,
        "Estado": "",
        "Fecha Pago": "",
        "Observaciones": ""
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(filas);
    XLSX.utils.book_append_sheet(wb, ws, "Gastos_Viaticos");
    const nombreArchivo = `SCITIC_Gastos_${getFechaColombiaString()}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);

    registrarAuditoria("EXPORTAR_GASTOS", `Exportó reporte de gastos con ${listaFiltradaGastos.length} registros.`);
    Toast.success("Planilla de gastos exportada exitosamente.");
}

// ==========================================
// 10.4. CONSOLA DE LIQUIDACIÓN Y PAGO GUIADO
// ==========================================

function abrirModalLiquidacion(modo = 'abono') {
    if (usuarioActual && usuarioActual.role !== 'admin' && usuarioActual.role !== 'moderador') {
        return Toast.error("Acceso restringido a administradores.");
    }

    const modal = document.getElementById('modalLiquidacion');
    if (!modal) return;

    modoLiquidacionActual = modo;
    document.getElementById('liqFecha').value = getFechaColombiaString();
    document.getElementById('liqComprobante').value = '';
    document.getElementById('liqNotas').value = '';
    document.getElementById('liqAvisoExcedente').style.display = 'none';

    // Poblar trabajadores
    const selectTrab = document.getElementById('liqTrabajador');
    const trabajadoresConDeuda = new Set();
    gastosDatos.filter(g => g.estado === 'PENDIENTE').forEach(g => {
        if (g.trabajador) trabajadoresConDeuda.add(g.trabajador.trim());
    });
    (window.usuariosGlobal || []).forEach(u => {
        if (u.nombre) trabajadoresConDeuda.add(u.nombre.trim());
    });

    let htmlTrab = '<option value="">Seleccione personal...</option>';
    [...trabajadoresConDeuda].sort().forEach(t => {
        htmlTrab += `<option value="${t}">${t}</option>`;
    });
    selectTrab.innerHTML = htmlTrab;

    // Si abrimos desde selección y todos son del mismo trabajador
    if (modo === 'seleccion' && gastosSeleccionadosIds.size > 0) {
        const seleccionados = gastosDatos.filter(g => gastosSeleccionadosIds.has(g.id));
        const trabajadoresUnicos = [...new Set(seleccionados.map(g => (g.trabajador || '').trim()))];
        if (trabajadoresUnicos.length === 1) {
            selectTrab.value = trabajadoresUnicos[0];
        }
        cambiarModoLiquidacion('seleccion');
    } else {
        cambiarModoLiquidacion('abono');
    }

    actualizarInfoLiquidacionTrabajador();
    modal.classList.add('show');
}

function cambiarModoLiquidacion(modo) {
    modoLiquidacionActual = modo;
    const btnSel = document.getElementById('btnLiqModoSeleccion');
    const btnAbono = document.getElementById('btnLiqModoAbono');
    const listaSel = document.getElementById('liqListaGastosSeleccionados');
    const badgeCont = document.getElementById('liqContadorSeleccion');

    if (badgeCont) badgeCont.innerText = gastosSeleccionadosIds.size;

    if (modo === 'seleccion') {
        if (btnSel) btnSel.classList.add('active');
        if (btnAbono) btnAbono.classList.remove('active');
        if (listaSel) listaSel.style.display = 'block';

        let suma = 0;
        let html = '';
        gastosDatos.filter(g => gastosSeleccionadosIds.has(g.id)).forEach(g => {
            const deuda = Number(g.total || 0) - Number(g.monto_pagado || 0);
            suma += deuda;
            html += `<div style="display:flex; justify-content:space-between; font-size:0.8rem; padding:4px 0; color:var(--text-muted); border-bottom:1px solid rgba(255,255,255,0.03);">
                <span>📅 ${g.fecha} - <strong>${g.item}</strong> (${g.proyecto || 'S/P'}):</span>
                <strong style="color:#10b981;">$${deuda.toLocaleString('es-CO')}</strong>
            </div>`;
        });
        if (listaSel) listaSel.innerHTML = html || '<p style="color:var(--text-muted); font-size:0.8rem; margin:0;">No hay gastos seleccionados.</p>';
        document.getElementById('liqMonto').value = suma > 0 ? suma : '';
    } else {
        if (btnSel) btnSel.classList.remove('active');
        if (btnAbono) btnAbono.classList.add('active');
        if (listaSel) listaSel.style.display = 'none';
        
        actualizarInfoLiquidacionTrabajador();
    }
    calcularExcedenteLiquidacion();
}

function actualizarInfoLiquidacionTrabajador() {
    const trab = document.getElementById('liqTrabajador').value;
    const deudaEl = document.getElementById('liqDeudaTrabajador');
    const saldoFavorTag = document.getElementById('liqSaldoFavorTag');

    if (!trab) {
        if (deudaEl) deudaEl.innerText = "$0";
        if (saldoFavorTag) saldoFavorTag.innerText = "Saldo a favor: $0";
        return;
    }

    let deudaTotal = 0;
    gastosDatos.filter(g => g.estado === 'PENDIENTE' && (g.trabajador || '').trim() === trab).forEach(g => {
        deudaTotal += Number(g.total || 0) - Number(g.monto_pagado || 0);
    });

    const userProfile = (window.usuariosGlobal || []).find(u => (u.nombre || '').trim() === trab);
    const saldoFavor = userProfile ? Number(userProfile.saldo_favor || 0) : 0;

    if (deudaEl) deudaEl.innerText = "$" + deudaTotal.toLocaleString('es-CO');
    if (saldoFavorTag) saldoFavorTag.innerText = `Saldo a favor disponible: $${saldoFavor.toLocaleString('es-CO')}`;

    if (modoLiquidacionActual === 'abono') {
        const inMonto = document.getElementById('liqMonto');
        if (inMonto && (!inMonto.value || Number(inMonto.value) === 0)) {
            inMonto.value = deudaTotal > 0 ? deudaTotal : '';
        }
    }
    calcularExcedenteLiquidacion();
}

function calcularExcedenteLiquidacion() {
    const trab = document.getElementById('liqTrabajador').value;
    const monto = parseFloat(document.getElementById('liqMonto').value) || 0;
    const aviso = document.getElementById('liqAvisoExcedente');
    const avisoMonto = document.getElementById('liqMontoExcedente');

    if (!aviso || !avisoMonto || !trab || monto <= 0) {
        if (aviso) aviso.style.display = 'none';
        return;
    }

    let deuda = 0;
    if (modoLiquidacionActual === 'seleccion') {
        gastosDatos.filter(g => gastosSeleccionadosIds.has(g.id)).forEach(g => {
            deuda += Number(g.total || 0) - Number(g.monto_pagado || 0);
        });
    } else {
        gastosDatos.filter(g => g.estado === 'PENDIENTE' && (g.trabajador || '').trim() === trab).forEach(g => {
            deuda += Number(g.total || 0) - Number(g.monto_pagado || 0);
        });
    }

    if (monto > deuda) {
        const excedente = monto - deuda;
        avisoMonto.innerText = "$" + excedente.toLocaleString('es-CO');
        aviso.style.display = 'block';
    } else {
        aviso.style.display = 'none';
    }
}

async function procesarLiquidacionPago() {
    const trab = document.getElementById('liqTrabajador').value;
    const fechaPago = document.getElementById('liqFecha').value;
    const metodo = document.getElementById('liqMetodo').value;
    const comprobante = document.getElementById('liqComprobante').value.trim();
    const notas = document.getElementById('liqNotas').value.trim();
    const monto = parseFloat(document.getElementById('liqMonto').value) || 0;

    if (!trab) return Toast.warning("Debe seleccionar el personal beneficiario.");
    if (!fechaPago) return Toast.warning("Debe indicar la fecha de pago.");
    if (monto <= 0) return Toast.warning("El monto a pagar debe ser mayor a 0.");

    let gastosALiquidar = [];
    if (modoLiquidacionActual === 'seleccion' && gastosSeleccionadosIds.size > 0) {
        gastosALiquidar = gastosDatos
            .filter(g => gastosSeleccionadosIds.has(g.id))
            .sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0));
    } else {
        gastosALiquidar = gastosDatos
            .filter(g => g.estado === 'PENDIENTE' && (g.trabajador || '').trim() === trab)
            .sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0));
    }

    const numComprobante = comprobante || `CP-${Date.now().toString().slice(-6)}`;

    if (!confirm(`¿Confirmar liquidación de $${monto.toLocaleString('es-CO')} a ${trab} vía ${metodo} (Ref: ${numComprobante})?`)) {
        return;
    }

    showLoader("Procesando pago y liquidación...");

    let saldoDisponible = monto;
    let gastosCubiertos = [];
    let exitoCount = 0;

    for (const gastoObj of gastosALiquidar) {
        if (saldoDisponible <= 0) break;
        let deudaActual = Number(gastoObj.total || 0) - Number(gastoObj.monto_pagado || 0);

        let obsInfo = `[Pago: ${metodo} | Ref: ${numComprobante}${notas ? ' | ' + notas : ''}]`;
        let nuevaObs = gastoObj.observaciones ? `${gastoObj.observaciones.trim()}\n${obsInfo}` : obsInfo;

        if (saldoDisponible >= deudaActual) {
            saldoDisponible -= deudaActual;
            const success = await window.API.actualizarGasto(gastoObj.id, {
                estado: 'PAGO',
                fecha_pago: fechaPago,
                monto_pagado: gastoObj.total,
                observaciones: nuevaObs
            });
            if (success) {
                exitoCount++;
                gastosCubiertos.push({ ...gastoObj, liquidado: deudaActual, estadoResultante: 'PAGO' });
            }
        } else {
            const nuevoMonto = Number(gastoObj.monto_pagado || 0) + saldoDisponible;
            const abonoHecho = saldoDisponible;
            saldoDisponible = 0;
            const success = await window.API.actualizarGasto(gastoObj.id, {
                estado: 'PENDIENTE',
                monto_pagado: nuevoMonto,
                observaciones: nuevaObs
            });
            if (success) {
                exitoCount++;
                gastosCubiertos.push({ ...gastoObj, liquidado: abonoHecho, estadoResultante: 'ABONO' });
            }
        }
    }

    // Si sobró saldo, se acredita a saldo_favor
    let saldoFavorNuevo = 0;
    if (saldoDisponible > 0) {
        const workerProfile = (window.usuariosGlobal || []).find(u => (u.nombre || '').trim() === trab);
        let saldoActual = workerProfile ? Number(workerProfile.saldo_favor || 0) : 0;
        saldoFavorNuevo = saldoActual + saldoDisponible;
        if (workerProfile) workerProfile.saldo_favor = saldoFavorNuevo;
        await window.API.actualizarSaldoFavor(trab, saldoFavorNuevo);
    }

    // Recargar datos
    const [gastosDb, usersDb] = await Promise.all([
        window.API.getGastos(),
        window.API.getUsuarios()
    ]);
    if (gastosDb) gastosDatos = gastosDb;
    if (usersDb) window.usuariosGlobal = usersDb;

    await registrarAuditoria("LIQUIDACION_PAGO", `Liquidación de $${monto.toLocaleString('es-CO')} a ${trab} (${metodo} - ${numComprobante}) cubriendo ${exitoCount} registros.`);

    deseleccionarTodosGastos();
    cerrarModal('modalLiquidacion');
    filtrarGastos();
    hideLoader();

    Toast.success(`¡Pago registrado exitosamente! ${exitoCount} gastos procesados.`);

    // Mostrar comprobante imprimible
    generarComprobantePago({
        numero: numComprobante,
        beneficiario: trab,
        fecha: fechaPago,
        metodo: metodo,
        montoTotal: monto,
        gastosCubiertos: gastosCubiertos,
        excedenteSaldoFavor: saldoDisponible,
        saldoFavorTotal: saldoFavorNuevo,
        notas: notas
    });
}

function generarComprobantePago(datosPago) {
    const contenedor = document.getElementById('reciboContenido');
    if (!contenedor) return;

    let filasHtml = '';
    if (datosPago.gastosCubiertos.length > 0) {
        datosPago.gastosCubiertos.forEach((g, idx) => {
            filasHtml += `<tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td>${g.fecha || ''}</td>
                <td><strong>${g.proyecto || 'N/A'}</strong></td>
                <td>${g.item || ''}</td>
                <td style="text-align:right;">$${Number(g.total || 0).toLocaleString('es-CO')}</td>
                <td style="text-align:right; font-weight:bold; color:#10b981;">$${Number(g.liquidado || 0).toLocaleString('es-CO')}</td>
            </tr>`;
        });
    } else {
        filasHtml = `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:15px;">Abono a cuenta sin asignación directa a ítems específicos.</td></tr>`;
    }

    const html = `
        <div class="receipt-header">
            <div>
                <h2 style="margin:0; font-size:1.5rem; color:#0f172a; font-weight:800;">SCITIC S.A.S</h2>
                <div style="font-size:0.85rem; color:#64748b; margin-top:3px;">NIT: 901.458.120-1 | Control de Proyectos y Viáticos</div>
                <div style="margin-top:10px; font-size:0.9rem; font-weight:700; color:#ea580c;">COMPROBANTE DE PAGO DE GASTOS</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:1.1rem; font-weight:800; color:#0f172a;">${datosPago.numero}</div>
                <div class="receipt-meta">Fecha: ${datosPago.fecha}</div>
                <div class="receipt-meta">Método: <strong>${datosPago.metodo}</strong></div>
            </div>
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 16px; margin-bottom:1.5rem; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
            <div>
                <small style="color:#64748b; text-transform:uppercase; font-size:0.7rem; font-weight:700; display:block;">Beneficiario:</small>
                <strong style="color:#0f172a; font-size:1.05rem;">${datosPago.beneficiario}</strong>
            </div>
            <div>
                <small style="color:#64748b; text-transform:uppercase; font-size:0.7rem; font-weight:700; display:block;">Concepto / Notas:</small>
                <span style="color:#334155; font-size:0.88rem;">${datosPago.notas || 'Liquidación y reembolso de viáticos operativos'}</span>
            </div>
        </div>

        <table class="receipt-table">
            <thead>
                <tr>
                    <th style="width:30px; text-align:center;">#</th>
                    <th>Fecha Gasto</th>
                    <th>Proyecto</th>
                    <th>Ítem</th>
                    <th style="text-align:right;">Total Gasto</th>
                    <th style="text-align:right;">Monto Liquidado</th>
                </tr>
            </thead>
            <tbody>
                ${filasHtml}
            </tbody>
        </table>

        <div class="receipt-totals">
            <div class="receipt-total-box">
                <div style="display:flex; justify-content:space-between; font-size:1rem; font-weight:800; color:#0f172a; border-bottom:1px solid #cbd5e1; padding-bottom:6px;">
                    <span>TOTAL PAGADO:</span>
                    <span style="color:#10b981;">$${datosPago.montoTotal.toLocaleString('es-CO')}</span>
                </div>
                ${datosPago.excedenteSaldoFavor > 0 ? `
                <div style="display:flex; justify-content:space-between; font-size:0.82rem; color:#06b6d4; margin-top:6px;">
                    <span>Acreditado Saldo a Favor:</span>
                    <span>+$${datosPago.excedenteSaldoFavor.toLocaleString('es-CO')}</span>
                </div>
                ` : ''}
            </div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:3.5rem; padding-top:1rem; border-top:1px dashed #cbd5e1;">
            <div style="text-align:center; width:220px;">
                <div style="border-bottom:1px solid #475569; height:35px; margin-bottom:5px;"></div>
                <small style="color:#64748b; font-weight:600;">Autorizado Por (SCITIC)</small>
            </div>
            <div style="text-align:center; width:220px;">
                <div style="border-bottom:1px solid #475569; height:35px; margin-bottom:5px;"></div>
                <small style="color:#64748b; font-weight:600;">Recibí Conforme (${datosPago.beneficiario})</small>
            </div>
        </div>
    `;

    contenedor.innerHTML = html;
    document.getElementById('modalReciboPago').classList.add('show');
}

async function eliminarGasto(id) {
    if (confirm("¿Seguro que deseas eliminar permanentemente este gasto?")) {
        showLoader("Eliminando gasto...");
        const success = await window.API.eliminarGasto(id);
        if (success) {
            gastosDatos = gastosDatos.filter(g => g.id !== id);
            gastosSeleccionadosIds.delete(id);
            filtrarGastos();
            Toast.success("Gasto eliminado exitosamente.");
            registrarAuditoria("GASTO_ELIMINAR", `Se eliminó un registro de gasto.`);
        }
        hideLoader();
    }
}