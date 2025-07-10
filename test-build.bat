@echo off
echo 🔨 Test du build Angular...

REM Nettoyer le dossier dist
if exist "dist" (
    echo 🧹 Nettoyage du dossier dist...
    rmdir /s /q dist
)

REM Build de production
echo 📦 Build de production...
call npm run build:prod

REM Vérifier la structure du dossier dist
echo 📁 Structure du dossier dist:
if exist "dist" (
    dir dist
    echo.
    echo 🔍 Vérification index.html:
    if exist "dist\index.html" (
        echo ✅ index.html trouvé dans dist\
    ) else (
        echo ❌ index.html NON trouvé dans dist\
    )
) else (
    echo ❌ Dossier dist non créé !
)

pause
