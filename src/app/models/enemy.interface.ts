export interface Enemy {
  id: string;
  name: string;
  hp: number;
  attack: number;
  defense?: number; // Défense de l'ennemi
  effect?: string;
  // État pendant le jeu
  currentHp: number;
  currentDefense?: number; // Défense actuelle
  hasAttackedThisTurn?: boolean; // Pour limiter une attaque par tour
  temporaryEffects?: TemporaryEffect[]; // Effets temporaires actifs
}

export interface TemporaryEffect {
  type: 'stun' | 'invulnerable' | 'poison';
  duration: number;
  stunned?: boolean;
  invulnerable?: boolean;
  poisonDamage?: number;
  description: string;
}
