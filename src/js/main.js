// ==========================================
// 1. CONFIGURACIÓN Y VARIABLES GLOBALES
// ==========================================
const SUPABASE_URL = 'https://qgrkvjvyiwxmbuyfnqea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hRIpVDeHHVeAJZaRnSckQQ_szYcmZSn'; 

const dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let datos = [];
let auditoria = [];
let listaFiltradaGlobal = []; 
let alertasDetalladasGlobales = []; 
let editId = null;
let usuarioActual = null;

// ==========================================
// 2. INICIALIZACIÓN Y AUTENTICACIÓN
// ==========================================
window.onload = function() {
    const sesionGuardada = sessionStorage.getItem('scitic_session');
    if (sesionGuardada) {
        usuarioActual = JSON.parse(sesionGuardada);
        iniciarApp();
    } else {
        document.getElementById('loginView').style.display = 'flex';
        document.getElementById('appView').style.display = 'none';
    }
};

async function iniciarSesion() {
    const u = document.getElementById('inUser').value.trim().toLowerCase();
    const p = document.getElementById('inPass').value.trim();
    const btn = document.querySelector('.login-box button');
    const errorMsg = document.getElementById('loginError');
    
    if(!u || !p) return;
    
    btn.innerText = "Autenticando...";
    btn.disabled = true;

    const { data: userDb, error } = await dbClient.from('usuarios').select('*').eq('usuario', u).single();

    if (userDb && userDb.password === p) {
        usuarioActual = { usuario: userDb.usuario, name: userDb.nombre, role: userDb.rol };
        sessionStorage.setItem('scitic_session', JSON.stringify(usuarioActual));
        errorMsg.style.display = 'none';
        iniciarApp();
    } else {
        errorMsg.style.display = 'block';
    }
    
    btn.innerText = "Ingresar al Sistema";
    btn.disabled = false;
}

function cerrarSesion() {
    sessionStorage.removeItem('scitic_session');
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
    await dbClient.from('auditoria').insert([log]);
    auditoria.unshift(log); 
}

function descargarAuditoria() {
    if(auditoria.length === 0) return alert("No hay registros de auditoría aún.");
    const ws = XLSX.utils.json_to_sheet(auditoria);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Auditoria_Eventos");
    XLSX.writeFile(wb, `SCITIC_Auditoria_${new Date().getTime()}.xlsx`);
}

async function iniciarApp() {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('appView').style.display = 'block';
    document.getElementById('displayUserName').innerText = "Cargando...";
    
    aplicarPermisos();

    const { data: registrosDb, error: err1 } = await dbClient.from('registros').select('*');
    if (registrosDb) datos = registrosDb;
    else console.error("Error cargando registros:", err1);

    const { data: auditDb } = await dbClient.from('auditoria').select('*').order('created_at', { ascending: false });
    if (auditDb) auditoria = auditDb;

    recalcularProgresos();
    document.getElementById('fecha').valueAsDate = new Date();
    
    inicializarDatosGlobales();

    document.getElementById('displayUserName').innerText = usuarioActual.name;
    document.getElementById('displayUserRole').innerText = usuarioActual.role;
    await registrarAuditoria("LOGIN", "El usuario inició sesión.");
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
        if(!d.proyecto) return;

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

    datos.forEach(d => { if(d.trabajador) trabajadoresSet.add(d.trabajador.trim()); });
    
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
        if(d.fecha && d.fecha.length >= 7) mesesGlobales.add(d.fecha.substring(0,7));
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
        const matchMes = !fMes || ((d.fecha || '') && (d.fecha || '').substring(0,7) === fMes);
        
        let matchBusqueda = true;
        if (fBusqueda) {
            const textoFila = `${d.cliente || ''} ${d.proyecto || ''} ${d.trabajador || ''} ${d.actividad || ''}`.toLowerCase();
            matchBusqueda = textoFila.includes(fBusqueda);
        }
        return matchCliente && matchTrabajador && matchProyecto && matchMes && matchBusqueda;
    });
    
    mostrar(listaFiltradaGlobal);
    graficar(listaFiltradaGlobal);
    if(usuarioActual.role === 'admin') {
        generarAlertas(); 
        generarDesgloseAdmin(listaFiltradaGlobal); 
    }

    const datosParaCliente = datos.filter(d => (!ft || (d.trabajador || '').trim() === ft) && (!fp || (d.proyecto || '').trim() === fp));
    const clientesSet = new Set(datosParaCliente.map(d => (d.cliente || '').trim()).filter(Boolean));
    
    const datosParaTrabajador = datos.filter(d => (!fc || (d.cliente || '').trim() === fc) && (!fp || (d.proyecto || '').trim() === fp));
    const trabajadoresSet = new Set(datosParaTrabajador.map(d => (d.trabajador || '').trim()).filter(Boolean));
    
    const datosParaProyecto = datos.filter(d => (!fc || (d.cliente || '').trim() === fc) && (!ft || (d.trabajador || '').trim() === ft));
    const proyectosSet = new Set(datosParaProyecto.map(d => (d.proyecto || '').trim()).filter(Boolean));

    llenarSelectManteniendoValor('fCliente', clientesSet, fc);
    if(usuarioActual.role !== 'colaborador') llenarSelectManteniendoValor('fTrabajador', trabajadoresSet, ft);
    llenarSelectManteniendoValor('fProyecto', proyectosSet, fp);
}

