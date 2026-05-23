const API_URL = 'http://192.168.0.3:8055';
let accessToken = '';

// --- Login ---
document.getElementById('login-btn').onclick = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');
  errorDiv.textContent = '';
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.data && data.data.access_token) {
      accessToken = data.data.access_token;
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('main-section').style.display = 'block';
      loadClients();
      loadOrders();
    } else {
      errorDiv.textContent = 'Credenciales incorrectas';
    }
  } catch (e) {
    errorDiv.textContent = 'Error de conexión';
  }
};

document.getElementById('logout-btn').onclick = function() {
  accessToken = '';
  document.getElementById('main-section').style.display = 'none';
  document.getElementById('login-section').style.display = 'block';
};

// --- Clientes ---
async function loadClients() {
  const res = await fetch(`${API_URL}/items/clientes`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await res.json();
  const list = document.getElementById('clients-list');
  list.innerHTML = '';
  if (data.data && data.data.length) {
    const table = document.createElement('table');
    table.innerHTML = `<tr><th>ID</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Dirección</th><th>Acciones</th></tr>`;
    data.data.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${c.id}</td><td>${c.nombre||''}</td><td>${c.email||''}</td><td>${c.telefono||''}</td><td>${c.direccion||''}</td><td><button onclick=\"editClient(${c.id})\">Editar</button><button onclick=\"deleteClient(${c.id})\">Borrar</button></td>`;
      table.appendChild(tr);
    });
    list.appendChild(table);
  } else {
    list.textContent = 'No hay clientes.';
  }
}

document.getElementById('add-client-btn').onclick = function() {
  showClientForm();
};

function showClientForm(client) {
  const section = document.getElementById('client-form-section');
  section.style.display = 'block';
  section.innerHTML = `<h3>${client ? 'Editar' : 'Nuevo'} Cliente</h3>
    <input id=\"client-nombre\" placeholder=\"Nombre\" value=\"${client?.nombre||''}\"><br>
    <input id=\"client-email\" placeholder=\"Email\" value=\"${client?.email||''}\"><br>
    <input id=\"client-telefono\" placeholder=\"Teléfono\" value=\"${client?.telefono||''}\"><br>
    <input id=\"client-direccion\" placeholder=\"Dirección\" value=\"${client?.direccion||''}\"><br>
    <button id=\"save-client-btn\">Guardar</button>
    <button id=\"cancel-client-btn\">Cancelar</button>
    <div id=\"client-form-error\" class=\"error\"></div>`;
  document.getElementById('save-client-btn').onclick = async function() {
    const nombre = document.getElementById('client-nombre').value;
    const email = document.getElementById('client-email').value;
    const telefono = document.getElementById('client-telefono').value;
    const direccion = document.getElementById('client-direccion').value;
    const errorDiv = document.getElementById('client-form-error');
    errorDiv.textContent = '';
    try {
      let res;
      if (client) {
        res = await fetch(`${API_URL}/items/clientes/${client.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ nombre, email, telefono, direccion })
        });
      } else {
        res = await fetch(`${API_URL}/items/clientes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ nombre, email, telefono, direccion })
        });
      }
      if (res.ok) {
        section.style.display = 'none';
        loadClients();
      } else {
        errorDiv.textContent = 'Error al guardar.';
      }
    } catch (e) {
      errorDiv.textContent = 'Error de conexión.';
    }
  };
  document.getElementById('cancel-client-btn').onclick = function() {
    section.style.display = 'none';
  };
}

window.editClient = async function(id) {
  const res = await fetch(`${API_URL}/items/clientes/${id}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await res.json();
  showClientForm(data.data);
};

window.deleteClient = async function(id) {
  if (!confirm('¿Borrar este cliente?')) return;
  await fetch(`${API_URL}/items/clientes/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  loadClients();
};

// --- Pedidos ---
async function loadOrders() {
  const res = await fetch(`${API_URL}/items/pedidos`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await res.json();
  const list = document.getElementById('orders-list');
  list.innerHTML = '';
  if (data.data && data.data.length) {
    const table = document.createElement('table');
    table.innerHTML = `<tr><th>ID</th><th>Referencia</th><th>Cliente</th><th>Estado</th><th>Acciones</th></tr>`;
    data.data.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${p.id}</td><td>${p.referencia||''}</td><td>${p.cliente_id||''}</td><td>${p.estado||''}</td><td><button onclick=\"editOrder(${p.id})\">Editar</button><button onclick=\"deleteOrder(${p.id})\">Borrar</button><button onclick=\"viewOrderLines(${p.id})\">Líneas</button></td>`;
      table.appendChild(tr);
    });
    list.appendChild(table);
  } else {
    list.textContent = 'No hay pedidos.';
  }
}

document.getElementById('add-order-btn').onclick = function() {
  showOrderForm();
};

