// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
window.API_URL = localStorage.getItem('donbong_api_url') || 'https://script.google.com/macros/s/.../exec';
window.TG_TOKEN = localStorage.getItem('donbong_tg_token') || '8542682261:AAFnxn_x0nWXEsEwBm7Vr6wGei07aa3eh2o';
window.TG_CHAT_ID = localStorage.getItem('donbong_tg_chat') || '7631753272';
window.exchangeRates = { VND: 1, USDT: 0.00004, RUB: 0.0039 };
window.currentCurrency = 'VND';
window.cart = JSON.parse(localStorage.getItem('donbong_cart') || '[]');
window.favorites = JSON.parse(localStorage.getItem('donbong_favs') || '[]');
window.reviews = JSON.parse(localStorage.getItem('donbong_reviews') || '{}');
window.PER_PAGE = 12;
window.SHOW_OUT_OF_STOCK = true;
window.DEFAULT_SORT = 'name';

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
window.escapeHtml = (str) => {
  if (!str) return '';
  return str.replace(/[&<>]/g, (m) => {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
};

window.formatPrice = (price) => {
  if (!price && price !== 0) return 'On Request';
  const converted = price * window.exchangeRates[window.currentCurrency];
  if (window.currentCurrency === 'VND') {
    return new Intl.NumberFormat('vi-VN').format(Math.round(converted)) + ' ₫';
  } else if (window.currentCurrency === 'USDT') {
    return '$ ' + converted.toFixed(2);
  } else {
    return new Intl.NumberFormat('ru-RU').format(Math.round(converted)) + ' ₽';
  }
};

window.setCurrency = (currency, btn) => {
  window.currentCurrency = currency;
  document.querySelectorAll('.cur-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (typeof window.applyFilters === 'function') window.applyFilters();
  if (document.getElementById('cartModal').classList.contains('open')) window.renderCartModal();
};

window.showToast = (msg, type = 'success') => {
  const container = document.getElementById('toasts');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="ti">${type === 'success' ? '✓' : '✕'}</span><span>${window.escapeHtml(msg)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
};

window.fetchExchangeRates = async () => {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/VND');
    const data = await res.json();
    if (data.rates) {
      window.exchangeRates.USDT = data.rates.USD || 0.00004;
      window.exchangeRates.RUB = data.rates.RUB || 0.0039;
    }
  } catch(e) { console.warn('Exchange rates fallback'); }
};

window.saveCart = () => { localStorage.setItem('donbong_cart', JSON.stringify(window.cart)); };
window.saveFavorites = () => { localStorage.setItem('donbong_favs', JSON.stringify(window.favorites)); };
window.saveReviews = () => { localStorage.setItem('donbong_reviews', JSON.stringify(window.reviews)); };

window.updateBadges = () => {
  const cartTotal = window.cart.reduce((sum, i) => sum + i.qty, 0);
  const cartBadge = document.getElementById('cartBadge');
  if (cartBadge) {
    cartBadge.textContent = cartTotal;
    cartBadge.style.display = cartTotal > 0 ? 'flex' : 'none';
  }
  const favCount = document.getElementById('favCount');
  if (favCount) favCount.textContent = window.favorites.length;
};

window.addToCart = (product, qty = 1) => {
  const existing = window.cart.find(i => i.id === product.id);
  if (existing) existing.qty += qty;
  else window.cart.push({ ...product, qty });
  window.saveCart();
  window.updateBadges();
  window.showToast(`${product.name} added to cart`);
};

window.removeFromCart = (id) => {
  window.cart = window.cart.filter(i => i.id !== id);
  window.saveCart();
  window.updateBadges();
  if (typeof window.renderCartModal === 'function') window.renderCartModal();
};

window.changeQty = (id, delta) => {
  const item = window.cart.find(i => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) window.removeFromCart(id);
    else {
      window.saveCart();
      window.updateBadges();
      if (typeof window.renderCartModal === 'function') window.renderCartModal();
    }
  }
};

window.toggleFavorite = (id) => {
  const idx = window.favorites.indexOf(id);
  if (idx > -1) window.favorites.splice(idx, 1);
  else window.favorites.push(id);
  window.saveFavorites();
  window.updateBadges();
  document.querySelectorAll(`.fav-btn[data-id="${id}"]`).forEach(btn => {
    btn.innerHTML = window.favorites.includes(id) ? '❤️' : '🤍';
    btn.style.borderColor = window.favorites.includes(id) ? 'var(--accent)' : 'var(--border-light)';
  });
  if (document.getElementById('favoritesPage')?.classList.contains('active')) {
    if (typeof window.renderFavorites === 'function') window.renderFavorites();
  }
};

window.getProductRating = (id) => {
  const revs = window.reviews[id] || [];
  if (!revs.length) return 0;
  const sum = revs.reduce((s, r) => s + r.rating, 0);
  return sum / revs.length;
};
window.getReviewCount = (id) => (window.reviews[id] || []).length;
window.getStarsHtml = (rating) => {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => `<span class="${i < full ? 'star-lit' : 'star-dim'}">★</span>`).join('');
};

window.addReview = async (productId, name, rating, text) => {
  if (!window.reviews[productId]) window.reviews[productId] = [];
  window.reviews[productId].push({ name, rating, text, date: new Date().toISOString() });
  window.saveReviews();
  try {
    await fetch(window.API_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({ type: 'review', productId, reviewerName: name, rating, reviewText: text })
    });
  } catch(e) {}
  window.showToast('Thank you for your review! 🌟');
};

