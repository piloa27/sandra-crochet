// Configuración pública de Supabase. Completá estos tres valores siguiendo el README.
// La clave pública (publishable/anon) puede estar en el navegador. Nunca uses service_role aquí.
export const SUPABASE_CONFIG = Object.freeze({
  url: 'https://mbrfgrnaaxfcuhlklaop.supabase.co',
  publicKey: 'sb_publishable_sLGswVdvVpoNeGJomGRBVw_alu7AFhi',
  adminEmail: 'piloa27@gmail.com'
});

export const isConfigured = () =>
  SUPABASE_CONFIG.url.startsWith('https://') &&
  !SUPABASE_CONFIG.url.includes('REEMPLAZAR') &&
  !SUPABASE_CONFIG.publicKey.includes('REEMPLAZAR') &&
  SUPABASE_CONFIG.adminEmail.includes('@') &&
  !SUPABASE_CONFIG.adminEmail.includes('REEMPLAZAR');

export const supabaseClient = isConfigured()
  ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publicKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;
