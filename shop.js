// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ МОДУЛЯ ==========
let allProducts = [];
let filteredProducts = [];
let currentCategory = '';
let currentBrand = '';
let currentSort = window.DEFAULT_SORT || 'name';
let currentPage = 1;
const PER_PAGE = window.PER_PAGE || 12;

const productsGrid = document.getElementById('productsGrid');
const paginationDiv = document.getElementById('pagination');
const productCountSpan = document.getElementById('productCount');
const categoryFilter = document.getElementById('categoryFilter');
const brandFilter = document.getElementById('brandFilter');
const sortSelect = document.getElementById('sortSelect');
const favsGrid = document.getElementById('favsGrid');

let currentProduct = null;
let currentImages = [];
let currentImageIndex = 0;

// ========== ЗАГРУЗКА ТОВАРОВ ИЗ API ==========
window.fetchProducts = async () => {
  try {
    const data = await window.fetchAPI('products');
    if (!data || data.error) throw new Error(data?.error || 'Failed to load');
    allProducts = data.map(p => ({
      id: String(p.id),
      name: p.name || 'Unnamed',
      category: p.category || 'accessories',
      brand: p.brand || '',
      price: parseFloat(p.price) || 0,
      oldPrice: parseFloat(p.oldPrice) || 0,
      description: p.description || '',
      image: p.imageUrl || 'https://placehold.co/300x300/1a1a1a/ffaa44?text=Glass',
      gallery: p.gallery ? (Array.isArray(p.gallery) ? p.gallery : p.gallery.split(',').map(s=>s.trim())) : [],
      inStock: p.inStock === true || p.inStock === 'TRUE' || p.inStock === 'True',
      stockQty: parseInt(p.stockQty) || 0,
      sku: p.sku || ''
    }));
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
    const brands = [...new Set(allProducts.map(p => p.brand).filter(Boolean))];
    if (categoryFilter) {
      categoryFilter.innerHTML = '<option value="">All Categories</option>' +
        categories.map(c => `<option value="${window.escapeHtml(c)}">${window.escapeHtml(c)}</option>`).join('');
    }
    if (brandFilter) {
      brandFilter.innerHTML = '<option value="">All Brands</option>' +
        brands.map(b => `<option value="${window.escapeHtml(b)}">${window.escapeHtml(b)}</option>`).join('');
    }
    window.applyFilters();
  } catch (err) {
    console.error(err);
    if (productsGrid) productsGrid.innerHTML = '<div class="state"><div class="state-icon">⚠️</div><div class="state-title">Failed to load products</div></div>';
  }
};

window.applyFilters = () => {
  if (!categoryFilter || !brandFilter || !sortSelect) return;
  currentCategory = categoryFilter.value;
  currentBrand = brandFilter.value;
  currentSort = sortSelect.value;
  let filtered = [...allProducts];
  if (currentCategory) filtered = filtered.filter(p => p.category === currentCategory);
  if (currentBrand) filtered = filtered.filter(p => p.brand === currentBrand);
  if (!window.SHOW_OUT_OF_STOCK) filtered = filtered.filter(p => p.inStock);
  if (currentSort === 'price-asc') filtered.sort((a,b) => a.price - b.price);
  else if (currentSort === 'price-desc') filtered.sort((a,b) => b.price - a.price);
  else filtered.sort((a,b) => a.name.localeCompare(b.name));
  filteredProducts = filtered;
  if (productCountSpan) productCountSpan.textContent = filteredProducts.length;
  currentPage = 1;
  window.renderProducts();
};

