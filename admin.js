let isAdmin = false;

function checkAdminAccess() {
  const saved = localStorage.getItem('donbong_admin');
  if (saved === 'true') {
    isAdmin = true;
    const adminContent = document.getElementById('adminContent');
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminContent) adminContent.style.display = 'block';
    if (adminLoginForm) adminLoginForm.style.display = 'none';
    loadAdminData();
  } else {
    const adminContent = document.getElementById('adminContent');
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminContent) adminContent.style.display = 'none';
    if (adminLoginForm) adminLoginForm.style.display = 'block';
  }
}

window.adminLogin = (password) => {
  if (password === 'DonBong2025') {
    localStorage.setItem('donbong_admin', 'true');
    isAdmin = true;
    checkAdminAccess();
  } else {
    alert('Wrong password');
  }
};

window.adminLogout = () => {
  localStorage.removeItem('donbong_admin');
  isAdmin = false;
  checkAdminAccess();
};

async function loadAdminData() {
  const products = await window.fetchAPI('products');
  if (products && !products.error) renderAdminProducts(products);
  const orders = await window.fetchAPI('orders');
  if (orders && !orders.error) renderAdminOrders(orders);
  renderAdminReviews(window.reviews);
  loadAdminSettings();
}

function renderAdminProducts(products) {
  const container = document.getElementById('adminProducts');
  if (!container) return;
  container.innerHTML = `
    <h3>Products</h3>
    <table class="data-table">
      <thead><tr><th>ID</th><th>Name</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
      <tbody>
        ${products.map(p => `
          <tr>
            <td>${p.id}</td>
            <td><input type="text" value="${window.escapeHtml(p.name)}" data-id="${p.id}" class="admin-name"></td>
            <td><input type="number" value="${p.price}" data-id="${p.id}" class="admin-price"></td>
            <td><input type="checkbox" ${p.inStock ? 'checked' : ''} data-id="${p.id}" class="admin-stock"></td>
            <td><button class="admin-save" data-id="${p.id}">Save</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <button id="adminAddProduct">+ Add Product</button>
  `;
  document.querySelectorAll('.admin-save').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const name = document.querySelector(`.admin-name[data-id="${id}"]`).value;
      const price = parseFloat(document.querySelector(`.admin-price[data-id="${id}"]`).value);
      const inStock = document.querySelector(`.admin-stock[data-id="${id}"]`).checked;
      await window.fetchAPI(null, { type: 'update_product', id, name, price, inStock });
      window.showToast('Product updated');
      loadAdminData();
    });
  });
  document.getElementById('adminAddProduct')?.addEventListener('click', async () => {
    await window.fetchAPI(null, { type: 'add_product', name: 'New Product', price: 0, inStock: true });
    loadAdminData();
  });
}

function renderAdminOrders(orders) {
  const container = document.getElementById('adminOrders');
  if (!container) return;
  container.innerHTML = `
    <h3>Orders</h3>
    <table class="data-table">
      <thead><tr><th>ID</th><th>Name</th><th>Contact</th><th>Address</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        ${orders.map(o => `
          <tr>
            <td>${o.orderId}</td>
            <td>${window.escapeHtml(o.name)}</td>
            <td>${window.escapeHtml(o.social)}</td>
            <td>${window.escapeHtml(o.address)}</td>
            <td>${window.formatPrice(o.total)}</td>
            <td><select data-id="${o.orderId}" class="admin-order-status"><option ${o.status === 'new' ? 'selected' : ''}>new</option><option ${o.status === 'processed' ? 'selected' : ''}>processed</option><option ${o.status === 'shipped' ? 'selected' : ''}>shipped</option><option ${o.status === 'delivered' ? 'selected' : ''}>delivered</option></select></td>
            <td><button class="admin-update-order" data-id="${o.orderId}">Update</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  document.querySelectorAll('.admin-update-order').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const status = document.querySelector(`.admin-order-status[data-id="${id}"]`).value;
      await window.fetchAPI(null, { type: 'update_order', orderId: id, status });
      window.showToast('Order status updated');
      loadAdminData();
    });
  });
}

function renderAdminReviews(reviews) {
  const container = document.getElementById('adminReviews');
  if (!container) return;
  let all = [];
  for (const [productId, revs] of Object.entries(reviews)) {
    all.push(...revs.map(r => ({ productId, ...r })));
  }
  container.innerHTML = `
    <h3>Reviews</h3>
    <table class="data-table">
      <thead><tr><th>Product ID</th><th>Author</th><th>Rating</th><th>Text</th><th>Date</th><th>Actions</th></tr></thead>
      <tbody>
        ${all.map(r => `
          <tr>
            <td>${r.productId}</td>
            <td>${window.escapeHtml(r.name)}</td>
            <td>${r.rating}</td>
            <td>${window.escapeHtml(r.text)}</td>
            <td>${new Date(r.date).toLocaleDateString()}</td>
            <td><button class="admin-delete-review" data-product="${r.productId}" data-date="${r.date}">Delete</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  document.querySelectorAll('.admin-delete-review').forEach(btn => {
    btn.addEventListener('click', () => {
      const productId = btn.dataset.product;
      const date = btn.dataset.date;
      if (confirm('Delete this review?')) {
        window.reviews[productId] = window.reviews[productId].filter(r => r.date !== date);
        if (window.reviews[productId].length === 0) delete window.reviews[productId];
        window.saveReviews();
        window.showToast('Review deleted');
        loadAdminData();
      }
    });
  });
}

function loadAdminSettings() {
  const container = document.getElementById('adminSettings');
  if (!container) return;
  container.innerHTML = `
    <h3>Site Settings</h3>
    <div class="form-group"><label>API URL</label><input type="text" id="adminApiUrl" value="${window.API_URL}" class="fi"></div>
    <div class="form-group"><label>Telegram Bot Token</label><input type="text" id="adminTgToken" value="${window.TG_TOKEN}" class="fi"></div>
    <div class="form-group"><label>Telegram Chat ID</label><input type="text" id="adminTgChat" value="${window.TG_CHAT_ID}" class="fi"></div>
    <button id="adminSaveSettings" class="btn-primary">Save Settings</button>
  `;
  document.getElementById('adminSaveSettings')?.addEventListener('click', () => {
    window.API_URL = document.getElementById('adminApiUrl').value;
    window.TG_TOKEN = document.getElementById('adminTgToken').value;
    window.TG_CHAT_ID = document.getElementById('adminTgChat').value;
    localStorage.setItem('donbong_api_url', window.API_URL);
    localStorage.setItem('donbong_tg_token', window.TG_TOKEN);
    localStorage.setItem('donbong_tg_chat', window.TG_CHAT_ID);
    window.showToast('Settings saved. Reload to apply.');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAccess();
});