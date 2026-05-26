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
const btnLogout = document.getElementById('btn-logout');

// Init
document.addEventListener('DOMContentLoaded', () => {
    if (accessToken) {
        showApp();
    } else {
        loginContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }

    loginForm.addEventListener('submit', handleLogin);
    btnLogout.addEventListener('click', handleLogout);
    
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

function handleLogout() {
    localStorage.removeItem('access_token');
    window.location.reload();
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
        modalTitle.textContent = 'Nuevo Pedido';
        modalBody.innerHTML = `
            <form id="record-form">
                <div class="form-group"><label>Referencia</label><input type="text" class="form-control" name="referencia" value="" required></div>
                <div class="form-group"><label>Cliente ID</label><input type="number" class="form-control" name="cliente_id" value="" required></div>
                <div class="form-group"><label>Fecha Pedido</label><input type="date" class="form-control" name="fecha_pedido" value=""></div>
                <div class="form-group"><label>Modelo</label><input type="text" class="form-control" name="modelo" value=""></div>
                <div class="form-group"><label>Acabados</label><input type="text" class="form-control" name="acabados" value=""></div>
                <div class="form-group"><label>Estado</label><input type="text" class="form-control" name="estado" value=""></div>
                <div class="form-group"><label>Total</label><input type="number" step="0.01" class="form-control" name="total" value=""></div>
                <div class="form-group"><label>Observaciones</label><textarea class="form-control" name="observaciones"></textarea></div>
                <button type="submit" class="btn-primary">Crear Pedido</button>
            </form>
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
    appContent.innerHTML = '<p>Cargando detalle del pedido...</p>';
    viewTitle.textContent = `Pedido #${id}`;
    btnCreate.style.display = 'none'; // Hide create button on detail view
    
    try {
        // Fetch pedido
        const resP = await fetchAPI(`${API_URL}/items/pedidos/${id}`);
        const dataP = await resP.json();
        const pedido = dataP.data;

        // Fetch lineas
        const resL = await fetchAPI(`${API_URL}/items/lineas_pedido?filter[pedido_id][_eq]=${id}`);
        const dataL = await resL.json();
        const lineas = dataL.data || [];

        // Build HTML
        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2rem;">
                <h3>Información del Pedido</h3>
                <button class="btn-primary btn-sm" onclick="btnCreate.style.display='block'; loadView()">Volver a Pedidos</button>
            </div>
            
            <div class="glass-panel" style="padding: 2rem; margin-bottom: 2rem; max-width: 100%; transform: none;">
                <form id="detail-record-form" style="display:grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <div class="form-group"><label>Referencia</label><input type="text" class="form-control" name="referencia" value="${pedido?.referencia || ''}" required></div>
                    <div class="form-group"><label>Cliente ID</label><input type="number" class="form-control" name="cliente_id" value="${pedido?.cliente_id || ''}" required></div>
                    <div class="form-group"><label>Fecha Pedido</label><input type="date" class="form-control" name="fecha_pedido" value="${pedido?.fecha_pedido || ''}"></div>
                    <div class="form-group"><label>Modelo</label><input type="text" class="form-control" name="modelo" value="${pedido?.modelo || ''}"></div>
                    <div class="form-group"><label>Acabados</label><input type="text" class="form-control" name="acabados" value="${pedido?.acabados || ''}"></div>
                    <div class="form-group"><label>Estado</label><input type="text" class="form-control" name="estado" value="${pedido?.estado || ''}"></div>
                    <div class="form-group"><label>Total</label><input type="number" step="0.01" class="form-control" name="total" value="${pedido?.total || ''}"></div>
                    <div class="form-group" style="grid-column: span 2;"><label>Observaciones</label><textarea class="form-control" name="observaciones">${pedido?.observaciones || ''}</textarea></div>
                    <div style="grid-column: span 2;">
                        <button type="submit" class="btn-primary">Guardar Cambios del Pedido</button>
                    </div>
                </form>

                <hr style="border: none; border-top: 1px solid var(--border-color); margin: 2.5rem 0;">

                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
                    <h3 style="margin: 0; font-size: 1.25rem;">Líneas de Pedido</h3>
                    <button type="button" class="btn-primary btn-sm" onclick="document.getElementById('form-linea-container').style.display='block'">+ Añadir Línea</button>
                </div>
                
                <div class="table-container" style="margin-bottom: 2rem; background: rgba(15, 23, 42, 0.3);">
                    <table>
                        <thead>
                            <tr>
                                <th>Artículo</th>
                                <th>Cant.</th>
                                <th>Ref.</th>
                                <th>Acabado</th>
                                <th>Precio</th>
                                <th>Obs.</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        if (lineas.length === 0) {
            html += `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No hay líneas registradas para este pedido.</td></tr>`;
        } else {
            lineas.forEach(l => {
                html += `
                    <tr>
                        <td>${l.articulo || ''}</td>
                        <td>${l.cantidad}</td>
                        <td>${l.referencia_producto || ''}</td>
                        <td>${l.acabado || ''}</td>
                        <td>${l.precio || '0.00'}</td>
                        <td>${l.observaciones || ''}</td>
                        <td class="actions-cell">
                            <button type="button" class="btn-danger btn-sm" onclick="deleteLinea(${l.id}, ${id})">X</button>
                        </td>
                    </tr>
                `;
            });
        }

        html += `
                        </tbody>
                    </table>
                </div>

                <div id="form-linea-container" class="glass-panel" style="display:none; padding: 2rem; max-width: 100%; transform: none; background: rgba(15, 23, 42, 0.4); border: 1px dashed var(--border-color); box-shadow: none;">
                    <h4 style="margin-bottom: 1rem;">Nueva Línea</h4>
                    <div style="display:flex; gap:1rem; margin-top:1rem; flex-wrap:wrap; align-items:center;">
                        <div class="form-group" style="margin-bottom:0;"><input type="number" id="nl_cant" class="form-control" placeholder="Cant." style="width:80px"></div>
                        <div class="form-group" style="margin-bottom:0; flex:1; min-width:180px;"><input type="text" id="nl_art" class="form-control" placeholder="Artículo"></div>
                        <div class="form-group" style="margin-bottom:0;"><input type="text" id="nl_ref" class="form-control" placeholder="Referencia" style="width:120px"></div>
                        <div class="form-group" style="margin-bottom:0;"><input type="text" id="nl_acabado" class="form-control" placeholder="Acabado" style="width:120px"></div>
                        <div class="form-group" style="margin-bottom:0;"><input type="number" id="nl_precio" class="form-control" placeholder="Precio" style="width:100px" step="0.01"></div>
                        <div class="form-group" style="margin-bottom:0; flex:1; min-width:180px;"><input type="text" id="nl_obs" class="form-control" placeholder="Observaciones"></div>
                        <button type="button" class="btn-primary" onclick="saveLinea(${id})">Guardar Línea</button>
                        <button type="button" class="btn-danger" onclick="document.getElementById('form-linea-container').style.display='none'">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
        
        appContent.innerHTML = html;

        document.getElementById('detail-record-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updateData = Object.fromEntries(formData.entries());
            if(updateData.cliente_id) updateData.cliente_id = parseInt(updateData.cliente_id);
            if(updateData.total) updateData.total = parseFloat(updateData.total);
            
            try {
                const r = await fetchAPI(`${API_URL}/items/pedidos/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });
                if(!r.ok) throw new Error('Error al actualizar pedido');
                alert('Pedido actualizado');
            } catch(err) {
                alert(err.message);
            }
        });

    } catch (error) {
        appContent.innerHTML = `<p style="color:var(--danger)">Error: ${error.message}</p>`;
    }
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

async function saveLinea(pedidoId) {
    const data = {
        pedido_id: pedidoId,
        cantidad: parseInt(document.getElementById('nl_cant').value) || 1,
        articulo: document.getElementById('nl_art').value,
        referencia_producto: document.getElementById('nl_ref').value,
        acabado: document.getElementById('nl_acabado').value,
        precio: parseFloat(document.getElementById('nl_precio').value) || 0,
        observaciones: document.getElementById('nl_obs').value,
    };
    
    try {
        const res = await fetchAPI(`${API_URL}/items/lineas_pedido`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if(!res.ok) throw new Error('Error al añadir línea');
        editPedido(pedidoId); // Reload the detail view
    } catch (err) {
        alert(err.message);
    }
}

async function deleteLinea(id, pedidoId) {
    if(!confirm('¿Borrar línea?')) return;
    try {
        await fetchAPI(`${API_URL}/items/lineas_pedido/${id}`, { method: 'DELETE' });
        editPedido(pedidoId); // Reload the detail view
    } catch (err) {
        alert('Error');
    }
}
