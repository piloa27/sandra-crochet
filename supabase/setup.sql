-- Sandra Crochet: tabla, bucket y políticas de seguridad.
-- ANTES DE EJECUTAR: reemplazá las cuatro apariciones de piloa27@gmail.com
-- por el mismo correo con el que crearás la usuaria en Authentication > Users.

create extension if not exists pgcrypto;

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  titulo text check (titulo is null or char_length(trim(titulo)) between 1 and 100),
  imagen_url text not null check (imagen_url ~ '^https://'),
  imagen_path text not null,
  created_at timestamptz not null default now()
);

-- También actualiza instalaciones existentes para permitir publicaciones sin título.
alter table public.productos alter column titulo drop not null;

alter table public.productos enable row level security;
revoke all on table public.productos from anon, authenticated;
grant select on table public.productos to anon, authenticated;
grant insert, delete on table public.productos to authenticated;

drop policy if exists "Productos visibles para todos" on public.productos;
create policy "Productos visibles para todos" on public.productos for select using (true);

drop policy if exists "Solo Sandra puede publicar" on public.productos;
create policy "Solo Sandra puede publicar" on public.productos for insert to authenticated
with check (lower(auth.jwt() ->> 'email') = lower('piloa27@gmail.com'));

drop policy if exists "Solo Sandra puede eliminar" on public.productos;
create policy "Solo Sandra puede eliminar" on public.productos for delete to authenticated
using (lower(auth.jwt() ->> 'email') = lower('piloa27@gmail.com'));

-- No se crea política UPDATE: nadie puede modificar productos desde la API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 8388608, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Fotos publicas de productos" on storage.objects;
create policy "Fotos publicas de productos" on storage.objects for select using (bucket_id = 'productos');

drop policy if exists "Solo Sandra puede subir fotos" on storage.objects;
create policy "Solo Sandra puede subir fotos" on storage.objects for insert to authenticated
with check (bucket_id = 'productos' and lower(auth.jwt() ->> 'email') = lower('piloa27@gmail.com'));

drop policy if exists "Solo Sandra puede eliminar fotos" on storage.objects;
create policy "Solo Sandra puede eliminar fotos" on storage.objects for delete to authenticated
using (bucket_id = 'productos' and lower(auth.jwt() ->> 'email') = lower('piloa27@gmail.com'));
