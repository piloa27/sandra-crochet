import { supabaseClient, isConfigured } from './supabase.js';
import { initAdmin, renderAdminProducts } from './admin.js';

const WHATSAPP_NUMBER = '59894333518';
const PAGE_SIZE = 6;
const state = { products: [], visible: PAGE_SIZE };
const grid = document.querySelector('#product-grid');
const status = document.querySelector('#catalog-status');
const loadMore = document.querySelector('#load-more');

const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

function productCard(product) {
  const rawTitle = product.titulo?.trim() || '';
  const title = escapeHtml(rawTitle);
  const accessibleTitle = title || 'creación artesanal';
  const titleMarkup = title ? `<h3>${title}</h3>` : '';
  const message = encodeURIComponent(rawTitle ? `Hola Sandra, quisiera consultar por: ${rawTitle}` : 'Hola Sandra, quisiera consultar por esta creación artesanal.');
  return `<article class="product-card">
    <button class="product-image-button" type="button" data-image="${escapeHtml(product.imagen_url)}" data-title="${accessibleTitle}" aria-label="Ampliar foto de ${accessibleTitle}">
      <img src="${escapeHtml(product.imagen_url)}" alt="${accessibleTitle}, tejido artesanal" loading="lazy" width="600" height="600">
    </button>
    <div class="product-body">${titleMarkup}<a class="btn btn-primary" href="https://wa.me/${WHATSAPP_NUMBER}?text=${message}" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp</a></div>
  </article>`;
}

export function renderProducts(products = state.products) {
  state.products = products;
  const shown = products.slice(0, state.visible);
  status.classList.add('hidden');
  if (!products.length) {
    grid.innerHTML = '<div class="status-box"><span>♡</span><span>Pronto vas a encontrar nuevas creaciones. Si querés, podés consultar directamente con Sandra.</span></div>';
    loadMore.classList.add('hidden');
  } else {
    grid.innerHTML = shown.map(productCard).join('');
    loadMore.classList.toggle('hidden', shown.length >= products.length);
  }
  renderAdminProducts(products);
}

export async function loadProducts() {
  if (!isConfigured()) {
    status.classList.remove('hidden');
    status.classList.add('error');
    status.innerHTML = '<span>La tienda está casi pronta. Falta conectar Supabase para mostrar las creaciones.</span>';
    return;
  }
  status.className = 'status-box';
  status.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Cargando creaciones…</span>';
  try {
    const { data, error } = await supabaseClient.from('productos').select('id,titulo,imagen_url,imagen_path,created_at').order('created_at', { ascending: false });
    if (error) throw error;
    renderProducts(data || []);
  } catch (error) {
    console.error(error);
    status.classList.add('error');
    status.innerHTML = '<span>No pudimos cargar los productos. Revisá tu conexión e intentá nuevamente.</span>';
  }
}

loadMore.addEventListener('click', () => { state.visible += PAGE_SIZE; renderProducts(); });
grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-image]'); if (!button) return;
  const modal = document.querySelector('#image-modal');
  document.querySelector('#modal-image').src = button.dataset.image;
  document.querySelector('#modal-image').alt = button.dataset.title;
  document.querySelector('#modal-caption').textContent = button.dataset.title;
  modal.showModal();
});
document.querySelector('#close-modal').addEventListener('click', () => document.querySelector('#image-modal').close());
document.querySelector('#image-modal').addEventListener('click', (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
document.querySelector('#current-year').textContent = new Date().getFullYear();

const navToggle = document.querySelector('.nav-toggle');
navToggle.addEventListener('click', () => { const nav = document.querySelector('.main-nav'); const open = nav.classList.toggle('open'); navToggle.setAttribute('aria-expanded', String(open)); });
document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => { document.querySelector('.main-nav').classList.remove('open'); navToggle.setAttribute('aria-expanded', 'false'); }));

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .13 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

initAdmin({ onProductsChanged: loadProducts });
loadProducts();