function showOrderForm(order) {
  const section = document.getElementById('order-form-section');
  section.style.display = 'block';
  section.innerHTML = `<h3>${order ? 'Editar' : 'Nuevo'} Pedido</h3>
    <input id=\"order-referencia\" placeholder=\"Referencia\" value=\"${order?.referencia||''}\"><br>
    <input id=\"order-cliente_id\" placeholder=\"ID Cliente\" value=\"${order?.cliente_id||''}\"><br>
    <input id=\"order-estado\" placeholder=\"Estado\" value=\"${order?.estado||''}\"><br>
    <button id=\"save-order-btn\">Guardar</button>
    <button id=\"cancel-order-btn\">Cancelar</button>
    <div id=\"order-form-error\" class=\"error\"></div>`;
  document.getElementById('save-order-btn').onclick = async function() {
    const referencia = document.getElementById('order-referencia').value;
    const cliente_id = document.getElementById('order-cliente_id').value;
    const estado = document.getElementById('order-estado').value;
    const errorDiv = document.getElementById('order-form-error');
    errorDiv.textContent = '';
    try {
      let res;
      if (order) {
        res = await fetch(`${API_URL}/items/pedidos/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ referencia, cliente_id, estado })
        });
      } else {
        res = await fetch(`${API_URL}/items/pedidos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ referencia, cliente_id, estado })
        });
      }
      if (res.ok) {
        section.style.display = 'none';
        loadOrders();
      } else {
        errorDiv.textContent = 'Error al guardar.';
      }
    } catch (e) {
      errorDiv.textContent = 'Error de conexión.';
    }
  };
  document.getElementById('cancel-order-btn').onclick = function() {
    section.style.display = 'none';
  };
}

window.editOrder = async function(id) {
  const res = await fetch(`${API_URL}/items/pedidos/${id}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await res.json();
  showOrderForm(data.data);
};

window.deleteOrder = async function(id) {
  if (!confirm('¿Borrar este pedido?')) return;
  await fetch(`${API_URL}/items/pedidos/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  loadOrders();
};

// --- Líneas de pedido ---
window.viewOrderLines = async function(orderId) {
  const section = document.getElementById('order-form-section');
  section.style.display = 'block';
  section.innerHTML = `<h3>Líneas de Pedido #${orderId}</h3>
    <button id=\"add-line-btn\">Añadir línea</button>
    <div id=\"lines-list\"></div>
    <button id=\"close-lines-btn\">Cerrar</button>`;
  document.getElementById('close-lines-btn').onclick = function() {
    section.style.display = 'none';
  };
  document.getElementById('add-line-btn').onclick = function() {
    showLineForm(orderId);
  };
  loadOrderLines(orderId);
};

async function loadOrderLines(orderId) {
  const res = await fetch(`${API_URL}/items/lineas_pedido?filter[pedido_id][_eq]=${orderId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await res.json();
  const list = document.getElementById('lines-list');
  list.innerHTML = '';
  if (data.data && data.data.length) {
    const table = document.createElement('table');
    table.className = 'lineas-table';
    table.innerHTML = `<tr><th>ID</th><th>Producto</th><th>Cantidad</th><th>Precio Unitario</th><th>Acciones</th></tr>`;
    data.data.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${l.id}</td><td>${l.producto||''}</td><td>${l.cantidad||''}</td><td>${l.precio_unitario||''}</td><td><button onclick=\"editLine(${l.id},${orderId})\">Editar</button><button onclick=\"deleteLine(${l.id},${orderId})\">Borrar</button></td>`;
      table.appendChild(tr);
    });
    list.appendChild(table);
  } else {
    list.textContent = 'No hay líneas de pedido.';
  }
}

function showLineForm(orderId, line) {
  const list = document.getElementById('lines-list');
  const form = document.createElement('div');
  form.innerHTML = `<h4>${line ? 'Editar' : 'Nueva'} Línea</h4>
    <input id=\"line-producto\" placeholder=\"Producto\" value=\"${line?.producto||''}\">
    <input id=\"line-cantidad\" type=\"number\" placeholder=\"Cantidad\" value=\"${line?.cantidad||''}\">
    <input id=\"line-precio\" type=\"number\" placeholder=\"Precio Unitario\" value=\"${line?.precio_unitario||''}\">
    <button id=\"save-line-btn\">Guardar</button>
    <button id=\"cancel-line-btn\">Cancelar</button>
    <div id=\"line-form-error\" class=\"error\"></div>`;
  list.prepend(form);
  document.getElementById('save-line-btn').onclick = async function() {
    const producto = document.getElementById('line-producto').value;
    const cantidad = parseInt(document.getElementById('line-cantidad').value);
    const precio_unitario = parseFloat(document.getElementById('line-precio').value);
    const errorDiv = document.getElementById('line-form-error');
    errorDiv.textContent = '';
    try {
      let res;
      if (line) {
        res = await fetch(`${API_URL}/items/lineas_pedido/${line.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ producto, cantidad, precio_unitario })
        });
      } else {
        res = await fetch(`${API_URL}/items/lineas_pedido`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
          body: JSON.stringify({ pedido_id: orderId, producto, cantidad, precio_unitario })
        });
      }
      if (res.ok) {
        loadOrderLines(orderId);
      } else {
        errorDiv.textContent = 'Error al guardar.';
      }
    } catch (e) {
      errorDiv.textContent = 'Error de conexión.';
    }
  };
  document.getElementById('cancel-line-btn').onclick = function() {
    form.remove();
  };
}

window.editLine = async function(lineId, orderId) {
  const res = await fetch(`${API_URL}/items/lineas_pedido/${lineId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  const data = await res.json();
  showLineForm(orderId, data.data);
};

window.deleteLine = async function(lineId, orderId) {
  if (!confirm('¿Borrar esta línea?')) return;
  await fetch(`${API_URL}/items/lineas_pedido/${lineId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  loadOrderLines(orderId);
};
