#!/bin/bash

echo "🔨 Test du build Angular..."

# Nettoyer le dossier dist
if [ -d "dist" ]; then
    echo "🧹 Nettoyage du dossier dist..."
    rm -rf dist
fi

# Build de production
echo "📦 Build de production..."
npm run build:prod

# Vérifier la structure du dossier dist
echo "📁 Structure du dossier dist:"
if [ -d "dist" ]; then
    ls -la dist/
    echo ""
    echo "📄 Fichiers dans dist:"
    find dist -type f -name "*.html" -o -name "*.js" -o -name "*.css" | head -10
    echo ""
    echo "🔍 Vérification index.html:"
    if [ -f "dist/index.html" ]; then
        echo "✅ index.html trouvé dans dist/"
    else
        echo "❌ index.html NON trouvé dans dist/"
    fi
else
    echo "❌ Dossier dist non créé !"
fi