function llenarSelectManteniendoValor(id, set, valorActual) {
    const el = document.getElementById(id);
    if(!el) return;
    let html = '<option value="">Todos</option>';
    [...set].sort().forEach(val => {
        const selected = val === valorActual ? 'selected' : '';
        html += `<option value="${val}" ${selected}>${val}</option>`;
    });
    el.innerHTML = html;
}

function limpiarFiltros() {
    document.getElementById('fCliente').value = "";
    if(usuarioActual.role !== 'colaborador') document.getElementById('fTrabajador').value = "";
    document.getElementById('fProyecto').value = "";
    document.getElementById('fMes').value = "";
    document.getElementById('fBusqueda').value = "";
    filtrar();
}

async function guardar() {
    let trabajadorVal = document.getElementById('trabajador').value;
    if(usuarioActual.role === 'colaborador') trabajadorVal = usuarioActual.name;
    
    // Limpiamos los espacios en blanco antes de guardar
    trabajadorVal = (trabajadorVal || '').trim();
    const proyectoVal = (document.getElementById('proyecto').value || '').trim();
    const clienteVal = (document.getElementById('cliente').value || '').trim();

    if(!trabajadorVal) return alert("Debe ingresar el nombre del personal.");
    if(!proyectoVal) return alert("Debe ingresar el nombre del proyecto.");
    
    const btn = document.getElementById('btnGuardar');
    btn.innerText = "Procesando...";
    btn.disabled = true;

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
            if(!obj.cliente) obj.cliente = (proyExistente.cliente || "").trim(); 
        }
    }

    obj.pago = obj.horas * obj.valor;
    let accionAuditoria = "";

    if (editId !== null) {
        const index = datos.findIndex(d => d.id === editId);
        if(index !== -1) {
            const { error } = await dbClient.from('registros').update(obj).eq('id', editId);
            if(!error) {
                datos[index] = obj;
                accionAuditoria = `EDITAR: Modificó horas a ${obj.horas}h en proy. ${obj.proyecto}`;
            }
        }
    } else {
        const { error } = await dbClient.from('registros').insert([obj]);
        if(!error) {
            datos.push(obj);
            accionAuditoria = `CREAR: Registró ${obj.horas}h en proy. ${obj.proyecto}`;
        } else {
            alert("Error de conexión: " + error.message);
        }
    }

    recalcularProgresos();
    await registrarAuditoria(editId ? "EDICIÓN" : "CREACIÓN", accionAuditoria);
    
    btn.disabled = false;
    inicializarDatosGlobales();
    limpiarFormulario();
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
    if(usuarioActual.role !== 'admin') return;
    
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
        if (fechaB.getTime() === fechaA.getTime()) return (b.id||'').localeCompare(a.id||'');
        return fechaB - fechaA;
    });
    
    const esAdmin = usuarioActual.role === 'admin';

    listaOrdenada.forEach((d, index) => {
        totalH += Number(d.horas || 0); totalP += Number(d.pago || 0);
        if(d.proyecto) proyActivos.add(d.proyecto.trim());
        const animDelay = Math.min(index * 0.02, 0.5); 
        
        const puedeEditar = esAdmin || usuarioActual.role === 'moderador' || ((d.trabajador || '').trim() === usuarioActual.name.trim());

        htmlTabla += `
        <tr class="animated-row" style="animation-delay: ${animDelay}s;">
            <td style="color:var(--text-muted); font-size: 0.85rem; font-weight: 500;">${d.fecha || 'N/A'}</td>
            <td><span class="project-link" onclick="verDetalle('${(d.proyecto||'').trim()}')">${(d.proyecto||'').trim()||'N/A'}</span><br><small style="color:var(--text-muted)">${(d.cliente||'').trim()||''}</small></td>
            <td style="font-weight: 500;">${(d.trabajador||'').trim()||'N/A'}</td>
            <td><strong style="color: var(--scitic-dark);">${d.horas||0} h</strong></td>
            ${esAdmin ? `<td style="color: var(--primary); font-weight: 600;">$${Number(d.pago||0).toLocaleString('es-CO')}</td>` : ''}
            ${esAdmin ? `<td><div class="progress-bar-container"><div class="progress-bar" style="width: ${Math.min(d.progreso||0, 100)}%; ${Number(d.progreso||0)>100 ? 'background:linear-gradient(135deg, #ef4444, #dc2626);':''}"></div></div><small style="${Number(d.progreso||0)>100 ? 'color: var(--danger); font-weight:bold;':''}">${d.progreso||0}%</small></td>` : ''}
            <td><span class="badge bg-blue">${d.actividad||'N/A'}</span></td>
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
    const obj = document.getElementById(id); if(!obj) return;
    let startTimestamp = null; const duration = 800; 
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.floor(easeOut * finalValue);
        obj.innerHTML = esMoneda ? sufijo + currentVal.toLocaleString('es-CO') : (sufijo === "$" ? sufijo + currentVal : currentVal + sufijo); 
        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = esMoneda ? sufijo + finalValue.toLocaleString('es-CO') : (sufijo === "$" ? sufijo + finalValue : finalValue + sufijo);
    };
    window.requestAnimationFrame(step);
}

function verDetalle(nombre) {
    if (!nombre) return;
    const registros = datos.filter(d => (d.proyecto||'').trim() === nombre);
    if(registros.length === 0) return;
    document.getElementById('modalNombreProy').innerText = nombre;
    document.getElementById('modalCliente').innerText = (registros[0].cliente || '').trim();
    let h = 0, c = 0; let act = { DISEÑO: 0, RRHH: 0, OBRAS: 0 };
    registros.forEach(r => { h += Number(r.horas||0); c += Number(r.pago||0); if(act[r.actividad] !== undefined) act[r.actividad] += Number(r.horas||0); });
    document.getElementById('mHoras').innerText = h + " h";
    document.getElementById('mCosto').innerText = "$" + c.toLocaleString('es-CO');
    document.getElementById('mActividades').innerHTML = Object.entries(act).map(([k,v]) => `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;"><span style="font-weight: 600; color: var(--scitic-dark);"><span class="badge bg-blue">${k}</span></span><span style="font-size: 1.1rem; color: var(--primary); font-weight: 600;">${v} h</span></div>`).join("");
    document.getElementById('detalleModal').classList.add('show');
}

function cerrarModal(modalId) { 
    const modal = document.getElementById(modalId); 
    if(!modal) return;
    modal.classList.remove('show');
    setTimeout(() => { if(!modal.classList.contains('show')) modal.style.display = 'none'; modal.style.display = ''; }, 300);
}

// ==========================================
// 6. UI Y GRÁFICOS
// ==========================================
function graficar(listaFiltrada) {
    const ctx = document.getElementById("grafico"); const resumen = {};
    listaFiltrada.forEach(d => {
        if(d.proyecto) {
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
    if(usuarioActual.role !== 'admin') return alert("Acceso denegado.");
    const file = document.getElementById('excelFile').files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        document.getElementById('displayUserName').innerText = "Importando...";
        const data = new Uint8Array(e.target.result); const wb = XLSX.read(data, {type: "array"});
        let importados = [];
        wb.SheetNames.forEach(sheetName => {
            const raw = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {header: 1});
            let headerIdx = 0; for(let i=0; i<15; i++) { if(raw[i] && (raw[i].includes("Proyecto") || raw[i].includes("Cliente"))) { headerIdx = i; break; } }
            const json = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {range: headerIdx, defval: ""});
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

        const { error } = await dbClient.from('registros').insert(importados);
        if(!error) {
            datos = datos.concat(importados);
            recalcularProgresos();
            await registrarAuditoria("IMPORTAR", `Se importaron ${importados.length} registros desde Excel.`);
            inicializarDatosGlobales();
            document.getElementById('excelFile').value = '';
            alert(`Éxito: Se importaron ${importados.length} registros.`);
        } else {
            alert("Error en base de datos: " + error.message);
        }
        document.getElementById('displayUserName').innerText = usuarioActual.name;
    };
    reader.readAsArrayBuffer(file);
}

async function exportarExcel() {
    if (listaFiltradaGlobal.length === 0) return alert("No hay datos para exportar.");
    const esAdmin = usuarioActual.role === 'admin';
    const datosSalida = listaFiltradaGlobal.map(d => {
        let fila = { "Fecha": d.fecha, "Cliente": (d.cliente||'').trim(), "Proyecto": (d.proyecto||'').trim(), "Trabajador": (d.trabajador||'').trim(), "Actividad": d.actividad, "Horas Trabajadas": d.horas };
        if(esAdmin) {
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
}

function limpiarFormulario() {
    document.getElementById('cliente').value = ""; 
    document.getElementById('proyecto').value = "";
    if(usuarioActual.role !== 'colaborador') {
        document.getElementById('trabajador').value = "";
    }
    document.getElementById('horasPres').value = "0"; 
    document.getElementById('horas').value = "0"; 
    document.getElementById('valor').value = "0";
    document.getElementById('fecha').valueAsDate = new Date(); 
    document.getElementById('actividad').value = "DISEÑO";
    
    editId = null;
    document.getElementById('formTitle').innerText = "Nuevo Registro"; 
    document.getElementById('formularioRegistro').classList.remove('editing-mode');
    document.getElementById('btnGuardar').innerText = "Guardar Actividad"; 
    
    document.getElementById('btnLimpiar').style.display = "block"; 
    document.getElementById('btnCancelar').style.display = "none"; 
    
    // Recalcular las listas desplegables vacías (o filtradas por el trabajador si es colaborador)
    manejarCambiosFormulario();
}

async function eliminar(id) {
    if(usuarioActual.role !== 'admin') return;
    const registro = datos.find(d => d.id === id);
    if(confirm("¿Seguro que deseas eliminar permanentemente este registro?")) {
        const { error } = await dbClient.from('registros').delete().eq('id', id);
        if(!error) {
            datos = datos.filter(d => d.id !== id);
            recalcularProgresos();
            await registrarAuditoria("ELIMINAR", `Se borró registro de ${registro.horas}h de ${registro.trabajador} en ${registro.proyecto}.`);
            inicializarDatosGlobales();
            if (editId === id) limpiarFormulario();
        }
    }
}

function editar(id) {
    const d = datos.find(x => x.id === id); if (!d) return;
    if(usuarioActual.role === 'colaborador' && (d.trabajador||'').trim() !== usuarioActual.name.trim()) return alert("Permiso denegado.");
    
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
}