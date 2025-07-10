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
}
