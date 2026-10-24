import { supabaseClient, isConfigured, SUPABASE_CONFIG } from './supabase.js';
import { compressImage } from './image-processing.js';
import { createPhotoEditor } from './photo-editor.js';

let refreshProducts = async () => {};
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

const photoEditor = createPhotoEditor({
  form: productForm,
  onBusy: busy => { document.querySelector('#publish-button').disabled = busy; }
});

export function renderAdminProducts(products = []) {
  if (!list) return;
  list.innerHTML = products.length ? products.map((product) => { const title = product.titulo?.trim() || 'Sin título'; return `<div class="admin-product-row"><img src="${escapeHtml(product.imagen_url)}" alt="" loading="lazy" width="66" height="66"><strong>${escapeHtml(title)}</strong><button class="delete-button" type="button" data-delete-id="${escapeHtml(product.id)}" data-delete-path="${escapeHtml(product.imagen_path || '')}" data-delete-title="${escapeHtml(title)}">Eliminar</button></div>`; }).join('') : '<p>Todavía no hay productos publicados.</p>';
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

productForm.addEventListener('submit', async (event) => {
  event.preventDefault(); clearMessage(); const title = productForm.elements.title.value.trim(); const file = photoEditor.getSelectedFile(); const button = document.querySelector('#publish-button');
  if (button.disabled) return;
  if (!file) return showMessage('Elegí una fotografía para publicar.', true);
  setBusy(button, true, 'Publicando…'); photoEditor.setUploading(true); let path = null;
  try {
    const blob = await compressImage(file); path = `${crypto.randomUUID()}.${blob.type === 'image/png' ? 'png' : 'webp'}`;
    const { error: uploadError } = await supabaseClient.storage.from('productos').upload(path, blob, { contentType: blob.type, upsert: false }); if (uploadError) throw uploadError;
    const { data: publicData } = supabaseClient.storage.from('productos').getPublicUrl(path);
    const { error: insertError } = await supabaseClient.from('productos').insert({ titulo: title || null, imagen_url: publicData.publicUrl, imagen_path: path }); if (insertError) throw insertError;
    productForm.reset(); photoEditor.reset(); showMessage('¡Producto publicado correctamente!'); await refreshProducts();
  } catch (error) { console.error(error); if (path) await supabaseClient.storage.from('productos').remove([path]); showMessage(`No se pudo publicar: ${error.message || 'intentá nuevamente.'}`, true); }
  finally { photoEditor.setUploading(false); setBusy(button, false); }
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
