export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImage(file) {
  if (!file || !IMAGE_TYPES.includes(file.type)) throw new Error('Elegí una imagen JPG, PNG o WebP.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('La imagen supera el máximo de 8 MB.');
}

export async function decodeImage(blob) {
  if (typeof createImageBitmap === 'function') {
    try { return await createImageBitmap(blob); } catch { /* Fallback para navegadores móviles. */ }
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally { URL.revokeObjectURL(url); }
}

export async function compressImage(file) {
  validateImage(file);
  const image = await decodeImage(file);
  try {
    const width = image.width, height = image.height;
    const scale = Math.min(1, 1600 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    // Un lienzo sin relleno conserva la transparencia; no se aplican filtros de color.
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .82));
    if (!blob || !['image/webp', 'image/png'].includes(blob.type)) throw new Error('No se pudo preparar la fotografía.');
    if (blob.size > MAX_IMAGE_BYTES) throw new Error('La fotografía preparada supera los 8 MB. Elegí una de menor resolución.');
    return blob;
  } finally { image.close?.(); }
}
