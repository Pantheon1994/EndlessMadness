import { Card } from './card.interface';

export interface Player {
  gold: number;
  collection: Card[];
  deck: Card[];
  maxFloorReached: number; // Étage maximum débloqué
}
