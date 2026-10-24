# Sandra Crochet

## Mejoras de SEO y fotografías (octubre de 2026)

Los cambios se preparan localmente. No se necesita cambiar Supabase, su estructura ni las políticas RLS. La configuración actual de `js/supabase.js` se conserva. El título de producto sigue siendo opcional.

### Publicar y comprobar el SEO

El HTML incluye título, descripción, canonical, idioma `es-UY`, Open Graph, Twitter Cards y JSON-LD `Organization` con los datos conocidos. La verificación de Search Console se conserva sin cambios. `assets/img/og-image.jpg` es una imagen JPG real de 1200 × 630 píxeles, creada con una fotografía de una prenda proporcionada para este proyecto. El contenido de presentación está directamente en el HTML; los productos siguen cargándose desde Supabase.

Una vez revisados y publicados manualmente los cambios en GitHub Pages:

1. Abrí `https://piloa27.github.io/sandra-crochet/assets/img/og-image.jpg` y comprobá que se vea.
2. Abrí el código fuente de la web y buscá `og:image`: debe apuntar a esa misma URL absoluta.
3. Compartí `https://piloa27.github.io/sandra-crochet/` en un chat de WhatsApp y esperá a que cargue la tarjeta antes de enviar. Para comprobar una versión reciente sin reutilizar el enlace anterior, podés probar una sola vez `https://piloa27.github.io/sandra-crochet/?preview=20261023`; la URL canonical sigue siendo la principal.
4. Las plataformas pueden conservar la tarjeta anterior en caché. No hay una herramienta oficial de WhatsApp que garantice borrarla inmediatamente. Para Facebook, podés usar https://developers.facebook.com/tools/debug/ y solicitar **Scrape Again**. Su resultado no garantiza la actualización inmediata de WhatsApp.
5. En Google Search Console, elegí la propiedad verificada de Sandra Crochet → **Sitemaps** → **Añadir un sitemap**. Ingresá `sitemap.xml` si el campo ya muestra `https://piloa27.github.io/sandra-crochet/`; de lo contrario ingresá la URL completa `https://piloa27.github.io/sandra-crochet/sitemap.xml`. Pulsá **Enviar**.
6. En **Inspección de URLs**, pegá la URL principal, usá **Probar URL publicada** y luego **Solicitar indexación**, si aparece disponible.

El sitemap contiene únicamente la página pública y no inventa fechas `lastmod`. No se crea `robots.txt`: bajo `/sandra-crochet/` no controla el rastreo del dominio. No hay bloqueos `noindex`. Estas mejoras ayudan al rastreo y a la presentación, pero la posición y la indexación las decide Google.

### Quitar el fondo de nuevas fotografías

1. Abrí el panel de administración e iniciá sesión como siempre.
2. Elegí una foto JPG, PNG o WebP de hasta 8 MB. La vista previa original aparece inmediatamente.
3. Opcionalmente pulsá **Quitar fondo**. La primera ejecución descarga un modelo de unos **42 MB**, además del motor de IA. Conviene usar Wi-Fi y mantener la pestaña abierta.
4. Esperá el resultado o pulsá **Cancelar procesamiento** para seguir con la original.
5. Compará **Original** y **Sin fondo**. Revisá hilos, bordes, huecos entre puntos y colores. La original sigue seleccionada hasta que elijas expresamente **Sin fondo**.
6. Elegí la versión que querés publicar, agregá un título si querés y pulsá **Publicar producto**.

Solo se sube a Supabase la versión elegida. El recorte es una imagen real con transparencia: se conserva al optimizar a WebP (o PNG cuando el navegador no soporta exportar WebP). Nunca se convierte a JPG. Se verifican el formato y el límite de 8 MB también después de procesar. Las versiones temporales permanecen en memoria y se liberan al cambiar o quitar la foto o al publicar; no se guardan en Storage.

