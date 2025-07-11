import { Card } from './card.interface';
import { Enemy } from './enemy.interface';

export interface GameState {
  currentFloor: number;
  currentWave: number;
  totalWavesInFloor: number;
  mana: number;
  maxMana: number;
  playerHp: number;
  maxPlayerHp: number;
  playerHand: Card[];
  cardsInPlay: Card[];
  enemies: Enemy[];
  maxSlots: number;
  gamePhase: 'draw' | 'player' | 'enemy' | 'endWave' | 'victory' | 'defeat';
  notifications?: string[]; // Messages temporaires pour le joueur
  currentAttack?: { // Animation d'attaque en cours
    attackerId: string;
    targetId: string;
    damage: number;
    type: 'enemy-to-player' | 'enemy-to-card' | 'card-to-enemy';
  };
  damageFloaters?: { // Bulles de dégâts flottantes
    id: string;
    damage: number;
    x: number;
    y: number;
    timestamp: number;
    type?: 'damage' | 'healing' | 'critical';
    targetId?: string; // ID de la cible pour calculer la position
  }[];
}
