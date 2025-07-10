#!/bin/bash

# Script de déploiement pour Endless Madness

echo "🎴 Déploiement d'Endless Madness sur Render"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé. Êtes-vous dans le bon répertoire ?"
    exit 1
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Build de production
echo "🔨 Build de production..."
npm run build:prod

# Vérifier que le build a réussi
if [ -d "dist" ]; then
    echo "✅ Build réussi ! Dossier dist créé."
    echo "📊 Taille du build:"
    du -sh dist/
else
    echo "❌ Erreur: Le build a échoué."
    exit 1
fi

echo ""
echo "🚀 Prêt pour le déploiement !"
echo ""
echo "Étapes suivantes:"
echo "1. Créez un repository GitHub"
echo "2. Poussez le code:"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Initial commit - Endless Madness'"
echo "   git branch -M main"
echo "   git remote add origin https://github.com/VOTRE-USERNAME/endless-madness.git"
echo "   git push -u origin main"
echo ""
echo "3. Allez sur render.com et créez un nouveau Static Site"
echo "4. Connectez votre repository GitHub"
echo "5. Render détectera automatiquement le fichier render.yaml"
echo ""
echo "🎮 Bon jeu !"
