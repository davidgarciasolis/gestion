const API_URL = 'https://api.mueblesavenida.com';
let currentView = 'clientes';
let editId = null;
let currentPedidoId = null;
let accessToken = localStorage.getItem('access_token') || null;

// DOM Elements
const viewTitle = document.getElementById('view-title');
const btnCreate = document.getElementById('btn-create');
const appContent = document.getElementById('app-content');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const btnCloseModal = document.getElementById('btn-close-modal');
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// Init
document.addEventListener('DOMContentLoaded', () => {
    if (accessToken) {
        showApp();
    } else {
        loginContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }

    loginForm.addEventListener('submit', handleLogin);
    
    setupNavigation();
    btnCreate.addEventListener('click', () => openFormModal());
    btnCloseModal.addEventListener('click', closeModal);
});

function showApp() {
    loginContainer.style.display = 'none';
    appContainer.style.display = 'flex';
    loadView();
}

async function handleLogin(e) {
    e.preventDefault();
    loginError.textContent = '';
    const email = e.target.email.value;
    const password = e.target.password.value;
    
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.errors?.[0]?.message || 'Error de autenticación');
        
        accessToken = data.data.access_token;
        localStorage.setItem('access_token', accessToken);
        showApp();
    } catch (error) {
        loginError.textContent = error.message;
    }
}

async function fetchAPI(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (accessToken) {
        options.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const res = await fetch(url, options);
    // Optional: Handle 401 Unauthorized globally
    if (res.status === 401) {
        localStorage.removeItem('access_token');
        accessToken = null;
        appContainer.style.display = 'none';
        loginContainer.style.display = 'flex';
        throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
    }
    return res;
}

function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentView = e.target.getAttribute('data-view');
            viewTitle.textContent = currentView.charAt(0).toUpperCase() + currentView.slice(1);
            loadView();
        });
    });
}

async function loadView() {
    appContent.innerHTML = '<p>Cargando...</p>';
    try {
        const response = await fetchAPI(`${API_URL}/items/${currentView}`);
        if (!response.ok) throw new Error('Error al cargar los datos');
        const data = await response.json();
        
        if (currentView === 'clientes') renderClientes(data.data);
        else if (currentView === 'pedidos') renderPedidos(data.data);
    } catch (error) {
        appContent.innerHTML = `<p style="color:var(--danger)">Error: ${error.message}</p>`;
        console.error(error);
    }
}

function renderClientes(clientes) {
    if (!clientes || clientes.length === 0) {
        appContent.innerHTML = '<p>No hay clientes registrados.</p>';
        return;
    }
    
    let html = `
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Ciudad</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    clientes.forEach(c => {
        html += `
            <tr>
                <td>${c.id}</td>
                <td>${c.nombre || ''}</td>
                <td>${c.telefono || ''}</td>
                <td>${c.email || ''}</td>
                <td>${c.ciudad || ''}</td>
                <td class="actions-cell">
                    <button class="btn-primary btn-sm" onclick="editCliente(${c.id})">Editar</button>
                    <button class="btn-danger btn-sm" onclick="deleteRecord('clientes', ${c.id})">Borrar</button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table></div>`;
    appContent.innerHTML = html;
}

function renderPedidos(pedidos) {
    if (!pedidos || pedidos.length === 0) {
        appContent.innerHTML = '<p>No hay pedidos registrados.</p>';
        return;
    }
    
    let html = `
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Referencia</th>
                    <th>Cliente ID</th>
                    <th>Fecha</th>
                    <th>Modelo</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    pedidos.forEach(p => {
        html += `
            <tr>
                <td>${p.referencia || ''}</td>
                <td>${p.cliente_id || ''}</td>
                <td>${p.fecha_pedido || ''}</td>
                <td>${p.modelo || ''}</td>
                <td>${p.estado || ''}</td>
                <td>${p.total || '0.00'}</td>
                <td class="actions-cell">
                    <button class="btn-primary btn-sm" onclick="editPedido(${p.id})">Detalles / Editar</button>
                    <button class="btn-danger btn-sm" onclick="deleteRecord('pedidos', ${p.id})">Borrar</button>
                </td>
            </tr>
        `;
    });
    
    html += `</tbody></table></div>`;
    appContent.innerHTML = html;
}

