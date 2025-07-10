# 🎴 Endless Madness - Jeu de cartes tactique roguelike

Un jeu de cartes tactique développé en Angular où le joueur affronte les étages d'une tour infinie.

## 🎮 Fonctionnalités

- **Combat tactique** : Système de combat au tour par tour avec unités et sorts
- **Système d'effets** : Sorts avec effets temporaires (rage, poison, étourdissement, invulnérabilité)
- **Points de vie du joueur** : Système de santé avec attaque directe des ennemis
- **Collection de cartes** : Plus de 14 cartes uniques avec différents effets
- **Boutique** : Marché quotidien et packs aléatoires
- **Progression** : Système d'étages avec progression sauvegardée

## 🃏 Nouvelles cartes ajoutées

### Sorts tactiques
- **Rage Bestiale** (2 mana) : Double les dégâts d'une unité pendant 2 tours
- **Arsenal** (4 mana) : Augmente définitivement l'attaque d'une unité de +2
- **Éclair Paralysant** (3 mana) : Étourdit un ennemi pendant 2 tours
- **Protection Divine** (5 mana) : Rend une unité invulnérable pendant 1 tour
- **Poison** (2 mana) : Inflige 1 dégât par tour à un ennemi jusqu'à sa mort

## 🚀 Développement local

### Prérequis
- Node.js (version 20 ou supérieure)
- npm

### Installation
```bash
npm install
```

### Démarrage
```bash
npm start
```

### Build de production
```bash
npm run build:prod
```

## 🌐 Déploiement sur Render

### Méthode 1: Déploiement automatique avec render.yaml

1. **Créer un repository GitHub** pour votre projet
2. **Pousser le code** vers GitHub :
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Endless Madness game"
   git branch -M main
   git remote add origin https://github.com/VOTRE-USERNAME/endless-madness.git
   git push -u origin main
   ```

3. **Configurer Render** :
   - Allez sur [render.com](https://render.com)
   - Créez un compte et connectez votre GitHub
   - Cliquez sur "New +" → "Static Site"
   - Sélectionnez votre repository
   - Render détectera automatiquement le fichier `render.yaml`

### Méthode 2: Configuration manuelle

1. **Créer un nouveau Static Site sur Render**
2. **Configurer les paramètres** :
   - **Build Command**: `npm install && npm run build:prod`
   - **Publish Directory**: `dist`
   - **Node Version**: 20

3. **Variables d'environnement** (optionnel) :
   - Vous pouvez ajouter des variables si nécessaire

### Configuration du fichier render.yaml

Le fichier `render.yaml` est déjà configuré dans le projet :
- **Runtime**: Node.js
- **Build Command**: Installation des dépendances + build de production
- **Publish Path**: Dossier `dist` généré par Angular
- **Redirections**: Configuration pour le routing Angular

## 🎯 Structure du projet

```
src/
├── app/
│   ├── components/
│   │   ├── game/           # Composant de jeu principal
│   │   ├── menu/           # Menu principal
│   │   ├── card-shop/      # Boutique de cartes
│   │   └── collection/     # Collection de cartes
│   ├── models/
│   │   ├── card.interface.ts      # Modèle des cartes
│   │   ├── enemy.interface.ts     # Modèle des ennemis
│   │   └── game-state.interface.ts # État du jeu
│   └── services/
│       ├── game.service.ts        # Logique du jeu
│       ├── card.service.ts        # Gestion des cartes
│       └── gold.service.ts        # Système d'or
```

## 🔧 Technologies utilisées

- **Angular 20** : Framework principal
- **TypeScript** : Langage de programmation
- **RxJS** : Gestion des états réactifs
- **CSS3** : Styles et animations
- **LocalStorage** : Sauvegarde locale

## 📱 Responsive Design

Le jeu est entièrement responsive et optimisé pour :
- 📱 Mobile (smartphones)
- 📱 Tablettes
- 💻 Desktop

## 🎨 Fonctionnalités UX

- **Animations fluides** : Effets visuels pour les actions
- **Interface moderne** : Design épuré et intuitif
- **Bulles de stats** : Affichage visuel des statistiques des cartes
- **Effets temporaires** : Indicateurs visuels pour les buffs/debuffs
- **Feedback visuel** : Alertes et confirmations

## 🔄 Système de jeu

### Combat
- **Mana fixe** : 10 mana par tour (plus de système croissant)
- **6 emplacements** : Maximum d'unités sur le terrain
- **Effets temporaires** : Système remplaçant l'ancien système de folie
- **PV du joueur** : Le joueur a des points de vie et peut être attaqué

### Progression
- **Étages infinis** : Tour sans fin avec difficulté croissante
- **Récompenses** : Or gagné après chaque victoire
- **Collection persistante** : Cartes sauvegardées entre les parties
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

---

🎮 **Bon jeu !** Affrontez la tour infinie et construisez le deck ultime !
