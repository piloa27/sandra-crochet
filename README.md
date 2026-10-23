# Sandra Crochet

Sitio estático, responsive y listo para GitHub Pages, con catálogo y administración conectados a Supabase. No requiere compilación ni guarda productos en el navegador.

## Archivos importantes

- `index.html`: página única.
- `css/styles.css`: diseño y adaptación móvil.
- `js/app.js`: catálogo e interfaz pública.
- `js/admin.js`: autenticación, publicación y eliminación.
- `js/supabase.js`: los tres valores públicos que debés configurar.
- `supabase/setup.sql`: tabla, bucket y políticas RLS.

## 1. Ejecutar localmente

Los módulos JavaScript no deben abrirse con doble clic. Desde esta carpeta ejecutá uno de estos servidores:

```powershell
python -m http.server 8000
```

Luego abrí `http://localhost:8000`. También podés usar la extensión Live Server de VS Code.

## 2. Crear el proyecto de Supabase

1. Ingresá a https://supabase.com/dashboard y elegí **Start your project**. Creá una cuenta o iniciá sesión.
2. Hacé clic en **New project** (si te pide una organización, creá una primero).
3. Elegí la organización, escribí `Sandra Crochet` como nombre, generá y guardá una contraseña segura para la base de datos, elegí una región cercana y hacé clic en **Create new project**.
4. Esperá hasta que el proyecto indique que está listo.

## 3. Elegir el correo administrador

Supabase Auth inicia sesión con email. Sandra verá el usuario corto `sandra`, pero internamente la web usará el correo que elijas. Puede ser un correo real de Sandra. Anotalo exactamente; en estas instrucciones lo llamamos `EMAIL_DE_SANDRA`.

## 4. Ejecutar el SQL

1. Abrí `supabase/setup.sql` en un editor.
2. Reemplazá **las cuatro apariciones indicadas por el comentario del archivo** de `REEMPLAZAR_CON_EMAIL_DE_SANDRA` por `EMAIL_DE_SANDRA`. No cambies el resto del SQL.
3. En el menú izquierdo de Supabase, hacé clic en **SQL Editor**.
4. Hacé clic en **New query**, pegá todo el archivo modificado y elegí **Run**.
5. Debería aparecer `Success. No rows returned`. Esto crea `productos`, activa RLS, limita escritura/borrado al email de Sandra y crea el bucket público `productos` con límite de 8 MB.

Para verificar: entrá en **Table Editor** y comprobá que aparezca `productos`; luego entrá en **Storage** y comprobá que aparezca el bucket `productos` marcado como público.

## 5. Crear la usuaria administradora

1. En Supabase, abrí **Authentication** → **Users**.
2. Hacé clic en **Add user** → **Create new user**.
3. En **Email**, escribí exactamente `EMAIL_DE_SANDRA`.
4. En **Password**, escribí la contraseña inicial entregada para Sandra.
5. Activá **Auto Confirm User** (o **Email confirmed**) para poder iniciar sesión sin confirmar un correo.
6. Hacé clic en **Create user**.

No habilites registro público. En **Authentication** → **Providers** → **Email**, mantené Email habilitado pero desactivá **Allow new users to sign up** si esa opción aparece en tu panel. La protección real también está en RLS: aunque existiera otra cuenta, su email no coincide y no puede insertar ni borrar.

## 6. Obtener URL y clave pública

1. En el proyecto, hacé clic en **Project Settings** (engranaje) → **Data API** o **API**.
2. Copiá **Project URL**.
3. Copiá la clave **Publishable key**. En proyectos con interfaz anterior puede llamarse `anon public`.
4. Nunca copies `service_role` ni una secret key al proyecto web.

Abrí `js/supabase.js` y reemplazá:

```js
url: 'REEMPLAZAR_CON_URL_DE_SUPABASE',
publicKey: 'REEMPLAZAR_CON_CLAVE_PUBLICA_DE_SUPABASE',
adminEmail: 'REEMPLAZAR_CON_EMAIL_DE_SANDRA'
```

El correo debe coincidir exactamente con el usuario creado y con `supabase/setup.sql`. La URL y la clave pública sí están diseñadas para ser visibles en un frontend; RLS mantiene segura la información.

## 7. Probar la conexión y primera publicación

1. Iniciá el servidor local y abrí `http://localhost:8000`.
2. Si el catálogo muestra el mensaje de tienda sin configurar, revisá `js/supabase.js`. Si muestra “Pronto vas a encontrar nuevas creaciones”, la lectura funciona.
3. Agregá `#admin` a la URL: `http://localhost:8000/#admin`. Alternativamente, hacé cinco clics seguidos sobre “Sandra Crochet” en el pie.
4. Ingresá usuario `sandra` y la contraseña inicial.
5. Si querés, escribí un título; elegí una imagen JPG/PNG/WebP y pulsá **Publicar producto**. La fotografía es obligatoria y el título es opcional.
6. Cerrá el panel y verificá que la tarjeta aparezca. Abrí la web en una ventana privada para confirmar que también es visible sin iniciar sesión.
7. Volvé al panel y probá **Eliminar**. Tras confirmar, se elimina tanto la fila como la fotografía.

Si aparece un error, revisá **Logs** en Supabase y la consola del navegador (F12 → Console). Los problemas más comunes son: email distinto entre los tres lugares, clave equivocada, usuario sin confirmar o SQL sin ejecutar.

## 8. Publicar en GitHub Pages

1. Creá un repositorio nuevo en GitHub, por ejemplo `sandra-crochet`. No agregues README desde GitHub si ya existe este proyecto.
2. En una terminal dentro de esta carpeta ejecutá:

```powershell
git init
git add .
git commit -m "Sitio inicial de Sandra Crochet"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/sandra-crochet.git
git push -u origin main
```

3. En GitHub abrí el repositorio → **Settings** → **Pages**.
4. En **Build and deployment**, elegí **Deploy from a branch**.
5. Elegí la rama `main`, carpeta `/(root)` y hacé clic en **Save**.
6. Esperá unos minutos. GitHub mostrará la URL pública en esa misma pantalla.
7. Abrí la URL, verificá el catálogo, `#admin`, una publicación de prueba y WhatsApp.

Las rutas son relativas, por lo que funcionan aunque GitHub Pages publique el sitio bajo `/sandra-crochet/`. Los productos se actualizan directamente en Supabase: publicar o eliminar no requiere un nuevo commit.

## Seguridad y mantenimiento

- Cambiá la contraseña inicial después de verificar el acceso: Supabase → **Authentication** → **Users** → usuario de Sandra → opciones de contraseña.
- No subas contraseñas, claves secretas ni `service_role` a GitHub.
- La clave pública y URL no son secretos; la seguridad depende de Auth y las políticas RLS incluidas.
- El acceso oculto es solo estético. Las políticas comparan explícitamente el email autenticado.
- El frontend comprime imágenes a WebP y 1600 px antes de subirlas; Storage también rechaza archivos mayores a 8 MB o tipos no admitidos.
