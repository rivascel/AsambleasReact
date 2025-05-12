#!/bin/bash

echo "🔧 Construyendo el frontend..."
cd cliente
npm install
npm run build

echo "✅ Build completado."

# No necesitas copiar si ya sirves desde cliente/dist
# Pero si algún día decides servir desde src/public, puedes usar:
# cp -r dist/* ../src/public/
