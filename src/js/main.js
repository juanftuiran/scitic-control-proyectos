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
// 2. INICIALIZACIÓN Y AUTENTICACIÓN
// ==========================================
window.onload = async function () {
    // Verificar sesión activa de Supabase Auth
    const sesion = await window.API.getSession();
    if (sesion) {
        usuarioActual = sesion;
        iniciarApp();
    } else {
        document.getElementById('loginView').style.display = 'flex';
        document.getElementById('appView').style.display = 'none';
    }
};

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

async function iniciarApp() {
    showLoader("Cargando entorno de trabajo...");
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('appView').style.display = 'block';
    document.getElementById('displayUserName').innerText = "Cargando...";

    aplicarPermisos();
    aplicarPermisosWidget();

    const registrosDb = await window.API.getRegistros();
    if (registrosDb) datos = registrosDb;

    const auditDb = await window.API.getAuditoria();
    if (auditDb) auditoria = auditDb;

    const gastosDb = await window.API.getGastos();
    if (gastosDb) gastosDatos = gastosDb;

    const usersDb = await window.API.getUsuarios();
    if (usersDb) {
        window.usuariosGlobal = usersDb;
        trabajadoresActivosParaPendientes = usersDb
            .filter(u => u.rol === 'colaborador' || u.rol === 'moderador')
            .map(u => u.nombre.trim());
    }

    recalcularProgresos();
    document.getElementById('fecha').value = getFechaColombiaString();

    inicializarDatosGlobales();
    inicializarDatosGlobalesGastos();

    document.getElementById('displayUserName').innerText = usuarioActual.name;
    document.getElementById('displayUserRole').innerText = usuarioActual.role;
    hideLoader();
    
    // Registrar login sin bloquear la carga
    registrarAuditoria("LOGIN", "El usuario inició sesión.");
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

function inicializarDatosGlobales() {
    const mesesGlobales = new Set();

    datos.forEach(d => {
        if (d.fecha && d.fecha.length >= 7) mesesGlobales.add(d.fecha.substring(0, 7));
    });

    let fMes = document.getElementById("fMes");
    let valMesActual = fMes.value;
    let htmlMeses = '<option value="">Todos los meses</option>';
    [...mesesGlobales].sort().reverse().forEach(val => {
        const selected = val === valMesActual ? 'selected' : '';
        htmlMeses += `<option value="${val}" ${selected}>${val}</option>`;
    });
    fMes.innerHTML = htmlMeses;

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
    document.getElementById('fMes').value = "";
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

    showLoader("Guardando registro...");

    let obj = {
        id: editId !== null ? editId : generarIdUnico(),
        cliente: clienteVal,
        proyecto: proyectoVal,
        trabajador: trabajadorVal,
        fecha: document.getElementById('fecha').value,
        horas: Number(document.getElementById('horas').value) || 0,
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
                accionAuditoria = `EDITAR: Modificó horas a ${obj.horas}h en proy. ${obj.proyecto}`;
                Toast.success("Registro actualizado exitosamente.");
            }
        }
    } else {
        const success = await window.API.crearRegistro(obj);
        if (success) {
            datos.push(obj);
            accionAuditoria = `CREAR: Registró ${obj.horas}h en proy. ${obj.proyecto}`;
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
                <span style="background: var(--danger-bg); color: var(--danger); padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 700; font-size:0.75rem; border: 1px solid rgba(239,68,68,0.3);">+${al.exceso} h</span>
            </div>
            <small style="color: var(--text-muted);">${al.cliente || 'Sin Cliente'}</small>
            <div class="alert-detail">
                🚨 <strong>${al.trabajador}</strong> reportó horas que superaron el límite de ${al.horasPres}h el <strong>${al.fecha}</strong>.
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
                <span style="font-size:0.75rem; font-weight:normal; ${colorClase}; display:block; margin-top:6px; letter-spacing: 0.5px;">(${data.totalHoras}H USADAS / ${data.horasPres}H PRESUP.)</span>
            </h4>`;

        for (const [trabajador, stats] of Object.entries(data.trabajadores)) {
            html += `<div class="worker-stat">
                <span class="worker-name"><span style="color:var(--text-muted)">👤</span> ${trabajador}</span>
                <span style="text-align: right"><strong>${stats.horas}h</strong> <br><small style="color: var(--primary)">$${stats.costo.toLocaleString('es-CO')}</small></span>
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
            <td><strong style="color: var(--scitic-dark);">${d.horas || 0} h</strong></td>
            ${esAdmin ? `<td style="color: var(--primary); font-weight: 600;">$${Number(d.pago || 0).toLocaleString('es-CO')}</td>` : ''}
            ${esAdmin ? `<td><div class="progress-bar-container"><div class="progress-bar" style="width: ${Math.min(d.progreso || 0, 100)}%; ${Number(d.progreso || 0) > 100 ? 'background:linear-gradient(135deg, #ef4444, #dc2626);' : ''}"></div></div><small style="${Number(d.progreso || 0) > 100 ? 'color: var(--danger); font-weight:bold;' : ''}">${d.progreso || 0}%</small></td>` : ''}
            <td><span class="badge bg-blue">${d.actividad || 'N/A'}</span></td>
            <td><div class="action-btns">
                    ${puedeEditar ? `<button onclick="editar('${d.id}')" style="color: var(--accent); font-weight: 600;">Editar</button>` : ''}
                    ${esAdmin ? `<button onclick="eliminar('${d.id}')" style="color: var(--danger); font-weight: 600;">Borrar</button>` : ''}
            </div></td>
        </tr>`;
    });

    document.getElementById('tabla').innerHTML = htmlTabla;
    animarNumero('stat-horas', totalH, " h");
    if (esAdmin) animarNumero('stat-presupuesto', totalP, "$", true);
    animarNumero('stat-proyectos', proyActivos.size, "");
}

function animarNumero(id, finalValue, sufijo, esMoneda = false) {
    const obj = document.getElementById(id); if (!obj) return;
    
    // Safety check for NaN
    let val = finalValue;
    if (isNaN(val) || val === null || val === undefined) val = 0;

    // Si el elemento no es visible (display:none), no animamos para evitar que se quede congelado
    if (obj.offsetParent === null) {
        obj.innerHTML = esMoneda ? sufijo + val.toLocaleString('es-CO') : (sufijo === "$" ? sufijo + val : val + sufijo);
        return;
    }

    let startTimestamp = null; const duration = 800;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.floor(easeOut * val);
        obj.innerHTML = esMoneda ? sufijo + currentVal.toLocaleString('es-CO') : (sufijo === "$" ? sufijo + currentVal : currentVal + sufijo);
        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = esMoneda ? sufijo + val.toLocaleString('es-CO') : (sufijo === "$" ? sufijo + val : val + sufijo);
    };
    window.requestAnimationFrame(step);
}

function verDetalle(nombre) {
    if (!nombre) return;
    const registros = datos.filter(d => (d.proyecto || '').trim() === nombre);
    if (registros.length === 0) return;
    document.getElementById('modalNombreProy').innerText = nombre;
    document.getElementById('modalCliente').innerText = (registros[0].cliente || '').trim();
    let h = 0, c = 0; let act = { DISEÑO: 0, RRHH: 0, OBRAS: 0 };
    registros.forEach(r => { h += Number(r.horas || 0); c += Number(r.pago || 0); if (act[r.actividad] !== undefined) act[r.actividad] += Number(r.horas || 0); });
    document.getElementById('mHoras').innerText = h + " h";
    document.getElementById('mCosto').innerText = "$" + c.toLocaleString('es-CO');
    document.getElementById('mActividades').innerHTML = Object.entries(act).map(([k, v]) => `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;"><span style="font-weight: 600; color: var(--scitic-dark);"><span class="badge bg-blue">${k}</span></span><span style="font-size: 1.1rem; color: var(--primary); font-weight: 600;">${v} h</span></div>`).join("");
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
function graficar(listaFiltrada) {
    const ctx = document.getElementById("grafico"); 
    if(!ctx || ctx.offsetParent === null) return; // No graficar si está oculto

    const resumen = {};
    listaFiltrada.forEach(d => {
        if (d.proyecto) {
            const p = d.proyecto.trim();
            resumen[p] = (resumen[p] || 0) + Number(d.horas || 0);
        }
    });
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';
    if (window.chart) window.chart.destroy();

    let gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#ea580c'); gradient.addColorStop(1, '#c2410c');

    window.chart = new Chart(ctx, {
        type: 'bar', data: { labels: Object.keys(resumen), datasets: [{ label: 'Horas', data: Object.values(resumen), backgroundColor: gradient, hoverBackgroundColor: '#f97316', borderRadius: 6, borderSkipped: false }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', titleColor: '#fff', bodyColor: '#94a3b8', padding: 12, cornerRadius: 8, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }, x: { grid: { display: false } } }, onClick: (e, items) => { if (items.length > 0) { document.getElementById('fProyecto').value = window.chart.data.labels[items[0].index]; filtrar(); } } }
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
    document.getElementById('valor').value = "0";
    document.getElementById('fecha').value = getFechaColombiaString();
    document.getElementById('actividad').value = "DISEÑO";

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
            await registrarAuditoria("ELIMINAR", `Se borró registro de ${registro.horas}h de ${registro.trabajador} en ${registro.proyecto}.`);
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
    document.getElementById('horas').value = d.horas || 0;
    document.getElementById('valor').value = d.valor || 0;
    document.getElementById('actividad').value = ["DISEÑO", "RRHH", "OBRAS"].includes(d.actividad) ? d.actividad : "DISEÑO";

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

function cambiarGraficoGastos(tipo) {
    tipoGraficoGastos = tipo;
    
    document.getElementById('btnChartProyecto').classList.remove('active');
    document.getElementById('btnChartItem').classList.remove('active');
    
    if (tipo === 'proyecto') {
        document.getElementById('btnChartProyecto').classList.add('active');
    } else {
        document.getElementById('btnChartItem').classList.add('active');
    }
    
    if (usuarioActual.role === 'admin' || usuarioActual.role === 'moderador') {
        graficarGastos(listaFiltradaGastos);
    }
}

function getFechaColombiaString() {
    const d = new Date();
    // Colombia es UTC-5. Obtenemos el tiempo UTC actual y le restamos 5 horas.
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

    let fMes = document.getElementById("fMesGasto");
    // Por defecto mes actual
    const mesActual = getFechaColombiaString().substring(0, 7);
    
    let htmlMeses = '<option value="">Todos (Histórico)</option>';
    [...meses].sort().reverse().forEach(val => {
        const selected = val === mesActual ? 'selected' : '';
        htmlMeses += `<option value="${val}" ${selected}>${val}</option>`;
    });
    // Si el mes actual no está en los datos, agregarlo
    if(!meses.has(mesActual)) {
        htmlMeses += `<option value="${mesActual}" selected>${mesActual}</option>`;
    }
    fMes.innerHTML = htmlMeses;

    llenarSelectManteniendoValor('fTrabajadorGasto', trabajadores, '');
    llenarSelectManteniendoValor('fProyectoGasto', proyectos, '');
    llenarSelectManteniendoValor('pagoTrabajador', trabajadores, '');

    filtrarGastos();
}

function filtrarGastos() {
    let fMes = document.getElementById('fMesGasto').value;
    let fTrabajador = document.getElementById('fTrabajadorGasto').value;
    let fProyecto = document.getElementById('fProyectoGasto').value;

    if (usuarioActual.role === 'colaborador') fTrabajador = usuarioActual.name;

    listaFiltradaGastos = gastosDatos.filter(g => {
        const matchMes = !fMes || (g.fecha && g.fecha.substring(0, 7) === fMes);
        const matchTrabajador = !fTrabajador || (g.trabajador && g.trabajador.trim() === fTrabajador);
        const matchProyecto = !fProyecto || (g.proyecto && g.proyecto.trim() === fProyecto);
        return matchMes && matchTrabajador && matchProyecto;
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
    if (usuarioActual.role === 'admin' || usuarioActual.role === 'moderador') {
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
            pendientes[p] = (pendientes[p] || 0) + Number(g.total || 0);
            totalPendienteGlobal += Number(g.total || 0);
        }
    });

    if (Object.keys(pendientes).length === 0) {
        contenedor.innerHTML = `<p style="text-align: center; color: var(--success); font-size: 0.85rem; margin-top: 20px;">Todo está pagado 🎉</p>`;
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
            <span style="color: var(--text-muted); font-weight: 700;">TOTAL DEUDA</span>
            <span style="color: #ef4444; font-weight: 800;">$${totalPendienteGlobal.toLocaleString('es-CO')}</span>
        </div>`;

    const trabajadoresConSaldo = (window.usuariosGlobal || []).filter(u => Number(u.saldo_favor) > 0);
    if (trabajadoresConSaldo.length > 0) {
        html += `<div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
            <h5 style="color: var(--success); margin: 0 0 10px 0; font-size: 0.8rem; text-transform: uppercase;">Saldos a Favor</h5>`;
        trabajadoresConSaldo.forEach(t => {
            html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 0.8rem;">
                <span style="color: var(--text-main); font-weight: 500;">👤 ${t.nombre}</span>
                <span style="color: var(--success); font-weight: 700;">$${Number(t.saldo_favor).toLocaleString('es-CO')}</span>
            </div>`;
        });
        html += `</div>`;
    }

    contenedor.innerHTML = html;
}

function limpiarFiltrosGastos() {
    const mesActual = getFechaColombiaString().substring(0, 7);
    document.getElementById('fMesGasto').value = mesActual;
    document.getElementById('fTrabajadorGasto').value = "";
    document.getElementById('fProyectoGasto').value = "";
    filtrarGastos();
}

function switchModule(moduleName) {
    const horasModule = document.getElementById('horasModule');
    const gastosModule = document.getElementById('gastosModule');
    const tabHoras = document.getElementById('tabHoras');
    const tabGastos = document.getElementById('tabGastos');

    if (moduleName === 'horas') {
        horasModule.style.display = 'block';
        gastosModule.style.display = 'none';
        tabHoras.classList.add('btn-primary');
        tabHoras.classList.remove('btn-secondary');
        tabGastos.classList.add('btn-secondary');
        tabGastos.classList.remove('btn-primary');
    } else {
        horasModule.style.display = 'none';
        gastosModule.style.display = 'block';
        tabGastos.classList.add('btn-primary');
        tabGastos.classList.remove('btn-secondary');
        tabHoras.classList.add('btn-secondary');
        tabHoras.classList.remove('btn-primary');
        
        if (usuarioActual.role === 'colaborador') {
            document.getElementById('gastoTrabajador').value = usuarioActual.name;
            document.getElementById('gastoTrabajador').setAttribute('readonly', 'true');
        }
        if(!document.getElementById('gastoFecha').value) {
            document.getElementById('gastoFecha').value = getFechaColombiaString();
        }
        if(!document.getElementById('fechaPagoLote').value) {
            document.getElementById('fechaPagoLote').value = getFechaColombiaString();
        }
        filtrarGastos(); // Aplicar filtros al entrar
    }
}

function calcularTotalGasto() {
    const cantidad = parseFloat(document.getElementById('gastoCantidad').value) || 0;
    const valor = parseFloat(document.getElementById('gastoValor').value) || 0;
    document.getElementById('gastoTotal').value = cantidad * valor;
}

function limpiarFormularioGasto() {
    if (usuarioActual.role !== 'colaborador') {
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
    if (usuarioActual.role === 'colaborador') trabajador = usuarioActual.name;
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
        const workerProfile = (window.usuariosGlobal || []).find(u => u.nombre.trim() === trabajador);
        if (workerProfile && workerProfile.saldo_favor > 0) {
            let sf = Number(workerProfile.saldo_favor);
            if (sf >= gasto.total) {
                gasto.monto_pagado = gasto.total;
                gasto.estado = 'PAGO';
                gasto.fecha_pago = fecha;
                workerProfile.saldo_favor = sf - gasto.total;
                await window.API.actualizarSaldoFavor(trabajador, sf - gasto.total);
                Toast.success("Gasto cubierto automáticamente con Saldo a Favor.");
            } else {
                gasto.monto_pagado = sf;
                workerProfile.saldo_favor = 0;
                await window.API.actualizarSaldoFavor(trabajador, 0);
                Toast.success("Se aplicó Saldo a Favor al gasto. Queda saldo pendiente.");
            }
        }
    }

    if (editIdGasto !== null) {
        // Edit mode
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
        // Create mode
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
    if (usuarioActual.role === 'colaborador' && (g.trabajador || '').trim() !== usuarioActual.name.trim()) return Toast.error("Permiso denegado.");

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

function mostrarGastos(lista) {
    let html = '';
    const esAdmin = usuarioActual.role === 'admin' || usuarioActual.role === 'moderador';
    let totalGeneral = 0;
    let totalPagado = 0;
    let totalPendiente = 0;

    lista.forEach(g => {
        totalGeneral += Number(g.total || 0);
        let deudaReal = Number(g.total) - Number(g.monto_pagado || 0);
        if(g.estado === 'PAGO') {
            totalPagado += Number(g.total || 0);
        } else {
            totalPendiente += deudaReal;
            totalPagado += Number(g.monto_pagado || 0);
        }

        const rowStyle = g.estado === 'PAGO' ? 'background: rgba(16, 185, 129, 0.05);' : '';
        const badgeClass = g.estado === 'PAGO' ? 'bg-green' : 'bg-orange';
        const checkboxHtml = g.estado === 'PENDIENTE' ? `<span style="color:var(--danger)">⏳</span>` : `<span style="color:var(--success)">✓</span>`;

        let obs = g.observaciones || '';
        let obsTrun = obs;
        let btnObs = '';
        if(obs.length > 25) {
            obsTrun = obs.substring(0, 25) + '...';
            btnObs = `<button onclick="verObservacionesGasto('${encodeURIComponent(obs)}')" style="color:var(--primary); font-size:0.75rem; padding:0; background:none; text-decoration:underline;">Ver más</button>`;
        }

        const puedeEditar = esAdmin || ((g.trabajador || '').trim() === usuarioActual.name.trim());

        html += `
        <tr style="${rowStyle}">
            <td class="perm-mod-admin" style="text-align: center;">${checkboxHtml}</td>
            <td style="font-size: 0.85rem;">${g.fecha}</td>
            <td style="font-weight: 500;">${g.trabajador}</td>
            <td>${g.proyecto || 'N/A'}</td>
            <td>${g.item}</td>
            <td style="text-align: center;">${g.cantidad}</td>
            <td style="text-align: right;">$${Number(g.valor_unitario).toLocaleString('es-CO')}</td>
            <td style="text-align: right; font-weight: bold; color: var(--scitic-dark);">
                $${Number(g.total).toLocaleString('es-CO')}
                ${g.monto_pagado > 0 && g.estado === 'PENDIENTE' ? `<br><small style="color:var(--success)">Abono: $${Number(g.monto_pagado).toLocaleString('es-CO')}</small><br><small style="color:var(--danger)">Resta: $${(Number(g.total) - Number(g.monto_pagado)).toLocaleString('es-CO')}</small>` : ''}
            </td>
            <td>
                <span class="badge ${badgeClass}" style="${g.estado === 'PAGO' ? 'background: #10b981; color: white;' : 'background: #f97316; color: white;'}">
                    ${g.estado} ${g.fecha_pago ? `(${g.fecha_pago})` : ''}
                </span>
            </td>
            <td><small>${obsTrun}</small> <br> ${btnObs}</td>
            <td style="text-align: center;">
                <div class="action-btns" style="flex-direction: column; gap: 4px;">
                    ${puedeEditar ? `<button onclick="editarGasto('${g.id}')" style="color: var(--accent); font-weight: 600;">Editar</button>` : ''}
                    ${(esAdmin || g.estado === 'PENDIENTE') ? `<button onclick="eliminarGasto('${g.id}')" style="color: var(--danger); font-weight: 600;">Eliminar</button>` : ''}
                </div>
            </td>
        </tr>
        `;
    });

    document.getElementById('tablaGastos').innerHTML = html;
    animarNumero('stat-gastos-total', totalGeneral, "$", true);
    animarNumero('stat-gastos-pagado', totalPagado, "$", true);
    animarNumero('stat-gastos-pendiente', totalPendiente, "$", true);

    aplicarPermisos();
}

function verObservacionesGasto(obsEncoded) {
    document.getElementById('obsContent').innerText = decodeURIComponent(obsEncoded);
    document.getElementById('obsModal').classList.add('show');
}

function graficarGastos(lista) {
    const ctx = document.getElementById("graficoGastos"); 
    if(!ctx || ctx.offsetParent === null) return; // No graficar si está oculto

    const resumen = {};
    lista.forEach(g => {
        let clave = tipoGraficoGastos === 'proyecto' ? (g.proyecto || 'N/A').trim() : (g.item || 'Otros').trim();
        resumen[clave] = (resumen[clave] || 0) + Number(g.total || 0);
    });

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';
    if (window.chartGastos) window.chartGastos.destroy();

    let gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#10b981'); gradient.addColorStop(1, '#059669'); // Verde success

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

function toggleSelectAllGastos() {
    const selectAll = document.getElementById('selectAllGastos').checked;
    document.querySelectorAll('.gasto-chk').forEach(chk => {
        chk.checked = selectAll;
    });
}

async function procesarPagoAutomatico() {
    const trabajador = document.getElementById('pagoTrabajador').value;
    const fechaPago = document.getElementById('pagoFecha').value;
    const monto = parseFloat(document.getElementById('pagoMonto').value);

    if (!trabajador) return Toast.warning("Seleccione un trabajador.");
    if (!fechaPago) return Toast.warning("Seleccione la fecha de pago.");
    if (isNaN(monto) || monto <= 0) return Toast.warning("Ingrese un monto válido a pagar.");

    // Obtener todos los gastos PENDIENTES del trabajador, ordenados desde el más antiguo
    const gastosPendientes = gastosDatos
        .filter(g => g.estado === 'PENDIENTE' && (g.trabajador || '').trim() === trabajador)
        .sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0));

    if (gastosPendientes.length === 0) {
        return Toast.warning(`No hay gastos pendientes para ${trabajador}.`);
    }

    if (confirm(`¿Proceder con el pago automático de $${monto.toLocaleString('es-CO')} para ${trabajador} con fecha ${fechaPago}?`)) {
        showLoader("Procesando pago...");
        let saldoDisponible = monto;
        let exitoCount = 0;

        for (const gastoObj of gastosPendientes) {
            if (saldoDisponible <= 0) break;

            let deudaActual = Number(gastoObj.total || 0) - Number(gastoObj.monto_pagado || 0);

            if (saldoDisponible >= deudaActual) {
                saldoDisponible -= deudaActual;
                const success = await window.API.actualizarGasto(gastoObj.id, { estado: 'PAGO', fecha_pago: fechaPago, monto_pagado: gastoObj.total });
                if (success) exitoCount++;
            } else {
                const nuevoMonto = Number(gastoObj.monto_pagado || 0) + saldoDisponible;
                saldoDisponible = 0;
                const success = await window.API.actualizarGasto(gastoObj.id, { estado: 'PENDIENTE', monto_pagado: nuevoMonto });
                if (success) exitoCount++;
            }
        }

        // Si sobró saldo, se agrega como saldo a favor
        if (saldoDisponible > 0) {
            const workerProfile = (window.usuariosGlobal || []).find(u => u.nombre.trim() === trabajador);
            let saldoActual = workerProfile ? Number(workerProfile.saldo_favor || 0) : 0;
            const nuevoSaldo = saldoActual + saldoDisponible;
            if (workerProfile) workerProfile.saldo_favor = nuevoSaldo;
            await window.API.actualizarSaldoFavor(trabajador, nuevoSaldo);
            Toast.success(`Pago procesado. Se agregaron $${saldoDisponible.toLocaleString('es-CO')} como saldo a favor.`);
        } else {
            Toast.success(`Se procesaron pagos en ${exitoCount} gastos.`);
        }

        // Recargar datos
        const gastosDb = await window.API.getGastos();
        if (gastosDb) gastosDatos = gastosDb;
        filtrarGastos();
        document.getElementById('pagoMonto').value = '';
        
        registrarAuditoria("GASTO_PAGO", `Pago auto de $${monto} para ${trabajador} en ${exitoCount} registros.`);
        hideLoader();
    }
}

async function eliminarGasto(id) {
    if (confirm("¿Seguro que deseas eliminar permanentemente este gasto?")) {
        showLoader("Eliminando gasto...");
        const success = await window.API.eliminarGasto(id);
        if (success) {
            gastosDatos = gastosDatos.filter(g => g.id !== id);
            filtrarGastos();
            Toast.success("Gasto eliminado.");
            registrarAuditoria("GASTO_ELIMINAR", `Se eliminó un registro de gasto.`);
        }
        hideLoader();
    }
}