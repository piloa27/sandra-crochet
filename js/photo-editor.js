import { compressImage, decodeImage, validateImage, MAX_IMAGE_BYTES } from './image-processing.js';

export function createPhotoEditor({ form, onBusy }) {
  const input = form.elements.image;
  const editor = document.querySelector('#photo-editor');
  const preview = document.querySelector('#image-preview');
  const versions = document.querySelector('#photo-versions');
  const status = document.querySelector('#photo-status');
  const removeButton = document.querySelector('#remove-background');
  const cancelButton = document.querySelector('#cancel-background');
  let original = null, processed = null, originalUrl = null, processedUrl = null;
  let worker = null, timeout = null, slowTimer = null;
  let busy = false, uploading = false, generation = 0;

  function announce(text, error = false) {
    status.textContent = text;
    status.classList.toggle('error', error);
    status.classList.toggle('busy', busy);
  }
  function stop() {
    worker?.terminate(); worker = null;
    clearTimeout(timeout); clearTimeout(slowTimer);
    busy = false;
    removeButton.disabled = uploading;
    removeButton.textContent = processed ? 'Volver a quitar fondo' : 'Quitar fondo';
    cancelButton.classList.add('hidden');
    status.classList.remove('busy');
    onBusy(uploading);
  }
  function reset({ clearInput = true } = {}) {
    generation += 1;
    stop();
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (processedUrl) URL.revokeObjectURL(processedUrl);
    original = processed = originalUrl = processedUrl = null;
    if (clearInput) input.value = '';
    editor.classList.add('hidden'); versions.classList.add('hidden');
    preview.removeAttribute('src');
    document.querySelector('#photo-original').removeAttribute('src');
    document.querySelector('#photo-processed').removeAttribute('src');
    form.querySelector('[name="photoVersion"][value="original"]').checked = true;
    announce('');
  }
  input.addEventListener('change', () => {
    const file = input.files[0];
    reset({ clearInput: false });
    if (!file) return;
    editor.classList.remove('hidden');
    try {
      validateImage(file);
      original = file;
      originalUrl = URL.createObjectURL(file);
      preview.src = originalUrl;
      announce('Se publicará la fotografía original. Podés probar Quitar fondo.');
    } catch (error) { input.value = ''; announce(error.message, true); removeButton.disabled = true; }
  });
  document.querySelector('#remove-preview').addEventListener('click', () => reset());
  cancelButton.addEventListener('click', () => {
    generation += 1; stop();
    announce('Procesamiento cancelado. Podés elegir la original o volver a intentarlo.');
  });
  versions.addEventListener('change', () => {
    const useProcessed = form.elements.photoVersion.value === 'processed' && processed;
    preview.src = useProcessed ? processedUrl : originalUrl;
    announce(useProcessed ? 'Se publicará la versión sin fondo.' : 'Se publicará la fotografía original.');
  });
  removeButton.addEventListener('click', async () => {
    if (!original || busy || uploading) return;
    if (!window.Worker || !window.WebAssembly || !window.OffscreenCanvas) {
      announce('Este navegador no permite el recorte automático. Probá Chrome o Edge actualizado, o subí un PNG recortado desde otro equipo. Podés publicar la original.', true);
      return;
    }
    const current = ++generation;
    busy = true; onBusy(true); removeButton.disabled = true;
    cancelButton.classList.remove('hidden');
    announce('Preparando el recorte. La primera descarga del modelo es de unos 42 MB más el motor de IA.');
    slowTimer = setTimeout(() => {
      if (current === generation) announce('Está demorando. Podés esperar o cancelar y publicar la original. En un celular, probá con Wi-Fi o desde una computadora.');
    }, 45000);
    const armTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (current === generation) { generation += 1; stop(); announce('El procesamiento tardó demasiado. Podés reintentarlo o publicar la original; tu título se conservó.', true); }
      }, 240000);
    };
    armTimeout();
    try {
      const workingBlob = await compressImage(original);
      if (current !== generation) return;
      worker = new Worker(new URL('./background-worker.js', import.meta.url), { type: 'module' });
      worker.onerror = () => {
        if (current !== generation) return;
        stop(); announce('No se pudo iniciar el recorte. Revisá la conexión, probá otro navegador o publicá la original.', true);
      };
      worker.onmessage = async ({ data }) => {
        if (current !== generation) return;
        if (data.type === 'progress') {
          armTimeout(); // Permitir descargas lentas mientras sigan avanzando.
          const percent = Number.isFinite(data.progress) ? ` ${Math.round(data.progress)}%` : '';
          announce(`Descargando el modelo de recorte…${percent} La fotografía permanece en tu dispositivo.`);
        } else if (data.type === 'inference') {
          armTimeout();
          announce('Recortando la fotografía… Podés cancelar si tarda demasiado.');
        } else if (data.type === 'error') {
          console.error('Recorte:', data.message);
          stop(); announce('No se pudo quitar el fondo. Podés reintentar, elegir un PNG ya recortado o publicar la original.', true);
        } else if (data.type === 'result') {
          try {
            const image = await decodeImage(workingBlob);
            const canvas = document.createElement('canvas');
            canvas.width = data.width; canvas.height = data.height;
            const context = canvas.getContext('2d');
            context.drawImage(image, 0, 0, canvas.width, canvas.height); image.close?.();
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
            const alpha = new Uint8Array(data.alpha);
            if (alpha.length !== canvas.width * canvas.height) throw new Error('Máscara inválida.');
            for (let i = 0; i < alpha.length; i++) {
              pixels.data[i * 4 + 3] = Math.round(pixels.data[i * 4 + 3] * alpha[i] / 255);
            }
            context.putImageData(pixels, 0, 0);
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob || blob.size > MAX_IMAGE_BYTES) throw new Error('Resultado demasiado grande.');
            if (current !== generation) return;
            if (processedUrl) URL.revokeObjectURL(processedUrl);
            processed = blob; processedUrl = URL.createObjectURL(blob);
            document.querySelector('#photo-original').src = originalUrl;
            document.querySelector('#photo-processed').src = processedUrl;
            versions.classList.remove('hidden');
            // Mantener la original hasta que Sandra elija explícitamente el recorte.
            form.querySelector('[name="photoVersion"][value="original"]').checked = true;
            preview.src = originalUrl;
            stop(); announce('Recorte listo. Compará las dos versiones y elegí cuál publicar. Por ahora está seleccionada la original.');
          } catch (error) {
            if (current !== generation) return;
            console.error(error); stop(); announce('No pudimos preparar el recorte. Reintentá o publicá la original.', true);
          }
        }
      };
      worker.postMessage({ blob: workingBlob });
    } catch (error) {
      if (current !== generation) return;
      console.error(error); stop(); announce('No se pudo preparar la foto. Probá otra imagen o publicá la original.', true);
    }
  });
  return {
    reset,
    getSelectedFile() { return form.elements.photoVersion.value === 'processed' && processed ? processed : original; },
    setUploading(value) {
      uploading = value;
      input.disabled = value; removeButton.disabled = value || busy;
      document.querySelector('#remove-preview').disabled = value;
      form.querySelectorAll('[name="photoVersion"]').forEach(radio => { radio.disabled = value; });
    }
  };
}
