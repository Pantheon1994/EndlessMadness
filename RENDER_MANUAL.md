# Alternative simple pour Render - Si le yaml ne fonctionne pas

## Configuration manuelle sur render.com :

1. **Type de service** : Static Site
2. **Build Command** : `npm install && npm run build:prod`
3. **Publish Directory** : `dist`
4. **Node Version** : 20

## Variables d'environnement (si nécessaire) :
- `NODE_VERSION` = `20`

## Configuration alternative sans yaml :

Supprimez le `render.yaml` et configurez manuellement :
- Allez sur render.com
- New → Static Site
- Connectez votre repo
- Configurez manuellement les paramètres ci-dessus
