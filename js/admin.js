import { supabaseClient, isConfigured, SUPABASE_CONFIG } from './supabase.js';

let refreshProducts = async () => {};
let previewUrl = null;
const panel = document.querySelector('#admin-panel');
const loginForm = document.querySelector('#login-form');
const dashboard = document.querySelector('#admin-dashboard');
const productForm = document.querySelector('#product-form');
const message = document.querySelector('#admin-message');
const list = document.querySelector('#admin-product-list');
const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

function showMessage(text, isError = false) { message.textContent = text; message.classList.remove('hidden'); message.classList.toggle('error', isError); }
function clearMessage() { message.classList.add('hidden'); message.textContent = ''; }
function setBusy(button, busy, busyText) { if (!button.dataset.label) button.dataset.label = button.textContent; button.disabled = busy; button.textContent = busy ? busyText : button.dataset.label; }
function openPanel() { panel.classList.remove('hidden'); document.body.classList.add('no-scroll'); clearMessage(); panel.querySelector('input:not([type=file])')?.focus(); }
function closePanel() { panel.classList.add('hidden'); document.body.classList.remove('no-scroll'); if (location.hash === '#admin') history.replaceState(null, '', location.pathname + location.search); }

async function updateAuthUI() {
  if (!supabaseClient) { loginForm.classList.remove('hidden'); dashboard.classList.add('hidden'); showMessage('Primero completá la configuración pública de Supabase en js/supabase.js.', true); return; }
  const { data: { session } } = await supabaseClient.auth.getSession();
  const isAdmin = session?.user?.email?.toLowerCase() === SUPABASE_CONFIG.adminEmail.toLowerCase();
  loginForm.classList.toggle('hidden', Boolean(isAdmin)); dashboard.classList.toggle('hidden', !isAdmin);
  if (session && !isAdmin) { await supabaseClient.auth.signOut(); showMessage('Esta cuenta no tiene permisos de administración.', true); }
}

async function compressImage(file) {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Elegí una imagen JPG, PNG o WebP.');
  if (file.size > 8 * 1024 * 1024) throw new Error('La imagen supera el máximo de 8 MB.');
  const bitmap = await createImageBitmap(file); const maxSide = 1600; const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', .82));
  if (!blob) throw new Error('No se pudo preparar la fotografía.'); return blob;
}

function resetPreview() { if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl = null; productForm.elements.image.value = ''; document.querySelector('#image-preview-wrap').classList.add('hidden'); document.querySelector('#image-preview').removeAttribute('src'); }

export function renderAdminProducts(products = []) {
  if (!list) return;
  list.innerHTML = products.length ? products.map((product) => { const title = product.titulo?.trim() || 'Sin título'; return `<div class="admin-product-row"><img src="${escapeHtml(product.imagen_url)}" alt=""><strong>${escapeHtml(title)}</strong><button class="delete-button" type="button" data-delete-id="${escapeHtml(product.id)}" data-delete-path="${escapeHtml(product.imagen_path || '')}" data-delete-title="${escapeHtml(title)}">Eliminar</button></div>`; }).join('') : '<p>Todavía no hay productos publicados.</p>';
}

export function initAdmin({ onProductsChanged }) {
  refreshProducts = onProductsChanged;
  let clicks = 0, clickTimer;
  document.querySelector('#secret-admin-trigger').addEventListener('click', () => { clicks += 1; clearTimeout(clickTimer); if (clicks >= 5) { clicks = 0; openPanel(); updateAuthUI(); } else clickTimer = setTimeout(() => { clicks = 0; }, 1800); });
  document.querySelector('#admin-access').addEventListener('click', () => { openPanel(); updateAuthUI(); });
  document.querySelector('#close-admin').addEventListener('click', closePanel);
  if (location.hash === '#admin') { openPanel(); updateAuthUI(); }
  window.addEventListener('hashchange', () => { if (location.hash === '#admin') { openPanel(); updateAuthUI(); } });
  if (supabaseClient) supabaseClient.auth.onAuthStateChange(() => updateAuthUI());
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault(); clearMessage(); const button = loginForm.querySelector('button[type=submit]');
  if (!isConfigured()) return showMessage('Falta completar js/supabase.js.', true);
  if (loginForm.elements.username.value.trim().toLowerCase() !== 'sandra') return showMessage('Usuario o contraseña incorrectos.', true);
  setBusy(button, true, 'Ingresando…');
  const { error } = await supabaseClient.auth.signInWithPassword({ email: SUPABASE_CONFIG.adminEmail, password: loginForm.elements.password.value });
  setBusy(button, false); loginForm.elements.password.value = '';
  if (error) showMessage('Usuario o contraseña incorrectos.', true); else { clearMessage(); await updateAuthUI(); await refreshProducts(); }
});

document.querySelector('#logout-button').addEventListener('click', async () => { await supabaseClient?.auth.signOut(); showMessage('Sesión cerrada correctamente.'); await updateAuthUI(); });
productForm.elements.image.addEventListener('change', () => { const file = productForm.elements.image.files[0]; resetPreview(); if (!file) return; productForm.elements.image.files = new DataTransfer().files; const transfer = new DataTransfer(); transfer.items.add(file); productForm.elements.image.files = transfer.files; previewUrl = URL.createObjectURL(file); document.querySelector('#image-preview').src = previewUrl; document.querySelector('#image-preview-wrap').classList.remove('hidden'); });
document.querySelector('#remove-preview').addEventListener('click', resetPreview);

productForm.addEventListener('submit', async (event) => {
  event.preventDefault(); clearMessage(); const title = productForm.elements.title.value.trim(); const file = productForm.elements.image.files[0]; const button = document.querySelector('#publish-button');
  if (!file) return showMessage('Elegí una fotografía para publicar.', true);
  setBusy(button, true, 'Publicando…'); let path = null;
  try {
    const blob = await compressImage(file); path = `${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabaseClient.storage.from('productos').upload(path, blob, { contentType: 'image/webp', upsert: false }); if (uploadError) throw uploadError;
    const { data: publicData } = supabaseClient.storage.from('productos').getPublicUrl(path);
    const { error: insertError } = await supabaseClient.from('productos').insert({ titulo: title || null, imagen_url: publicData.publicUrl, imagen_path: path }); if (insertError) throw insertError;
    productForm.reset(); resetPreview(); showMessage('¡Producto publicado correctamente!'); await refreshProducts();
  } catch (error) { console.error(error); if (path) await supabaseClient.storage.from('productos').remove([path]); showMessage(`No se pudo publicar: ${error.message || 'intentá nuevamente.'}`, true); }
  finally { setBusy(button, false); }
});

list.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-delete-id]'); if (!button || !confirm(`¿Eliminar “${button.dataset.deleteTitle}”? Esta acción no se puede deshacer.`)) return;
  setBusy(button, true, 'Eliminando…'); clearMessage();
  try {
    const { error } = await supabaseClient.from('productos').delete().eq('id', button.dataset.deleteId); if (error) throw error;
    if (button.dataset.deletePath) { const { error: storageError } = await supabaseClient.storage.from('productos').remove([button.dataset.deletePath]); if (storageError) throw storageError; }
    showMessage('Producto y fotografía eliminados.'); await refreshProducts();
  } catch (error) { console.error(error); showMessage(`No se pudo eliminar: ${error.message || 'intentá nuevamente.'}`, true); setBusy(button, false); }
});
