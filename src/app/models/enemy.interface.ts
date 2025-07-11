import { TemporaryEffect } from './card.interface';

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  attack: number;
  defense?: number; // Défense de l'ennemi
  effect?: string;
  specialAbility?: string; // Capacité spéciale comme 'armor-break'
  // État pendant le jeu
  currentHp: number;
  currentDefense?: number; // Défense actuelle
  hasAttackedThisTurn?: boolean; // Pour limiter une attaque par tour
  temporaryEffects?: TemporaryEffect[]; // Effets temporaires actifs
}