function openFormModal(id = null, record = null) {
    editId = id;
    modalOverlay.classList.add('active');
    
    if (currentView === 'clientes') {
        modalTitle.textContent = id ? 'Editar Cliente' : 'Nuevo Cliente';
        modalBody.innerHTML = `
            <form id="record-form">
                <div class="form-group"><label>Nombre</label><input type="text" class="form-control" name="nombre" value="${record?.nombre || ''}" required></div>
                <div class="form-group"><label>Teléfono</label><input type="text" class="form-control" name="telefono" value="${record?.telefono || ''}"></div>
                <div class="form-group"><label>Email</label><input type="email" class="form-control" name="email" value="${record?.email || ''}"></div>
                <div class="form-group"><label>Dirección</label><input type="text" class="form-control" name="direccion" value="${record?.direccion || ''}"></div>
                <div class="form-group"><label>Ciudad</label><input type="text" class="form-control" name="ciudad" value="${record?.ciudad || ''}"></div>
                <div class="form-group"><label>Código Postal</label><input type="text" class="form-control" name="codigo_postal" value="${record?.codigo_postal || ''}"></div>
                <div class="form-group"><label>Observaciones</label><textarea class="form-control" name="observaciones">${record?.observaciones || ''}</textarea></div>
                <button type="submit" class="btn-primary">Guardar</button>
            </form>
        `;
    } else if (currentView === 'pedidos') {
        modalTitle.textContent = id ? 'Editar Pedido' : 'Nuevo Pedido';
        let lineasHtml = '';
        if (id) {
            lineasHtml = `<div class="sub-table-container" id="lineas-container"><p>Cargando líneas...</p></div>`;
            currentPedidoId = id;
            loadLineasPedido(id);
        }
        
        modalBody.innerHTML = `
            <form id="record-form">
                <div class="form-group"><label>Referencia</label><input type="text" class="form-control" name="referencia" value="${record?.referencia || ''}" required></div>
                <div class="form-group"><label>Cliente ID</label><input type="number" class="form-control" name="cliente_id" value="${record?.cliente_id || ''}" required></div>
                <div class="form-group"><label>Fecha Pedido</label><input type="date" class="form-control" name="fecha_pedido" value="${record?.fecha_pedido || ''}"></div>
                <div class="form-group"><label>Modelo</label><input type="text" class="form-control" name="modelo" value="${record?.modelo || ''}"></div>
                <div class="form-group"><label>Acabados</label><input type="text" class="form-control" name="acabados" value="${record?.acabados || ''}"></div>
                <div class="form-group"><label>Estado</label><input type="text" class="form-control" name="estado" value="${record?.estado || ''}"></div>
                <div class="form-group"><label>Total</label><input type="number" step="0.01" class="form-control" name="total" value="${record?.total || ''}"></div>
                <div class="form-group"><label>Observaciones</label><textarea class="form-control" name="observaciones">${record?.observaciones || ''}</textarea></div>
                <button type="submit" class="btn-primary">Guardar Pedido</button>
            </form>
            ${lineasHtml}
        `;
    }
    
    document.getElementById('record-form').addEventListener('submit', handleFormSubmit);
}

function closeModal() {
    modalOverlay.classList.remove('active');
    editId = null;
    currentPedidoId = null;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Parse numbers properly
    if(data.cliente_id) data.cliente_id = parseInt(data.cliente_id);
    if(data.total) data.total = parseFloat(data.total);

    const method = editId ? 'PATCH' : 'POST';
    const url = editId ? `${API_URL}/items/${currentView}/${editId}` : `${API_URL}/items/${currentView}`;
    
    try {
        const res = await fetchAPI(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!res.ok) throw new Error('Error al guardar');
        closeModal();
        loadView();
    } catch (err) {
        alert(err.message);
    }
}

async function editCliente(id) {
    try {
        const res = await fetchAPI(`${API_URL}/items/clientes/${id}`);
        const data = await res.json();
        openFormModal(id, data.data);
    } catch (err) { alert('Error al cargar datos'); }
}