**Motor y compatibilidad.** Se usa Transformers.js 3.8.1 con ISNet General INT8 (pesos cuantizados) en un Web Worker, vía WebAssembly de un solo hilo. Funciona desde un sitio estático HTTPS o localhost, sin backend, claves ni servicio de IA pago. JavaScript, WASM y el modelo llegan desde jsDelivr y Hugging Face; las fotos se procesan localmente. Solo se crea el worker al pulsar el botón: un visitante del catálogo no descarga el modelo. Ver referencias, licencias y revisión fijada en `THIRD_PARTY_NOTICES.md`.

**Limitaciones.** La IA puede confundir lana y tela similares, perder hilos finos, no vaciar todos los huecos o quitar una pieza secundaria. No se retocan colores ni se regeneran prendas: la máscara modifica únicamente la transparencia. El consumo de memoria del modelo es elevado; algunos teléfonos o navegadores antiguos pueden fallar o tardar demasiado. Se cancela después de cuatro minutos sin progreso de descarga o de inferencia; una descarga lenta puede seguir mientras avance. Siempre se conservan la original y el título. En ese caso, probá con una computadora y un navegador actualizado. Como alternativa gratuita sin dependencias adicionales, recortá la foto en GIMP, exportala como PNG transparente y subila normalmente. Una tela lisa contrastante y buena luz mejoran la selección automática.

Todas las tarjetas usan proporción cuadrada, fondo crema, márgenes constantes y `object-fit: contain`, manteniendo tres columnas en computadora y una en celular. Las fotografías existentes no se modifican; solo cambia su presentación para que no se recorten.

### Archivos de esta mejora

- `index.html`: SEO, verificación conservada y controles de comparación de fotos.
- `sitemap.xml`: única URL pública.
- `assets/img/og-image.jpg`: tarjeta social.
- `css/photo-editor.css`: presentación uniforme del catálogo y editor responsive.
- `js/image-processing.js`: validación, decodificación y compresión con transparencia.
- `js/photo-editor.js`: selección, comparación, cancelación y versión elegida.
- `js/background-worker.js`: descarga diferida y segmentación en el dispositivo.
- `js/admin.js`: conecta el editor con la publicación existente.
- `THIRD_PARTY_NOTICES.md`: licencias y descargas del recorte.
- `tools/create-og-image.ps1`: reproduce la tarjeta social usando por defecto `assets/img/og-conjunto-verde.png`, el conjunto verde y blanco proporcionado, integrado sin recuadro sobre el fondo crema. Admite `-ProductImage` para elegir otra foto PNG transparente local.

No hay configuración nueva de Supabase. Para llevar estas mejoras al sitio público, revisá los cambios y publicalos manualmente junto con los archivos nuevos. No se hacen commits ni pushes automáticamente.

### Verificaciones realizadas el 23 de octubre de 2026

- Validación local de HTML, metadatos sin duplicados, JSON-LD, canonical, enlaces, sitemap y JPG real de 1200 × 630 (unos 54 KB). Se puede repetir con `python tools/validate-site.py`.
- Comprobación de sintaxis de todos los módulos JavaScript.
- Pruebas en Edge de catálogo con tres columnas en computadora y una en celular, imágenes completas y ausencia de descargas de IA para visitantes.
- Pruebas del formulario con Supabase interceptado únicamente en el entorno de prueba: original por defecto, selección procesada, subida de un archivo real con transparencia, título opcional, cancelación y recuperación tras fallo sin perder el título. No se escribieron productos reales para estas pruebas.
- Ejecución del modelo ISNet real desde el navegador sobre una de las fotos proporcionadas: se generó el PNG transparente y se inspeccionó la comparación. El modelo conservó la prenda, pero dejó un resto de tela en el espacio estrecho entre las piernas. El recorte automático requiere revisión; no se garantiza que vacíe todos los huecos de crochet.
- Lectura pública real de Supabase: HTTP 200. Se comprobó que `js/supabase.js`, `supabase/setup.sql` y las consultas del catálogo no cambiaron.
- Pendientes de prueba manual: inicio de sesión con la contraseña actual de Sandra, publicación real en Storage, funcionamiento en su celular concreto y vistas previas sociales después del despliegue. Se ejercitó el flujo de publicación mediante interceptación, no mediante escrituras en la base real.

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
