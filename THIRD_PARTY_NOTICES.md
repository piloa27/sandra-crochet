# Dependencias del recorte de fotografías

El código de integración es propio. Las dependencias se descargan únicamente cuando Sandra pulsa **Quitar fondo**. No se requiere cuenta, API key ni servicio de inferencia pago.

- **Transformers.js 3.8.1**, Hugging Face: Apache-2.0. Código y licencia: https://github.com/huggingface/transformers.js/tree/3.8.1 y https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/LICENSE
- **ISNet General INT8**, `xrds/isnet-general-onnx-int8`, revisión fijada `71eff2372ec9c8edbc6ca637ded591423d23b65a`: MIT. Modelo original ONNX de IMG.LY: https://huggingface.co/imgly/isnet-general-onnx (marcado MIT). Conversión cuantizada y licencia: https://huggingface.co/xrds/isnet-general-onnx-int8 y https://huggingface.co/xrds/isnet-general-onnx-int8/blob/main/LICENSE
- **ONNX Runtime Web**, dependencia distribuida dentro del paquete de Transformers.js: MIT. Código y avisos de sus componentes: https://github.com/microsoft/onnxruntime y https://github.com/microsoft/onnxruntime/blob/main/ThirdPartyNotices.txt

MIT y Apache-2.0 permiten uso comercial cumpliendo sus términos y conservando los avisos. Las licencias de los paquetes y modelos se mantienen en sus distribuciones originales. No se incorpora la biblioteca `@imgly/background-removal` (AGPL) ni BRIA RMBG (restricciones comerciales): se ejecutan los pesos ISNet publicados bajo MIT mediante Transformers.js.

## Licencia MIT de los pesos ISNet utilizados

Copyright (c) imgly GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Descargas y privacidad

La variante Q8 pesa 44.229.662 bytes (aproximadamente 42 MiB), más JavaScript y WebAssembly. Se solicita desde Hugging Face y jsDelivr. La cuantización comprime los pesos de las convoluciones, conservando las activaciones en FP32. El navegador puede guardar los recursos en su caché si dispone de espacio; no se garantiza que esa caché sobreviva a limpieza o políticas del dispositivo.

Las fotografías se decodifican y segmentan dentro del navegador, en un Web Worker. No se mandan al CDN ni a Hugging Face. Solo la versión elegida por Sandra se sube a Supabase al pulsar Publicar.

El motor usa WebAssembly de un solo hilo para funcionar en GitHub Pages sin cabeceras especiales. No requiere WebGPU. El consumo de memoria puede ser elevado, especialmente en teléfonos; hay cancelación y un límite de cuatro minutos sin progreso de descarga o para realizar la inferencia. Una descarga lenta puede durar más mientras siga avanzando.
