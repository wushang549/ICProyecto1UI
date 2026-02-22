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