window.renderProducts = () => {
  if (!productsGrid) return;
  const start = (currentPage - 1) * PER_PAGE;
  const pageItems = filteredProducts.slice(start, start + PER_PAGE);
  if (!pageItems.length) {
    productsGrid.innerHTML = '<div class="state"><div class="state-icon">📦</div><div class="state-title">No products found</div><div class="section-sub">Try different filters</div></div>';
    if (paginationDiv) paginationDiv.innerHTML = '';
    return;
  }
  productsGrid.innerHTML = pageItems.map(p => {
    const isFav = window.favorites.includes(p.id);
    const rating = window.getProductRating(p.id);
    const ratingCount = window.getReviewCount(p.id);
    return `
      <div class="card" data-product-id="${p.id}">
        <button class="fav-btn" data-id="${p.id}" style="position:absolute; top:12px; right:12px; z-index:10; background:var(--surface); border:1px solid ${isFav ? 'var(--accent)' : 'var(--border-light)'}; border-radius:50%; width:36px; height:36px; cursor:pointer; display:flex; align-items:center; justify-content:center;">${isFav ? '❤️' : '🤍'}</button>
        <img src="${window.escapeHtml(p.image)}" class="card-img" loading="lazy" onerror="this.src='https://placehold.co/300x300/1a1a1a/ffaa44?text=Glass'">
        <div class="card-body">
          <div class="card-cat">${window.escapeHtml(p.category)}</div>
          <div class="card-title">${window.escapeHtml(p.name)}</div>
          <div class="stars">${window.getStarsHtml(rating)} <span style="font-size:12px; color:var(--text-secondary)">(${ratingCount})</span></div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:12px;">
            <div class="card-price">${window.formatPrice(p.price)}</div>
            <button class="card-add btn-ghost" data-product-id="${p.id}" style="padding:6px 16px;">+ Add</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
  window.renderPagination();
};

window.renderPagination = () => {
  if (!paginationDiv) return;
  const totalPages = Math.ceil(filteredProducts.length / PER_PAGE);
  if (totalPages <= 1) {
    paginationDiv.innerHTML = '';
    return;
  }
  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  paginationDiv.innerHTML = html;
  document.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      window.renderProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
};

window.openProductModal = async (productId) => {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  currentProduct = product;
  currentImages = product.gallery.length ? product.gallery : [product.image];
  currentImageIndex = 0;
  const rating = window.getProductRating(product.id);
  const ratingCount = window.getReviewCount(product.id);
  const isFav = window.favorites.includes(product.id);
  const crossSells = allProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 3);
  const modalContent = document.getElementById('modalContent');
  if (!modalContent) return;
  modalContent.innerHTML = `
    <div class="grid grid-2" style="gap: 40px;">
      <div>
        <img id="modalMainImg" src="${window.escapeHtml(currentImages[0])}" class="gallery-main" style="width:100%; border-radius:16px; aspect-ratio:1; object-fit:cover;">
        ${currentImages.length > 1 ? `
          <div class="gallery-thumbs" style="display:flex; gap:8px; margin-top:12px;">
            ${currentImages.map((img, idx) => `<img src="${window.escapeHtml(img)}" class="thumb ${idx===0?'active':''}" data-img="${window.escapeHtml(img)}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; cursor:pointer; border:2px solid ${idx===0?'var(--accent)':'transparent'};">`).join('')}
          </div>
        ` : ''}
      </div>
      <div>
        <div class="card-cat">${window.escapeHtml(product.category)}</div>
        <h2 style="font-family:var(--font-display); font-size:48px;">${window.escapeHtml(product.name)}</h2>
        <div class="stars" style="font-size:18px; margin:12px 0;">${window.getStarsHtml(rating)} <span style="font-size:14px; color:var(--text-secondary);">(${ratingCount} reviews)</span></div>
        <div class="card-price" style="font-size:36px; margin-bottom:24px;">${window.formatPrice(product.price)}</div>
        <p class="section-sub" style="margin-bottom:32px;">${window.escapeHtml(product.description || 'Premium quality glass device designed for the ultimate experience.')}</p>
        <button class="btn-primary add-to-cart-modal" style="width:100%; justify-content:center; padding:16px;">🛒 Add to Cart</button>
        ${crossSells.length ? `
          <div style="margin-top:32px; background:rgba(0,0,0,0.1); padding:16px; border-radius:16px;">
            <h3 style="font-size:16px; margin-bottom:12px;">Frequently Bought Together</h3>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${crossSells.map(c => `
                <div class="mini-card" data-product-id="${c.id}" style="display:flex; gap:12px; align-items:center; padding:12px; border:1px solid var(--border-light); border-radius:12px; cursor:pointer;">
                  <img src="${window.escapeHtml(c.image)}" style="width:50px; height:50px; object-fit:cover; border-radius:8px;">
                  <div><div style="font-weight:700;">${window.escapeHtml(c.name)}</div><div style="color:var(--accent);">${window.formatPrice(c.price)}</div></div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
    <hr class="divider" style="margin:40px 0;">
    <div class="grid grid-2" style="gap:40px;">
      <div>
        <h3>Customer Reviews</h3>
        <div id="reviewsList" style="max-height:400px; overflow-y:auto; margin-bottom:24px;">
          ${(window.reviews[product.id] || []).map(r => `
            <div class="review-item" style="padding:16px; border:1px solid var(--border-light); border-radius:12px; margin-bottom:12px;">
              <div style="display:flex; justify-content:space-between;"><strong>${window.escapeHtml(r.name)}</strong><span style="color:var(--text-secondary);">${new Date(r.date).toLocaleDateString()}</span></div>
              <div class="stars" style="margin:8px 0;">${window.getStarsHtml(r.rating)}</div>
              <div style="color:var(--text-secondary);">${window.escapeHtml(r.text)}</div>
            </div>
          `).join('') || '<p style="color:var(--text-tertiary);">No reviews yet. Be the first!</p>'}
        </div>
        <button class="btn-ghost" id="writeReviewBtn">✍️ Write a Review</button>
      </div>
      <div>
        <h3>Similar Products</h3>
        <div id="similarGrid">
          ${allProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 3).map(p => `
            <div class="similar-card" data-product-id="${p.id}" style="display:flex; gap:12px; align-items:center; padding:12px; border:1px solid var(--border-light); border-radius:12px; margin-bottom:12px; cursor:pointer;">
              <img src="${window.escapeHtml(p.image)}" style="width:50px; height:50px; object-fit:cover; border-radius:8px;">
              <div><div style="font-weight:700;">${window.escapeHtml(p.name)}</div><div style="color:var(--accent);">${window.formatPrice(p.price)}</div></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  // Обработчики (аналогично предыдущей версии)
  document.querySelectorAll('.gallery-thumbs .thumb').forEach(thumb => {
    thumb.addEventListener('click', (e) => {
      const imgSrc = thumb.getAttribute('data-img');
      document.getElementById('modalMainImg').src = imgSrc;
      document.querySelectorAll('.gallery-thumbs .thumb').forEach(t => t.style.borderColor = 'transparent');
      thumb.style.borderColor = 'var(--accent)';
    });
  });
  document.querySelector('.add-to-cart-modal')?.addEventListener('click', () => {
    window.addToCart(currentProduct);
    window.closeModal();
  });
  document.getElementById('writeReviewBtn')?.addEventListener('click', () => window.openReviewModal(currentProduct));
  document.querySelectorAll('.mini-card, .similar-card').forEach(card => {
    card.addEventListener('click', () => {
      const pid = card.getAttribute('data-product-id');
      window.openProductModal(pid);
    });
  });
  document.getElementById('productModal').classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.openReviewModal = (product) => {
  currentProduct = product;
  const modal = document.getElementById('reviewModal');
  if (!modal) return;
  const content = document.getElementById('reviewModalContent') || modal.querySelector('.modal');
  if (!content) return;
  content.innerHTML = `
    <div class="mheader"><h2>Write a Review</h2><button class="close-btn" onclick="window.closeModal()">✕</button></div>
    <div style="padding:24px;">
      <div class="form-group"><label>Your Name</label><input id="reviewName" type="text" class="fi" placeholder="Your name"></div>
      <div class="form-group"><label>Rating</label><div id="starPicker" style="display:flex; gap:8px; font-size:24px; cursor:pointer;">
        ${[1,2,3,4,5].map(r => `<span data-rating="${r}">☆</span>`).join('')}
      </div></div>
      <div class="form-group"><label>Your Review</label><textarea id="reviewText" rows="4" class="fi" placeholder="Share your experience..."></textarea></div>
      <button id="submitReviewBtn" class="btn-primary">Submit Review</button>
    </div>
  `;
  let selectedRating = 0;
  document.querySelectorAll('#starPicker span').forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.getAttribute('data-rating'));
      document.querySelectorAll('#starPicker span').forEach(s => s.textContent = '☆');
      for (let i=0; i<selectedRating; i++) {
        document.querySelectorAll('#starPicker span')[i].textContent = '★';
      }
    });
  });
  document.getElementById('submitReviewBtn')?.addEventListener('click', async () => {
    const name = document.getElementById('reviewName').value.trim();
    const text = document.getElementById('reviewText').value.trim();
    if (!name || !text || selectedRating === 0) {
      window.showToast('Please fill all fields and select a rating', 'error');
      return;
    }
    await window.addReview(currentProduct.id, name, selectedRating, text);
    window.closeModal();
    if (currentProduct) window.openProductModal(currentProduct.id);
  });
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.renderCartModal = () => {
  const cartItemsDiv = document.getElementById('cartItems');
  const cartTotalDiv = document.getElementById('cartTotal');
  if (!cartItemsDiv || !cartTotalDiv) return;
  if (!window.cart.length) {
    cartItemsDiv.innerHTML = '<p class="empty-state" style="text-align:center; padding:40px;">Cart is empty</p>';
    cartTotalDiv.innerHTML = '';
    return;
  }
  let total = 0;
  cartItemsDiv.innerHTML = window.cart.map(item => {
    total += item.price * item.qty;
    return `
      <div class="cart-item" data-id="${item.id}" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-light); padding:12px 0;">
        <div><strong>${window.escapeHtml(item.name)}</strong><br><span style="color:var(--accent);">${window.formatPrice(item.price)}</span></div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="cart-qty-minus" data-id="${item.id}" style="background:var(--surface); border:1px solid var(--border-light); border-radius:8px; width:28px; height:28px; cursor:pointer;">-</button>
          <span>${item.qty}</span>
          <button class="cart-qty-plus" data-id="${item.id}" style="background:var(--surface); border:1px solid var(--border-light); border-radius:8px; width:28px; height:28px; cursor:pointer;">+</button>
          <button class="cart-remove" data-id="${item.id}" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:18px;">🗑</button>
        </div>
      </div>
    `;
  }).join('');
  cartTotalDiv.innerHTML = `<div style="text-align:right; margin-top:16px; font-size:24px; font-family:var(--font-display);">Total: ${window.formatPrice(total)}</div>`;
  document.querySelectorAll('.cart-qty-minus').forEach(btn => btn.addEventListener('click', () => window.changeQty(btn.dataset.id, -1)));
  document.querySelectorAll('.cart-qty-plus').forEach(btn => btn.addEventListener('click', () => window.changeQty(btn.dataset.id, 1)));
  document.querySelectorAll('.cart-remove').forEach(btn => btn.addEventListener('click', () => window.removeFromCart(btn.dataset.id)));
};

window.renderFavorites = () => {
  if (!favsGrid) return;
  const favItems = allProducts.filter(p => window.favorites.includes(p.id));
  if (!favItems.length) {
    favsGrid.innerHTML = '<div class="state"><div class="state-icon">♡</div><div class="state-title">No favourites yet</div><div class="section-sub">Tap ♡ on any product to save it</div></div>';
    return;
  }
  favsGrid.innerHTML = favItems.map(p => {
    const rating = window.getProductRating(p.id);
    const ratingCount = window.getReviewCount(p.id);
    return `
      <div class="card" data-product-id="${p.id}">
        <button class="fav-btn" data-id="${p.id}" style="position:absolute; top:12px; right:12px; z-index:10; background:var(--surface); border:1px solid var(--accent); border-radius:50%; width:36px; height:36px; cursor:pointer; display:flex; align-items:center; justify-content:center;">❤️</button>
        <img src="${window.escapeHtml(p.image)}" class="card-img" loading="lazy" onerror="this.src='https://placehold.co/300x300/1a1a1a/ffaa44?text=Glass'">
        <div class="card-body">
          <div class="card-cat">${window.escapeHtml(p.category)}</div>
          <div class="card-title">${window.escapeHtml(p.name)}</div>
          <div class="stars">${window.getStarsHtml(rating)} <span style="font-size:12px; color:var(--text-secondary)">(${ratingCount})</span></div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:12px;">
            <div class="card-price">${window.formatPrice(p.price)}</div>
            <button class="card-add btn-ghost" data-product-id="${p.id}" style="padding:6px 16px;">+ Add</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

window.sendOrder = async () => {
  const name = document.getElementById('customerName')?.value.trim();
  const contact = document.getElementById('customerContact')?.value.trim();
  const address = document.getElementById('customerAddress')?.value.trim();
  if (!name || !contact || !address) {
    window.showToast('Please fill all delivery fields', 'error');
    return;
  }
  if (!window.cart.length) {
    window.showToast('Your cart is empty', 'error');
    return;
  }
  const total = window.cart.reduce((s,i) => s + i.price * i.qty, 0);
  const orderId = 'DB-' + Date.now();
  const orderData = { type: 'order', orderId, name, social: contact, address, total, items: window.cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, price: i.price })), paymentMethod: 'cash', discount: 0, notes: '' };
  const success = await window.sendOrderTelegram({ ...orderData, currency: window.currentCurrency });
  if (success) {
    window.showToast('Order sent! We will contact you soon.');
    window.cart = [];
    window.saveCart();
    window.updateBadges();
    window.closeModal();
    if (typeof window.renderCartModal === 'function') window.renderCartModal();
  } else {
    window.showToast('Error sending order, please try again', 'error');
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.fetchProducts();
    document.getElementById('checkoutBtn')?.addEventListener('click', window.sendOrder);
    document.querySelectorAll('#categoryFilter, #brandFilter, #sortSelect').forEach(el => {
      el?.addEventListener('change', window.applyFilters);
    });
    document.body.addEventListener('click', (e) => {
      const favBtn = e.target.closest('.fav-btn');
      if (favBtn) { e.preventDefault(); window.toggleFavorite(favBtn.dataset.id); return; }
      const addBtn = e.target.closest('.card-add');
      if (addBtn) { e.preventDefault(); const p = allProducts.find(p => p.id === addBtn.dataset.productId); if(p) window.addToCart(p); return; }
      const card = e.target.closest('.card[data-product-id]');
      if (card && !card.classList.contains('fav-btn') && !card.classList.contains('card-add')) {
        window.openProductModal(card.getAttribute('data-product-id'));
      }
    });
  });
} else {
  window.fetchProducts();
  document.getElementById('checkoutBtn')?.addEventListener('click', window.sendOrder);
  document.querySelectorAll('#categoryFilter, #brandFilter, #sortSelect').forEach(el => {
    el?.addEventListener('change', window.applyFilters);
  });
  document.body.addEventListener('click', (e) => {
    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) { e.preventDefault(); window.toggleFavorite(favBtn.dataset.id); return; }
    const addBtn = e.target.closest('.card-add');
    if (addBtn) { e.preventDefault(); const p = allProducts.find(p => p.id === addBtn.dataset.productId); if(p) window.addToCart(p); return; }
    const card = e.target.closest('.card[data-product-id]');
    if (card && !card.classList.contains('fav-btn') && !card.classList.contains('card-add')) {
      window.openProductModal(card.getAttribute('data-product-id'));
    }
  });
}