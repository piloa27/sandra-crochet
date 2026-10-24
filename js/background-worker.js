// Este worker se crea solamente al pulsar Quitar fondo. No se suben fotografías.
// Versiones fijadas; licencias y tamaño de descarga en THIRD_PARTY_NOTICES.md.
const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js';
const MODEL = 'xrds/isnet-general-onnx-int8';
const REVISION = '71eff2372ec9c8edbc6ca637ded591423d23b65a';

self.onmessage = async ({ data }) => {
  try {
    const { pipeline, RawImage, env } = await import(TRANSFORMERS_URL);
    env.allowLocalModels = false;
    env.backends.onnx.wasm.numThreads = 1; // Compatible con Pages sin cabeceras de aislamiento.
    env.backends.onnx.wasm.proxy = false; // Ya estamos en un worker independiente.
    const progress_callback = progress => {
      if (progress.status === 'progress') {
        self.postMessage({ type: 'progress', progress: progress.progress, file: progress.file });
      }
    };
    const segmenter = await pipeline('image-segmentation', MODEL, {
      revision: REVISION, dtype: 'q8', device: 'wasm', progress_callback
    });
    self.postMessage({ type: 'inference' });
    const image = await RawImage.fromBlob(data.blob);
    const [{ mask }] = await segmenter(image.rgb());
    const alpha = new Uint8Array(mask.data);
    self.postMessage({ type: 'result', alpha: alpha.buffer, width: image.width, height: image.height }, [alpha.buffer]);
    await segmenter.dispose();
  } catch (error) {
    self.postMessage({ type: 'error', message: error.message || 'No se pudo procesar la fotografía.' });
  }
};
