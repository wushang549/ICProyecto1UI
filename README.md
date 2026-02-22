# ICProyecto1UI

Aplicacion web en **Next.js 16 + React + TypeScript** para estimar costos de seguro de salud.

## Requisitos

- Node.js 20 o superior (recomendado)
- npm (incluido con Node)

## Ejecutar en local

1. Instalar dependencias:

```bash
npm install
```

2. Levantar en modo desarrollo:

```bash
npm run dev
```

3. Abrir en el navegador:

- `http://localhost:3000`
- Si `3000` esta ocupado, Next asigna otro puerto (por ejemplo `3001`).

## Build de produccion local

```bash
npm run build
npm start
```

## Inferencia ONNX en frontend

Esta app ejecuta inferencia en el navegador con `onnxruntime-web`.

- Modelo ONNX: `public/models/individual_medical_cost_model.onnx`
- Binarios WASM runtime: `public/onnx/`
- Dependencia: `onnxruntime-web` (instalada via `npm install`)

### Si cambias o actualizas el runtime de ONNX

Recopia los binarios `.wasm` y `.mjs` desde `node_modules`:

```powershell
New-Item -ItemType Directory -Force -Path public/onnx | Out-Null
Copy-Item node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.* public/onnx -Force
```

### Troubleshooting rapido

- Error `no available backend found`:
  - Verifica que existan archivos en `public/onnx/`.
  - Reinicia `npm run dev` y haz hard refresh.
- Warning `Unknown CPU vendor` en consola:
  - Es warning del runtime WASM de ONNX; no bloquea la inferencia.
- Si cambias el modelo y no se reflejan resultados:
  - Reemplaza `public/models/individual_medical_cost_model.onnx`.
  - Reinicia `npm run dev`.

## Nota si aparece error de lock en `.next/dev/lock`

Eso pasa cuando ya hay otro `next dev` corriendo. Cierra esa terminal o finaliza el proceso, y vuelve a ejecutar:

```bash
npm run dev
```

## Nota sobre popup de desarrollo

El indicador flotante de Next.js en desarrollo fue desactivado en `next.config.mjs` con:

```js
devIndicators: false
```

## Deploy automatico en GitHub Pages

Este repo ya incluye el workflow `/.github/workflows/deploy-pages.yml` para desplegar en cada push a `main` o `master`.

### Resultado

- Cada commit nuevo dispara el workflow y actualiza la pagina.
- La URL final queda en:
  - `https://wushang549.github.io/ICProyecto1UI/`
