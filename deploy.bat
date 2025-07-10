@echo off
echo 🎴 Déploiement d'Endless Madness sur Render

REM Vérifier que nous sommes dans le bon répertoire
if not exist "package.json" (
    echo ❌ Erreur: package.json non trouvé. Êtes-vous dans le bon répertoire ?
    pause
    exit /b 1
)

REM Installer les dépendances
echo 📦 Installation des dépendances...
call npm install

REM Build de production
echo 🔨 Build de production...
call npm run build:prod

REM Vérifier que le build a réussi
if exist "dist" (
    echo ✅ Build réussi ! Dossier dist créé.
) else (
    echo ❌ Erreur: Le build a échoué.
    pause
    exit /b 1
)

echo.
echo 🚀 Prêt pour le déploiement !
echo.
echo Étapes suivantes:
echo 1. Créez un repository GitHub
echo 2. Poussez le code:
echo    git init
echo    git add .
echo    git commit -m "Initial commit - Endless Madness"
echo    git branch -M main
echo    git remote add origin https://github.com/VOTRE-USERNAME/endless-madness.git
echo    git push -u origin main
echo.
echo 3. Allez sur render.com et créez un nouveau Static Site
echo 4. Connectez votre repository GitHub
echo 5. Render détectera automatiquement le fichier render.yaml
echo.
echo 🎮 Bon jeu !
pause
