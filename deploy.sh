#!/bin/bash
# Deploy de Waddle a GitHub Pages (user-site, servido desde la raíz).
# La entrada de Vite es app.html (NUNCA index.html), así el build siempre recompila src/.
set -e
cd "$(dirname "$0")"

echo "==> Compilando (vite build, entrada app.html)…"
rm -rf docs
npm run build

echo "==> Copiando salida compilada a la raíz…"
cp docs/app.html index.html        # index.html servido = compilado (referencia /assets/app-*.js)
rm -rf assets
cp -r docs/assets assets
touch .nojekyll

echo "==> Verificando que el bundle contiene código fuente reciente…"
JS=$(ls assets/app-*.js)
echo "    Bundle: $JS"

echo "==> Listo. Ahora: git add -A && git commit && git push"