async function editPedido(id) {
    try {
        const res = await fetchAPI(`${API_URL}/items/pedidos/${id}`);
        const data = await res.json();
        openFormModal(id, data.data);
    } catch (err) { alert('Error al cargar datos'); }
}

async function deleteRecord(collection, id) {
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
    try {
        await fetchAPI(`${API_URL}/items/${collection}/${id}`, { method: 'DELETE' });
        loadView();
    } catch (err) {
        alert('Error al eliminar');
    }
}

// LÍNEAS DE PEDIDO
async function loadLineasPedido(pedidoId) {
    const container = document.getElementById('lineas-container');
    if(!container) return;
    
    try {
        // Filtrar lineas_pedido por pedido_id (sintaxis Directus: filter[field][_eq]=value)
        const res = await fetchAPI(`${API_URL}/items/lineas_pedido?filter[pedido_id][_eq]=${pedidoId}`);
        const data = await res.json();
        const lineas = data.data || [];
        
        let html = `
            <div class="sub-table-header">
                <h4>Líneas de Pedido</h4>
                <button type="button" class="btn-primary btn-sm" onclick="openLineaForm()">+ Línea</button>
            </div>
            <table style="font-size:0.8rem">
                <thead>
                    <tr><th>Artículo</th><th>Cant.</th><th>Ref.</th><th>Precio</th><th>Acciones</th></tr>
                </thead>
                <tbody>
        `;
        
        if(lineas.length === 0) {
            html += `<tr><td colspan="5">No hay líneas.</td></tr>`;
        } else {
            lineas.forEach(l => {
                html += `
                    <tr>
                        <td>${l.articulo || ''}</td>
                        <td>${l.cantidad}</td>
                        <td>${l.referencia_producto || ''}</td>
                        <td>${l.precio || '0.00'}</td>
                        <td>
                            <button type="button" class="btn-danger btn-sm" onclick="deleteLinea(${l.id})">X</button>
                        </td>
                    </tr>
                `;
            });
        }
        html += `</tbody></table>`;
        container.innerHTML = html;
        
        // Add form area for new linea
        container.innerHTML += `
            <div id="form-linea-container" style="display:none; margin-top:1rem; padding-top:1rem; border-top:1px solid var(--border-color);">
                <h5>Nueva Línea</h5>
                <div style="display:flex; gap:0.5rem; margin-top:0.5rem; flex-wrap:wrap;">
                    <input type="number" id="nl_cant" class="form-control" placeholder="Cant." style="width:80px">
                    <input type="text" id="nl_art" class="form-control" placeholder="Artículo" style="flex:1">
                    <input type="text" id="nl_ref" class="form-control" placeholder="Ref." style="width:100px">
                    <input type="number" id="nl_precio" class="form-control" placeholder="Precio" style="width:100px">
                    <button type="button" class="btn-primary btn-sm" onclick="saveLinea()">Añadir</button>
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = '<p style="color:var(--danger)">Error al cargar líneas.</p>';
    }
}

function openLineaForm() {
    document.getElementById('form-linea-container').style.display = 'block';
}

async function saveLinea() {
    const data = {
        pedido_id: currentPedidoId,
        cantidad: parseInt(document.getElementById('nl_cant').value) || 1,
        articulo: document.getElementById('nl_art').value,
        referencia_producto: document.getElementById('nl_ref').value,
        precio: parseFloat(document.getElementById('nl_precio').value) || 0,
    };
    
    try {
        const res = await fetchAPI(`${API_URL}/items/lineas_pedido`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if(!res.ok) throw new Error('Error al añadir línea');
        loadLineasPedido(currentPedidoId);
    } catch (err) {
        alert(err.message);
    }
}

async function deleteLinea(id) {
    if(!confirm('¿Borrar línea?')) return;
    try {
        await fetchAPI(`${API_URL}/items/lineas_pedido/${id}`, { method: 'DELETE' });
        loadLineasPedido(currentPedidoId);
    } catch (err) {
        alert('Error');
    }
}
