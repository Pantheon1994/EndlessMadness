# 🚨 DÉPLOIEMENT D'URGENCE - Endless Madness

## 🎯 Solution la plus simple et rapide

### Option 1: Netlify (Recommandé pour démarrer rapidement)

1. **Construire le projet** :
   ```bash
   npm install
   npm run build:prod
   ```

2. **Aller sur [netlify.com](https://netlify.com)**

3. **Drag & Drop** :
   - Glissez le dossier `dist` sur netlify.com
   - Votre site sera en ligne en 30 secondes !

4. **Configuration automatique** :
   - Le fichier `_redirects` est déjà inclus dans `dist`
   - Le routing Angular fonctionnera parfaitement

### Option 2: Surge.sh (Ultra rapide)

1. **Installer Surge** :
   ```bash
   npm install -g surge
   ```

2. **Build et déployer** :
   ```bash
   npm run build:prod
   cd dist
   surge
   ```

3. **Suivre les instructions** (email + mot de passe)

### Option 3: GitHub Pages

1. **Installer gh-pages** :
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Ajouter script au package.json** :
   ```json
   "deploy": "ng build --configuration production --base-href '/endless-madness/' && npx gh-pages -d dist"
   ```

3. **Déployer** :
   ```bash
   npm run deploy
   ```

## ⚡ Configuration Render corrigée

Si vous voulez continuer avec Render, utilisez cette config :

**Fichier render.yaml corrigé** :
```yaml
services:
  - type: static
    name: endless-madness
    buildCommand: npm install && npm run build:prod
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

## 🔧 Diagnostic rapide

Si le build échoue, vérifiez :

1. **Node.js version** (doit être 20+) :
   ```bash
   node --version
   ```

2. **Dependencies** :
   ```bash
   npm install
   ```

3. **Build local** :
   ```bash
   npm run build:prod
   ```

4. **Dossier dist créé** :
   - Vérifiez que le dossier `dist` existe
   - Qu'il contient `index.html` et les autres fichiers

## 🎮 Votre jeu sera en ligne en quelques minutes !

Choisissez la méthode la plus simple pour vous et votre jeu **Endless Madness** sera accessible au monde entier !
