export interface TemporaryEffect {
  type: 'rage-boost' | 'arsenal' | 'stun' | 'invulnerable' | 'poison' | 'divine-protection' | 'shield-boost' | 'armor-break'; // Types d'effets possibles
  duration: number; // Nombre de tours restants (-1 pour permanent jusqu'à la mort)
  attackMultiplier?: number; // Multiplicateur d'attaque
  attackBonus?: number; // Bonus d'attaque fixe
  stunned?: boolean; // Si l'unité/ennemi est étourdi
  invulnerable?: boolean; // Si l'unité ne peut pas mourir
  poisonDamage?: number; // Dégâts de poison par tour
  armorDestroyed?: boolean; // Si l'armure a été détruite
  description: string; // Description de l'effet
}

export interface Card {
  id: string;
  name: string;
  type: 'unit' | 'spell';
  cost: number;
  rarity?: 'normal' | 'blue' | 'epic' | 'legendary'; // Rareté de la carte
  hp?: number;
  attack?: number;
  defense?: number;
  effect?: string;
  price?: number; // Pour le shop
  maxInDeck?: number; // Nombre maximum de cette carte dans un deck
  // État pendant le jeu
  currentHp?: number;
  currentDefense?: number;
  canAttackThisTurn?: boolean; // Pour les effets qui empêchent d'attaquer
  hasAttackedThisTurn?: boolean; // Pour limiter une attaque par tour
  temporaryEffects?: TemporaryEffect[]; // Effets temporaires actifs
}
