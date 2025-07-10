# Endless Madness - Jeu de cartes tactique roguelike

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

Ce projet est un jeu de cartes tactique roguelike développé en Angular appelé **Endless Madness**.

## Concept du jeu
- Jeu de deckbuilding où le joueur affronte les étages d'une tour infinie
- Mécaniques de folie : les unités deviennent folles si elles survivent trop longtemps
- Système d'or pour acheter de nouvelles cartes
- Collection persistante de cartes
- Combat au tour par tour avec phases distinctes

## Architecture du projet
- **Modèles** : Card, Enemy, GameState, Player dans `src/app/models/`
- **Services** : GameService, CardService, GoldService, StorageService dans `src/app/services/`
- **Composants** : Menu, Game, DeckBuilder, Collection, CardShop dans `src/app/components/`

## Conventions de code
- Utiliser TypeScript strict
- Composants standalone Angular
- Services injectables avec `providedIn: 'root'`
- Interfaces pour tous les modèles de données
- CSS modulaire par composant

## Mécaniques de jeu importantes
- Deck de 20-30 cartes construites depuis la collection
- Mana croissante par tour
- 6 slots de terrain maximum
- Système de folie avec seuils et effets bonus/malus
- Étages avec vagues multiples d'ennemis
- Gain d'or après victoire pour acheter de nouvelles cartes