window.fetchAPI = async (action, data = null) => {
  try {
    const url = action ? `${window.API_URL}?action=${action}` : window.API_URL;
    const options = { method: 'GET' };
    if (data) {
      options.method = 'POST';
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(data);
    }
    const res = await fetch(url, options);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch(e) {
    console.error('API fetch error:', e);
    return null;
  }
};

window.sendOrderTelegram = async (orderData) => {
  const { name, social, address, items, total, currency, orderId } = orderData;
  const itemsText = items.map(i => `• ${i.name} (×${i.qty}) — ${window.formatPrice(i.price * i.qty)}`).join('\n');
  const message = `🛍 *New Order ${orderId}*\n\n👤 *Name:* ${name}\n📱 *Contact:* ${social}\n📍 *Address:* ${address}\n\n📦 *Items:*\n${itemsText}\n\n💰 *Total (${currency}):* ${window.formatPrice(total)}`;
  try {
    await fetch(`https://api.telegram.org/bot${window.TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: window.TG_CHAT_ID, text: message, parse_mode: 'Markdown' })
    });
    return true;
  } catch(e) { return false; }
};

window.closeModal = () => {
  document.querySelectorAll('.overlay').forEach(m => m.classList.remove('open'));
  document.body.style.overflow = '';
};

window.bgClose = (e, id) => { if (e.target.id === id) window.closeModal(); };

// ========== ЗАГРУЗКА НАСТРОЕК ИЗ ТАБЛИЦЫ ==========
window.loadSettings = async () => {
  try {
    const settings = await window.fetchAPI('settings');
    if (settings && !settings.error) {
      if (settings.perPage) window.PER_PAGE = parseInt(settings.perPage);
      if (settings.accentColor) document.documentElement.style.setProperty('--accent', settings.accentColor);
      if (settings.heroTitle) document.getElementById('heroTitle')?.innerHTML = settings.heroTitle;
      if (settings.heroSubtitle) document.getElementById('heroSub')?.innerHTML = settings.heroSubtitle;
      if (settings.siteTitle) document.title = settings.siteTitle;
      if (settings.tgBotToken) window.TG_TOKEN = settings.tgBotToken;
      if (settings.tgChatId) window.TG_CHAT_ID = settings.tgChatId;
      if (settings.showOutOfStock === 'True' || settings.showOutOfStock === true) window.SHOW_OUT_OF_STOCK = true;
      else window.SHOW_OUT_OF_STOCK = false;
      if (settings.defaultSort) window.DEFAULT_SORT = settings.defaultSort;
    }
  } catch(e) { console.warn('Failed to load settings', e); }
};

document.addEventListener('DOMContentLoaded', () => {
  window.fetchExchangeRates();
  window.updateBadges();
  if (window.API_URL) window.loadSettings();
});