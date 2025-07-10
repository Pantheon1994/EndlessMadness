# 🔧 Guide de dépannage - Endless Madness

## ❌ Problème : Le site reste en build sur Render

### 🎯 Solutions par ordre de priorité :

## Solution 1: Corriger la configuration Render

**Problème** : Le `render.yaml` était configuré pour un service web au lieu d'un site statique.

**✅ Correction appliquée** : 
- Changé `type: web` vers `type: static`
- Supprimé les paramètres inutiles (runtime, plan, region, etc.)
- Optimisé la configuration pour un site statique

## Solution 2: Vérifier la structure du projet

Assurez-vous que votre repository GitHub contient :
```
├── src/
├── package.json
├── angular.json
├── render.yaml
├── .nvmrc (contenant "20")
└── README.md
```

## Solution 3: Alternative - Utiliser Vercel

Si Render continue à poser problème, utilisez Vercel :

1. **Installer Vercel CLI** :
   ```bash
   npm i -g vercel
   ```

2. **Se connecter** :
   ```bash
   vercel login
   ```

3. **Déployer** :
   ```bash
   vercel
   ```

4. **Configuration automatique** :
   - Build Command: `npm run build:prod`
   - Output Directory: `dist`
   - Framework Preset: Angular

## Solution 4: Alternative - Netlify

1. **Aller sur [netlify.com](https://netlify.com)**
2. **Connecter votre repo GitHub**
3. **Configuration** :
   - Build command: `npm run build:prod`
   - Publish directory: `dist`

## Solution 5: Vérifications de base

### Vérifier le package.json
```json
{
  "scripts": {
    "build:prod": "ng build --configuration production --output-path dist"
  }
}
```

### Vérifier que le build fonctionne localement
```bash
npm install
npm run build:prod
```

## 🚨 Erreurs communes

### 1. Node.js version incorrecte
- **Erreur** : "Node.js version v18.x detected"
- **Solution** : Fichier `.nvmrc` doit contenir "20"

### 2. Build command incorrect
- **Erreur** : Build échoue
- **Solution** : Utiliser `npm run build:prod` au lieu de `npm run build`

### 3. Chemin de publication incorrect
- **Erreur** : Site vide après déploiement
- **Solution** : `staticPublishPath: ./dist`

## 📋 Checklist de dépannage

- [ ] `.nvmrc` contient "20"
- [ ] `render.yaml` utilise `type: static`
- [ ] `package.json` a le script `build:prod`
- [ ] Le build fonctionne localement
- [ ] Le repository est bien connecté à Render
- [ ] Les logs de build ne montrent pas d'erreurs

## 🔄 Redéployer après corrections

1. **Pousser les modifications** :
   ```bash
   git add .
   git commit -m "Fix: Correct Render configuration for static site"
   git push
   ```

2. **Redéployer sur Render** :
   - Aller dans votre dashboard Render
   - Cliquer sur "Manual Deploy" → "Deploy latest commit"

## 🆘 Si rien ne fonctionne

Utilisez cette configuration Netlify simple :

1. **Build le projet localement** :
   ```bash
   npm run build:prod
   ```

2. **Drag & drop le dossier `dist`** sur netlify.com

3. **Votre site sera en ligne immédiatement !**

---

📞 **Besoin d'aide ?** Vérifiez les logs de build sur votre plateforme de déploiement pour plus de détails.
