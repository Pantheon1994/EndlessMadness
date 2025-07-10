# 🚀 Guide de déploiement rapide - Endless Madness

## Option 1: Render (Recommandé)

### Étapes rapides:
1. **Créer un repo GitHub** pour votre projet
2. **Pousser le code** :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/VOTRE-USERNAME/endless-madness.git
   git push -u origin main
   ```
3. **Aller sur [render.com](https://render.com)**
4. **Créer un nouveau "Static Site"**
5. **Connecter votre repo GitHub**
6. **Render détectera automatiquement le `render.yaml`** ✅

### Configuration automatique:
- ✅ Build Command: `npm install && npm run build:prod`
- ✅ Publish Directory: `dist`
- ✅ Node Version: 20
- ✅ Redirections pour Angular routing

---

## Option 2: Vercel

1. **Installer Vercel CLI** :
   ```bash
   npm i -g vercel
   ```
2. **Déployer** :
   ```bash
   vercel
   ```
3. **Suivre les instructions** (le `vercel.json` est déjà configuré)

---

## Option 3: Netlify

1. **Aller sur [netlify.com](https://netlify.com)**
2. **Drag & drop le dossier `dist`** après avoir fait `npm run build:prod`
3. **Ou connecter votre repo GitHub**

---

## Option 4: Firebase Hosting

1. **Installer Firebase CLI** :
   ```bash
   npm install -g firebase-tools
   ```
2. **Initialiser** :
   ```bash
   firebase init hosting
   ```
3. **Déployer** :
   ```bash
   npm run build:prod
   firebase deploy
   ```

---

## 🛠️ Scripts disponibles

- `npm run build:prod` - Build de production
- `npm start` - Serveur de développement
- `./deploy.sh` (Linux/Mac) ou `deploy.bat` (Windows) - Script de déploiement

---

## ✅ Checklist avant déploiement

- [ ] Le build fonctionne (`npm run build:prod`)
- [ ] Code poussé sur GitHub
- [ ] Fichiers de configuration présents (`render.yaml`, `vercel.json`, etc.)
- [ ] README.md à jour

---

🎮 **Votre jeu sera disponible en quelques minutes !**
