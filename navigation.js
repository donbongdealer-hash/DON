// ========== КАРТА СТРАНИЦ ==========
const pagesMap = {
  home: 'homePage',
  shop: 'shopPage',
  library: 'libraryPage',
  perc: 'percPage',
  hygiene: 'hygienePage',
  b2b: 'b2bPage',
  b2c: 'b2cPage',
  club: 'clubPage',
  blueprint: 'blueprintPage',
  about: 'aboutPage',
  contacts: 'contactsPage',
  shopPolicy: 'shopPolicyPage',
  favorites: 'favoritesPage',
  admin: 'adminPage'
};

function getPages() {
  const pages = {};
  for (const [key, id] of Object.entries(pagesMap)) {
    pages[key] = document.getElementById(id);
  }
  return pages;
}

window.showPage = function(pageId) {
  const pages = getPages();
  Object.values(pages).forEach(page => {
    if (page) {
      page.classList.remove('active', 'page-visible');
    }
  });
  const target = pages[pageId];
  if (target) {
    target.classList.add('active');
    setTimeout(() => target.classList.add('page-visible'), 20);
  }
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active-nav');
    if (btn.getAttribute('data-page') === pageId) {
      btn.classList.add('active-nav');
    }
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (pageId === 'shop' && typeof window.applyFilters === 'function') {
    window.applyFilters();
  }
  if (pageId === 'favorites' && typeof window.renderFavorites === 'function') {
    window.renderFavorites();
  }
};

const themes = ['dark', 'light', 'blue', 'gold'];
window.setTheme = function(theme) {
  if (!themes.includes(theme)) theme = 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('donbong_theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    if (btn.getAttribute('data-theme') === theme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
};

window.loadTheme = function() {
  const savedTheme = localStorage.getItem('donbong_theme');
  if (savedTheme && themes.includes(savedTheme)) {
    window.setTheme(savedTheme);
  } else {
    window.setTheme('dark');
  }
};

function initNavigation() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = el.getAttribute('data-page');
      if (pageId && pagesMap[pageId]) {
        window.showPage(pageId);
      }
    });
  });
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.getAttribute('data-theme');
      if (theme) window.setTheme(theme);
    });
  });
  const cartIconBtn = document.getElementById('cartIconBtn');
  if (cartIconBtn) {
    cartIconBtn.addEventListener('click', () => {
      if (typeof window.renderCartModal === 'function') window.renderCartModal();
      const cartModal = document.getElementById('cartModal');
      if (cartModal) cartModal.classList.add('open');
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.overlay.open').forEach(modal => {
        modal.classList.remove('open');
      });
      document.body.style.overflow = '';
    }
  });
  window.loadTheme();
  const activePage = document.querySelector('.page.active');
  if (!activePage) {
    window.showPage('home');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  initNavigation();
}