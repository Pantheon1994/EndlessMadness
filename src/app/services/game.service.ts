import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { GameState } from '../models/game-state.interface';
import { Card } from '../models/card.interface';
import { Enemy } from '../models/enemy.interface';
import { CardService } from './card.service';
import { GoldService } from './gold.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private gameState: GameState = {
    currentFloor: 1,
    currentWave: 1,
    totalWavesInFloor: 2,
    mana: 10, // Toujours 10 mana
    maxMana: 10, // Le maxMana est toujours 10
    playerHp: 10, // PV par défaut du joueur
    maxPlayerHp: 10, // PV maximum du joueur
    playerHand: [],
    cardsInPlay: [],
    enemies: [],
    maxSlots: 6,
    gamePhase: 'draw',
    notifications: [],
    damageFloaters: []
  };

  private gameState$ = new BehaviorSubject<GameState>(this.gameState);

  constructor(
    private cardService: CardService,
    private goldService: GoldService
  ) {}

  getGameState() {
    return this.gameState$.asObservable();
  }

  startGame(floor: number = 1): void {
    this.resetGameState(floor);
    this.startNewFloor();
  }

  private resetGameState(floor: number = 1): void {
    this.gameState = {
      currentFloor: floor,
      currentWave: 1,
      totalWavesInFloor: this.calculateWaveCount(floor), // Progression infinie des vagues
      mana: 10, // Commencer avec 10 mana
      maxMana: 10, // Mana maximum commence à 10, puis augmente
      playerHp: 10, // PV par défaut du joueur
      maxPlayerHp: 10, // PV maximum du joueur
      playerHand: [],
      cardsInPlay: [],
      enemies: [],
      maxSlots: 6,
      gamePhase: 'draw',
      notifications: [],
      damageFloaters: []
    };
    this.updateGameState();
  }

  // Calcul du nombre de vagues avec progression infinie mais raisonnable
  private calculateWaveCount(floor: number): number {
    if (floor === 1) return 2; // Étage 1 : 2 vagues
    if (floor <= 3) return 3; // Étages 2-3 : 3 vagues
    if (floor <= 6) return 4; // Étages 4-6 : 4 vagues
    if (floor <= 10) return 5; // Étages 7-10 : 5 vagues
    if (floor <= 20) return 6; // Étages 11-20 : 6 vagues
    if (floor <= 40) return 7; // Étages 21-40 : 7 vagues
    if (floor <= 75) return 8; // Étages 41-75 : 8 vagues
    
    // Au-delà de l'étage 75 : progression logarithmique (max 12 vagues)
    return Math.min(12, 8 + Math.floor(Math.log10(floor - 74)));
  }

  private startNewFloor(): void {
    this.gameState.currentWave = 1;
    // Calcul dynamique des vagues pour progression infinie
    this.gameState.totalWavesInFloor = this.calculateWaveCount(this.gameState.currentFloor);
    this.gameState.cardsInPlay = [];
    // Commencer chaque étage à 10 mana avec maxMana = 10
    this.gameState.mana = 10;
    this.gameState.maxMana = 10;
    this.drawInitialHand();
    this.spawnEnemies();
    this.gameState.gamePhase = 'player';
    this.updateGameState();
  }

  private drawInitialHand(): void {
    const deck = this.cardService.getDeck();
    const shuffledDeck = this.shuffleArray([...deck]);
    this.gameState.playerHand = shuffledDeck.slice(0, 5).map(card => this.initializeCardForGame(card));
  }

  // Méthode pour initialiser les propriétés de jeu d'une carte
  private initializeCardForGame(card: Card): Card {
    return {
      ...card,
      id: card.id || `card-${Date.now()}-${Math.random()}`, // S'assurer qu'il y a toujours un ID unique
      currentHp: card.hp,
      currentDefense: card.defense || 0,
      canAttackThisTurn: true,
      hasAttackedThisTurn: false,
      temporaryEffects: []
    };
  }

  private spawnEnemies(): void {
    const enemyTemplates = [
      { id: 'goblin', name: 'Gobelin', hp: 4, attack: 1 }, // Stats fixes (+2 HP total)
      { id: 'orc', name: 'Orc', hp: 5, attack: 1 }, // Légèrement plus résistant (+2 HP total)
      { id: 'troll', name: 'Troll', hp: 6, attack: 3 }, // Plus dangereux avec 3 dégâts (+2 HP, +1 ATK)
      { id: 'armor-breaker', name: 'Saccageur', hp: 5, attack: 1, specialAbility: 'armor-break' }, // Détruit l'armure (+2 HP total)
      { id: 'healer', name: 'Soigneur', hp: 3, attack: 1, specialAbility: 'heal-allies' } // Soigne les alliés de +1 PV par tour
    ];

    // Progression basée sur le nombre d'ennemis pour une guerre d'attrition INFINIE
    let enemyCount = this.calculateEnemyCount(this.gameState.currentFloor);
    
    // Maximum absolu d'ennemis pour éviter le lag (mais pas de limite d'étage)
    enemyCount = Math.min(enemyCount, 12); // Augmenté pour les étages très élevés

    this.gameState.enemies = [];

    for (let i = 0; i < enemyCount; i++) {
      // Répartition des types d'ennemis selon l'étage (progression infinie)
      let templateIndex = this.selectEnemyType(this.gameState.currentFloor);
      
      const template = enemyTemplates[templateIndex];
      
      // PAS de scaling des stats - garde les stats de base pour la guerre d'attrition
      const enemy: Enemy = {
        ...template,
        id: `${template.id}-${i}`,
        hp: template.hp, // Stats fixes même aux étages élevés
        attack: template.attack, // Stats fixes même aux étages élevés
        currentHp: template.hp,
        specialAbility: (template as any).specialAbility // Copier la capacité spéciale si elle existe
      };
      this.gameState.enemies.push(enemy);
    }
  }

  // Calcul du nombre d'ennemis avec progression infinie mais équilibrée
  private calculateEnemyCount(floor: number): number {
    if (floor === 1) return 1;
    if (floor <= 3) return 2;
    if (floor <= 5) return 3;
    if (floor <= 8) return 4;
    if (floor <= 12) return 5;
    if (floor <= 18) return 6;
    if (floor <= 25) return 7;
    if (floor <= 35) return 8;
    if (floor <= 50) return 9;
    if (floor <= 75) return 10;
    if (floor <= 100) return 11;
    
    // Au-delà de l'étage 100 : progression logarithmique pour éviter l'explosion
    return Math.min(12, 11 + Math.floor(Math.log10(floor - 99)));
  }

  // Sélection du type d'ennemi avec progression infinie
  private selectEnemyType(floor: number): number {
    if (floor === 1) {
      return 0; // Seulement des gobelins à l'étage 1
    }
    
    if (floor <= 5) {
      // Étages débutants : principalement gobelins
      const rand = Math.random();
      if (rand < 0.65) return 0; // 65% gobelins
      else if (rand < 0.85) return 1; // 20% orcs
      else if (rand < 0.95) return 3; // 10% saccageurs
      else return 4; // 5% soigneurs
    }
    
    if (floor <= 15) {
      // Étages intermédiaires : mélange équilibré
      const rand = Math.random();
      if (rand < 0.35) return 0; // 35% gobelins
      else if (rand < 0.55) return 1; // 20% orcs
      else if (rand < 0.75) return 2; // 20% trolls
      else if (rand < 0.9) return 3; // 15% saccageurs
      else return 4; // 10% soigneurs
    }
    
    if (floor <= 50) {
      // Étages avancés : plus de trolls et saccageurs
      const rand = Math.random();
      if (rand < 0.2) return 0; // 20% gobelins
      else if (rand < 0.35) return 1; // 15% orcs
      else if (rand < 0.6) return 2; // 25% trolls
      else if (rand < 0.85) return 3; // 25% saccageurs
      else return 4; // 15% soigneurs
    }
    
    // Étages très élevés (50+) : majorité de trolls et saccageurs
    const rand = Math.random();
    if (rand < 0.1) return 0; // 10% gobelins
    else if (rand < 0.15) return 1; // 5% orcs
    else if (rand < 0.45) return 2; // 30% trolls
    else if (rand < 0.75) return 3; // 30% saccageurs
    else return 4; // 25% soigneurs
  }

  // Gestion de la sélection de cible pour les sorts et attaques
  private awaitingTarget: { cardIndex: number, card: Card } | null = null;
  private awaitingAttackTarget: { unitIndex: number } | null = null;

  getAwaitingTarget(): { cardIndex: number, card: Card } | null {
    return this.awaitingTarget;
  }

  getAwaitingAttackTarget(): { unitIndex: number } | null {
    return this.awaitingAttackTarget;
  }

  selectTarget(cardIndex?: number, enemyIndex?: number): boolean {
    if (!this.awaitingTarget) return false;

    const success = this.castSpellWithTarget(
      this.awaitingTarget.cardIndex, 
      this.awaitingTarget.card, 
      cardIndex, 
      enemyIndex
    );

    if (success) {
      this.awaitingTarget = null;
    }

    return success;
  }

  cancelTargetSelection(): void {
    this.awaitingTarget = null;
  }

  private castSpellWithTarget(
    handIndex: number, 
    card: Card, 
    targetCardIndex?: number, 
    targetEnemyIndex?: number
  ): boolean {
    // Utiliser la même logique que applySpellEffect
    if (this.applySpellEffect(card, targetCardIndex, targetEnemyIndex)) {
      // Coûter le mana et retirer la carte
      this.gameState.mana -= card.cost;
      this.gameState.playerHand.splice(handIndex, 1);
      this.updateGameState();
      return true;
    }
    return false;
  }

  playCard(cardIndex: number, targetCardIndex?: number, targetEnemyIndex?: number): boolean {
    if (this.gameState.gamePhase !== 'player') return false;

    const card = this.gameState.playerHand[cardIndex];
    if (!card || card.cost > this.gameState.mana) return false;

    if (card.type === 'unit') {
      if (this.gameState.cardsInPlay.length >= this.gameState.maxSlots) return false;
      
      // Utiliser la méthode d'initialisation pour les propriétés de jeu
      const unitCard = this.initializeCardForGame(card);
      this.gameState.cardsInPlay.push(unitCard);

      this.gameState.mana -= card.cost;
      this.gameState.playerHand.splice(cardIndex, 1);
      this.updateGameState();
      return true;
    } else if (card.type === 'spell') {
      // Les sorts nécessitent une cible
      if (this.needsTarget(card)) {
        if (targetCardIndex !== undefined || targetEnemyIndex !== undefined) {
          // Appliquer le sort avec la cible
          if (this.applySpellEffect(card, targetCardIndex, targetEnemyIndex)) {
            this.gameState.mana -= card.cost;
            this.gameState.playerHand.splice(cardIndex, 1);
            this.updateGameState();
            return true;
          }
        } else {
          // Attendre la sélection de cible
          this.awaitingTarget = { cardIndex, card };
          this.updateGameState();
          return false; // Pas encore joué, en attente de cible
        }
      } else {
        // Sort sans cible
        this.applySpellEffect(card);
        this.gameState.mana -= card.cost;
        this.gameState.playerHand.splice(cardIndex, 1);
        this.updateGameState();
        return true;
      }
    }

    return false;
  }

  // Configuration centralisée des effets avec leurs limitations
  private readonly EFFECT_CONFIGS: {
    [key: string]: {
      maxStack: number;
      displayName: string;
      isPermanent: boolean;
      countOnlyActive?: boolean;
      onApply?: (target: Card | Enemy) => void;
    }
  } = {
    'shield-boost': {
      maxStack: 2,
      displayName: 'Bouclier',
      isPermanent: true,
      onApply: (target: Card | Enemy) => {
        if ('currentDefense' in target && target.currentDefense !== undefined) {
          target.currentDefense += 2;
        }
      }
    },
    'arsenal': {
      maxStack: 2,
      displayName: 'Arsenal',
      isPermanent: true,
      onApply: (target: Card | Enemy) => {
        // L'effet d'attaque est géré dans calculateAttackDamage
      }
    },
    'rage-boost': {
      maxStack: 2,
      displayName: 'Rage',
      isPermanent: false,
      countOnlyActive: true, // Ne compter que les effets actifs (duration > 0)
      onApply: (target: Card | Enemy) => {
        // L'effet est géré dans calculateAttackDamage
      }
    },
    'divine-protection': {
      maxStack: 1,
      displayName: 'Protection Divine',
      isPermanent: false,
      onApply: (target: Card | Enemy) => {
        // L'effet est géré dans dealDamage
      }
    },
    'stun': {
      maxStack: 1,
      displayName: 'Étourdissement',
      isPermanent: false,
      onApply: (target: Card | Enemy) => {
        // L'effet est géré dans enemyTurn
      }
    },
    'poison': {
      maxStack: 1,
      displayName: 'Poison',
      isPermanent: true,
      onApply: (target: Card | Enemy) => {
        // L'effet est géré dans processTemporaryEffects
      }
    },
    'armor-break': {
      maxStack: 1,
      displayName: 'Armure Brisée',
      isPermanent: true,
      onApply: (target: Card | Enemy) => {
        // Détruit complètement la défense
        if ('currentDefense' in target && target.currentDefense !== undefined) {
          target.currentDefense = 0;
        }
      }
    }
  };

  // Méthode utilitaire pour ajouter de nouveaux effets au système
  public addEffectConfig(
    effectType: string, 
    config: {
      maxStack: number;
      displayName: string;
      isPermanent: boolean;
      countOnlyActive?: boolean;
      onApply?: (target: Card | Enemy) => void;
    }
  ): void {
    this.EFFECT_CONFIGS[effectType] = config;
  }

  // Méthode pour obtenir la configuration d'un effet (utile pour debug)
  public getEffectConfig(effectType: string) {
    return this.EFFECT_CONFIGS[effectType];
  }

  // Méthode pour lister tous les effets configurés
  public getAvailableEffects(): string[] {
    return Object.keys(this.EFFECT_CONFIGS);
  }

  // Système générique ultra-flexible pour tous les effets
  private canApplyEffect(target: Card | Enemy, effectType: string): boolean {
    const config = this.EFFECT_CONFIGS[effectType];
    if (!config || !target.temporaryEffects) return true;
    
    let currentCount: number;
    
    if (config.countOnlyActive) {
      // Compter seulement les effets actifs (duration > 0)
      currentCount = target.temporaryEffects.filter(effect => 
        effect.type === effectType && effect.duration > 0
      ).length;
    } else {
      // Compter tous les effets de ce type
      currentCount = target.temporaryEffects.filter(effect => 
        effect.type === effectType
      ).length;
    }
    
    return currentCount < config.maxStack;
  }

  private applyGenericEffect(
    target: Card | Enemy, 
    effectType: string, 
    effectData: any
  ): boolean {
    const config = this.EFFECT_CONFIGS[effectType];
    
    if (!config) {
      console.warn(`Configuration manquante pour l'effet: ${effectType}`);
      return false;
    }
    
    // Initialiser le tableau d'effets temporaires si nécessaire
    if (!target.temporaryEffects) {
      target.temporaryEffects = [];
    }
    
    // Vérifier la limite
    if (!this.canApplyEffect(target, effectType)) {
      console.log(`Cette cible a déjà le maximum d'effets ${config.displayName} (${config.maxStack})`);
      return false;
    }
    
    // Ajouter l'effet
    target.temporaryEffects.push(effectData);
    
    // Appliquer l'effet immédiat si défini
    if (config.onApply) {
      config.onApply(target);
    }
    
    return true;
  }

  // Système générique pour limiter les effets empilables (version simplifiée pour rétrocompatibilité)
  private canApplyEffect_old(target: Card | Enemy, effectType: string, maxCount: number = 2): boolean {
    if (!target.temporaryEffects) return true;
    
    const currentCount = target.temporaryEffects.filter(effect => 
      effect.type === effectType
    ).length;
    
    return currentCount < maxCount;
  }

  private applyEffectWithLimit(
    target: Card | Enemy, 
    effectType: string, 
    effectData: any, 
    maxCount: number = 2,
    effectName: string = effectType
  ): boolean {
    // Utiliser le nouveau système générique si une configuration existe
    if (this.EFFECT_CONFIGS[effectType]) {
      return this.applyGenericEffect(target, effectType, effectData);
    }
    
    // Système de fallback pour les effets non configurés
    if (!target.temporaryEffects) {
      target.temporaryEffects = [];
    }
    
    const currentCount = target.temporaryEffects.filter(effect => 
      effect.type === effectType
    ).length;
    
    if (currentCount >= maxCount) {
      console.log(`Cette cible a déjà le maximum d'effets ${effectName} (${maxCount})`);
      return false;
    }
    
    target.temporaryEffects.push(effectData);
    return true;
  }

  private needsTarget(card: Card): boolean {
    // Définir quels sorts ont besoin d'une cible
    const targetSpells = ['healing-potion', 'fireball', 'shield-boost', 'rage-boost', 'arsenal', 'stun-bolt', 'divine-protection', 'poison'];
    return targetSpells.includes(card.id);
  }

  private applySpellEffect(card: Card, targetCardIndex?: number, targetEnemyIndex?: number): boolean {
    switch (card.id) {
      case 'healing-potion':
        if (targetCardIndex !== undefined && this.gameState.cardsInPlay[targetCardIndex]) {
          const target = this.gameState.cardsInPlay[targetCardIndex];
          if (target.currentHp !== undefined && target.hp !== undefined) {
            const healAmount = 3;
            target.currentHp = Math.min(target.hp, target.currentHp + healAmount);
            
            // Ajouter une bulle de soin verte
            this.addDamageFloater(healAmount, target.id!, 'healing');
            
            return true;
          }
        }
        return false;

      case 'fireball':
        if (targetEnemyIndex !== undefined && this.gameState.enemies[targetEnemyIndex]) {
          const target = this.gameState.enemies[targetEnemyIndex];
          const damage = 3;
          
          // Animation de fireball (pas d'attaquant spécifique, juste un effet)
          setTimeout(() => {
            this.dealDamageToEnemy(damage, target);
            
            // Ajouter une bulle de dégâts avec style critique pour les sorts
            this.addDamageFloater(damage, target.id, 'critical');
            
            // Nettoyer les ennemis morts après le sort
            this.gameState.enemies = this.gameState.enemies.filter(enemy => enemy.currentHp > 0);
            
            // Vérifier si tous les ennemis sont morts pour finir automatiquement le tour
            this.checkForAutoEndTurn();
            this.updateGameState();
          }, 200);
          
          return true;
        }
        return false;

      case 'shield-boost':
        if (targetCardIndex !== undefined && this.gameState.cardsInPlay[targetCardIndex]) {
          const target = this.gameState.cardsInPlay[targetCardIndex];
          
          // Utiliser le système générique pour les effets de bouclier
          const shieldEffect = {
            type: 'shield-boost',
            duration: -1, // Permanent
            defenseBonus: 2,
            description: '+2 Défense permanent'
          };
          
          return this.applyGenericEffect(target, 'shield-boost', shieldEffect);
        }
        return false;

      case 'mana-crystal':
        // Donner 1 mana
        const manaGain = 1;
        this.gameState.mana = Math.min(this.gameState.mana + manaGain, this.gameState.maxMana);
        return true;

      case 'mana-conversion':
        // Convertir tous les points de mana en cartes
        const currentMana = this.gameState.mana;
        if (currentMana > 0) {
          // Piocher autant de cartes que de points de mana
          for (let i = 0; i < currentMana; i++) {
            this.drawCardEndOfTurn();
          }
          // Réduire le mana à 0
          this.gameState.mana = 0;
          console.log(`Conversion de mana : ${currentMana} points de mana convertis en ${currentMana} cartes !`);
        }
        return true;

      case 'rage-boost':
        if (targetCardIndex !== undefined && this.gameState.cardsInPlay[targetCardIndex]) {
          const target = this.gameState.cardsInPlay[targetCardIndex];
          
          // Utiliser le système générique pour les effets de rage
          const rageEffect = {
            type: 'rage-boost',
            duration: 2,
            attackMultiplier: 2,
            description: 'Dégâts doublés'
          };
          
          return this.applyGenericEffect(target, 'rage-boost', rageEffect);
        }
        return false;

      case 'arsenal':
        if (targetCardIndex !== undefined && this.gameState.cardsInPlay[targetCardIndex]) {
          const target = this.gameState.cardsInPlay[targetCardIndex];
          
          // Utiliser le système générique pour les effets d'arsenal
          const arsenalEffect = {
            type: 'arsenal',
            duration: -1, // Permanent jusqu'à la mort
            attackBonus: 2,
            description: '+2 Attaque permanent'
          };
          
          return this.applyGenericEffect(target, 'arsenal', arsenalEffect);
        }
        return false;

      case 'stun-bolt':
        if (targetEnemyIndex !== undefined && this.gameState.enemies[targetEnemyIndex]) {
          const target = this.gameState.enemies[targetEnemyIndex];
          
          // Utiliser le système générique pour l'étourdissement
          const stunEffect = {
            type: 'stun',
            duration: 2,
            stunned: true,
            description: 'Étourdi'
          };
          
          return this.applyGenericEffect(target, 'stun', stunEffect);
        }
        return false;

      case 'divine-protection':
        if (targetCardIndex !== undefined && this.gameState.cardsInPlay[targetCardIndex]) {
          const target = this.gameState.cardsInPlay[targetCardIndex];
          
          // Utiliser le système générique pour la protection divine
          const protectionEffect = {
            type: 'divine-protection',
            duration: 1,
            invulnerable: true,
            description: 'Invulnérable'
          };
          
          return this.applyGenericEffect(target, 'divine-protection', protectionEffect);
        }
        return false;

      case 'poison':
        if (targetEnemyIndex !== undefined && this.gameState.enemies[targetEnemyIndex]) {
          const target = this.gameState.enemies[targetEnemyIndex];
          
          // Utiliser le système générique pour le poison
          const poisonEffect = {
            type: 'poison',
            duration: -1, // Jusqu'à la mort
            poisonDamage: 1,
            description: 'Empoisonné (1 dégât/tour)'
          };
          
          return this.applyGenericEffect(target, 'poison', poisonEffect);
        }
        return false;

      case 'card-draw':
        // Piocher 2 cartes
        let cardsDrawn = 0;
        for (let i = 0; i < 2; i++) {
          if (this.drawCardEndOfTurn()) {
            cardsDrawn++;
          }
        }
        return cardsDrawn > 0; // Retourne true si au moins une carte a été piochée

      case 'explosion':
        // Infliger 2 dégâts à tous les ennemis
        this.gameState.enemies.forEach(enemy => {
          if (enemy.currentHp > 0) {
            this.dealDamageToEnemy(2, enemy);
            this.addDamageFloater(2, enemy.id, 'critical');
          }
        });
        
        // Infliger 1 dégât à toutes les unités du joueur
        this.gameState.cardsInPlay.forEach(card => {
          if (card.currentHp !== undefined && card.currentHp > 0) {
            this.dealDamage(1, card);
            this.addDamageFloater(1, card.id!);
          }
        });
        
        // Nettoyer les ennemis morts
        this.gameState.enemies = this.gameState.enemies.filter(enemy => enemy.currentHp > 0);
        
        // Nettoyer les unités mortes
        this.gameState.cardsInPlay = this.gameState.cardsInPlay.filter(card => 
          card.currentHp !== undefined && card.currentHp > 0
        );
        
        // Vérifier si tous les ennemis sont morts pour finir automatiquement le tour
        this.checkForAutoEndTurn();
        
        return true;

      default:
        return false;
    }
  }

  // Nouvelle mécanique: pioche en fin de tour
  drawCardEndOfTurn(): boolean {
    const deck = this.cardService.getDeck();
    const handSize = this.gameState.playerHand.length;
    
    if (handSize >= 10) {
      this.addNotification("Main pleine ! Impossible de piocher plus de cartes.");
      return false;
    }
    
    if (deck.length === 0) {
      this.addNotification("Aucune carte disponible dans le deck !");
      return false;
    }
    
    // Obtenir les IDs des cartes déjà en main
    const cardsInHand = this.gameState.playerHand.map(card => card.id);
    
    // Filtrer le deck pour exclure les cartes déjà en main
    const availableCards = deck.filter(card => !cardsInHand.includes(card.id));
    
    if (availableCards.length === 0) {
      this.addNotification("Toutes les cartes disponibles sont déjà dans votre main !");
      return false;
    }
    
    // Piocher une carte parmi celles disponibles
    const randomIndex = Math.floor(Math.random() * availableCards.length);
    const baseCard = availableCards[randomIndex];
    
    // Initialiser proprement la carte pour le jeu
    const drawnCard = this.initializeCardForGame(baseCard);
    
    this.gameState.playerHand.push(drawnCard);
    this.addNotification(`Carte piochée : ${drawnCard.name}`);
    this.updateGameState();
    return true;
  }

  // Nouvelle mécanique: attaque manuelle d'une unité spécifique
  attackWithUnit(unitIndex: number, targetIndex?: number): boolean {
    const unit = this.gameState.cardsInPlay[unitIndex];
    
    if (!unit || !unit.currentHp || unit.currentHp <= 0 || 
        !unit.attack || unit.hasAttackedThisTurn || 
        unit.canAttackThisTurn === false) {
      return false;
    }

    if (this.gameState.enemies.length === 0) {
      return false;
    }

    // Si pas de cible spécifiée, demander la sélection
    if (targetIndex === undefined) {
      this.awaitingAttackTarget = { unitIndex };
      this.updateGameState();
      return false; // En attente de sélection de cible
    }

    // Vérifier que la cible est valide
    if (!this.gameState.enemies[targetIndex] || this.gameState.enemies[targetIndex].currentHp <= 0) {
      return false;
    }

    const target = this.gameState.enemies[targetIndex];

    // Afficher l'animation d'attaque du joueur
    this.showAttackAnimation(unit.id!, target.id, this.calculateAttackDamage(unit), 'card-to-enemy');

    // Effectuer l'attaque après un délai pour l'animation
    setTimeout(() => {
      const finalDamage = this.calculateAttackDamage(unit);
      this.dealDamageToEnemy(finalDamage, target);
      unit.hasAttackedThisTurn = true;

      // Ajouter une bulle de dégâts
      this.addDamageFloater(finalDamage, target.id);

      // Nettoyer les ennemis morts
      this.gameState.enemies = this.gameState.enemies.filter(enemy => enemy.currentHp > 0);
      
      // Réinitialiser la sélection d'attaque
      this.awaitingAttackTarget = null;
      
      this.updateGameState();
      
      // Vérifier si tous les ennemis sont morts pour finir automatiquement le tour
      this.checkForAutoEndTurn();
    }, 400);
    
    return true;
  }

  selectAttackTarget(enemyIndex: number): boolean {
    if (!this.awaitingAttackTarget) return false;
    
    return this.attackWithUnit(this.awaitingAttackTarget.unitIndex, enemyIndex);
  }

  cancelAttackSelection(): void {
    this.awaitingAttackTarget = null;
    this.updateGameState();
  }

  // Nouvelle phase: fin de tour du joueur
  endPlayerTurn(): void {
    // Le maxMana reste toujours à 10
    // Récupérer 1 de mana (jusqu'au maximum de 10)
    this.gameState.mana = Math.min(this.gameState.mana + 1, this.gameState.maxMana);

    // Génération de mana par les Puits de Mana vivants
    const manaWells = this.gameState.cardsInPlay.filter(card => 
      card.id === 'mana-well' && card.currentHp !== undefined && card.currentHp > 0
    );
    
    if (manaWells.length > 0) {
      const bonusMana = manaWells.length;
      this.gameState.mana = Math.min(this.gameState.mana + bonusMana, this.gameState.maxMana);
      this.addNotification(`Puits de Mana : +${bonusMana} mana généré !`);
    }

    // Piocher automatiquement une carte à la fin du tour
    this.drawCardEndOfTurn();

    // Réinitialiser les attaques des unités
    this.gameState.cardsInPlay.forEach(card => {
      card.hasAttackedThisTurn = false;
      // Le Puits de Mana ne peut jamais attaquer
      card.canAttackThisTurn = card.id !== 'mana-well';
    });

    // Réinitialiser les attaques des ennemis
    this.gameState.enemies.forEach(enemy => {
      enemy.hasAttackedThisTurn = false;
    });

    // Passer à la phase d'attaque des ennemis
    this.gameState.gamePhase = 'enemy';
    this.enemyTurn();
  }

  private enemyTurn(): void {
    // Phase 1: Application des capacités spéciales (soigneurs)
    this.gameState.enemies.forEach(enemy => {
      if (enemy.currentHp > 0 && enemy.specialAbility === 'heal-allies') {
        // Le soigneur soigne tous les autres ennemis vivants de +1 HP
        this.gameState.enemies.forEach(ally => {
          if (ally !== enemy && ally.currentHp > 0) {
            // Le HP maximum est stocké dans enemy.hp
            if (ally.currentHp < ally.hp) {
              ally.currentHp = Math.min(ally.currentHp + 1, ally.hp);
            }
          }
        });
      }
    });
    
    // Phase 2: Les ennemis attaquent (une seule fois chacun) avec animations
    let attackDelay = 0;
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.hasAttackedThisTurn) {
        // Vérifier si l'ennemi est étourdi
        const isStunned = enemy.temporaryEffects?.some(effect => 
          effect.type === 'stun' && effect.stunned
        );
        
        if (!isStunned) {
          setTimeout(() => {
            const aliveTargets = this.gameState.cardsInPlay.filter(card => 
              card.currentHp !== undefined && card.currentHp > 0
            );
            
            if (aliveTargets.length > 0) {
              // Vérifier s'il y a des unités avec Provoque
              const tauntTargets = aliveTargets.filter(card => 
                card.effect === 'Provoque'
              );
              
              // Si il y a des unités avec Provoque, attaquer l'une d'elles en priorité
              const targetPool = tauntTargets.length > 0 ? tauntTargets : aliveTargets;
              const target = targetPool[Math.floor(Math.random() * targetPool.length)];
              
              // Afficher l'animation d'attaque
              this.showAttackAnimation(enemy.id, target.id!, enemy.attack, 'enemy-to-card');
              
              // Appliquer les dégâts après un court délai pour l'animation
              setTimeout(() => {
                this.dealDamage(enemy.attack, target);
                
                // Ajouter une bulle de dégâts flottante (position approximative)
                this.addDamageFloater(enemy.attack, target.id!);
                
                // Appliquer l'effet spécial du Saccageur (destruction d'armure)
                if (enemy.specialAbility === 'armor-break' && target.currentDefense && target.currentDefense > 0) {
                  const armorBreakEffect = {
                    type: 'armor-break',
                    duration: -1, // Permanent jusqu'à la mort
                    armorDestroyed: true,
                    description: 'Armure détruite'
                  };
                  
                  // Appliquer l'effet avec le système générique
                  this.applyGenericEffect(target, 'armor-break', armorBreakEffect);
                }
                
                // Nettoyer les unités mortes après l'attaque
                this.gameState.cardsInPlay = this.gameState.cardsInPlay.filter(card => 
                  card.currentHp !== undefined && card.currentHp > 0
                );
                this.updateGameState();
              }, 400);
              
            } else {
              // Aucune unité en vie, attaquer le joueur directement
              this.showAttackAnimation(enemy.id, 'player', enemy.attack, 'enemy-to-player');
              
              setTimeout(() => {
                this.dealDamageToPlayer(enemy.attack);
                
                // Ajouter une bulle de dégâts sur le joueur
                this.addDamageFloater(enemy.attack, 'player');
                this.updateGameState();
              }, 400);
            }
          }, attackDelay);
          
          attackDelay += 600; // Délai entre chaque attaque d'ennemi
        }
        enemy.hasAttackedThisTurn = true;
      }
    });

    // Attendre que toutes les animations soient terminées avant de continuer
    setTimeout(() => {
      // Nettoyer les ennemis morts
      this.gameState.enemies = this.gameState.enemies.filter(enemy => 
        enemy.currentHp > 0
      );

      // Gérer les effets temporaires
      this.processTemporaryEffects();

      // Vérifier les conditions de fin
      this.checkGameConditions();
    }, attackDelay + 1000);
  }

  private checkGameConditions(): void {
    const aliveEnemies = this.gameState.enemies.filter(enemy => enemy.currentHp > 0);
    const aliveUnits = this.gameState.cardsInPlay.filter(unit => unit.currentHp !== undefined && unit.currentHp > 0);
    
    // Vérifier d'abord si le joueur est mort
    if (this.gameState.playerHp <= 0) {
      this.gameState.gamePhase = 'defeat';
    } else if (aliveEnemies.length === 0) {
      // Vague terminée
      this.gameState.currentWave++;
      
      if (this.gameState.currentWave > this.gameState.totalWavesInFloor) {
        // Étage terminé - débloquer le prochain étage
        this.cardService.unlockFloor(this.gameState.currentFloor + 1);
        this.gameState.gamePhase = 'victory';
        // Récompense d'or progressive pour étages infinis
        const baseReward = this.calculateGoldReward(this.gameState.currentFloor);
        this.goldService.addGold(baseReward);
      } else {
        // Prochaine vague
        this.spawnEnemies();
        this.gameState.gamePhase = 'player';
        // Ne pas remettre le mana à 10, garder le mana actuel
      }
    } else {
      // Continuer le combat - retour à la phase joueur
      this.gameState.gamePhase = 'player';
      // Ne pas remettre le mana à 10, garder le mana actuel
    }

    this.updateGameState();
  }

  // Nouvelle méthode pour vérifier si tous les ennemis sont morts pendant le tour du joueur
  private checkForAutoEndTurn(): void {
    if (this.gameState.gamePhase === 'player') {
      const aliveEnemies = this.gameState.enemies.filter(enemy => enemy.currentHp > 0);
      
      if (aliveEnemies.length === 0) {
        // Tous les ennemis sont morts, finir automatiquement le tour
        setTimeout(() => {
          this.endPlayerTurn();
        }, 1000); // Petit délai pour que le joueur voie ce qui s'est passé
      }
    }
  }

  // Calculer les dégâts d'attaque en tenant compte des effets temporaires
  private calculateAttackDamage(unit: Card): number {
    let baseDamage = unit.attack || 0;
    
    // Appliquer les effets temporaires
    if (unit.temporaryEffects) {
      unit.temporaryEffects.forEach(effect => {
        if (effect.type === 'rage-boost' && effect.attackMultiplier) {
          baseDamage *= effect.attackMultiplier;
        } else if (effect.type === 'arsenal' && effect.attackBonus) {
          baseDamage += effect.attackBonus;
        }
      });
    }
    
    return baseDamage;
  }

  // Nouvelle méthode pour gérer les dégâts avec système de défense
  private dealDamage(damage: number, target: Card): void {
    // Vérifier si la cible est invulnérable
    if (target.temporaryEffects) {
      const invulnerable = target.temporaryEffects.some(effect => 
        effect.type === 'divine-protection' && effect.invulnerable
      );
      if (invulnerable) {
        return; // Pas de dégâts si invulnérable
      }
    }

    if (target.currentDefense !== undefined && target.currentDefense > 0) {
      // La défense absorbe les dégâts mais ne diminue pas
      const damageBlocked = Math.min(damage, target.currentDefense);
      const remainingDamage = damage - damageBlocked;
      
      if (remainingDamage > 0 && target.currentHp !== undefined) {
        target.currentHp -= remainingDamage;
      }
    } else if (target.currentHp !== undefined) {
      // Pas de défense, dégâts directs
      target.currentHp -= damage;
    }
    
    // Gérer la mort si les PV descendent à 0 ou moins
    if (target.currentHp !== undefined && target.currentHp <= 0) {
      target.currentHp = 0;
      this.handleUnitDeath(target);
    }
  }

  // Nouvelle méthode pour gérer les dégâts aux ennemis
  private dealDamageToEnemy(damage: number, target: Enemy): void {
    if (target.currentDefense !== undefined && target.currentDefense > 0) {
      // La défense absorbe les dégâts mais ne diminue pas
      const damageBlocked = Math.min(damage, target.currentDefense);
      const remainingDamage = damage - damageBlocked;
      
      if (remainingDamage > 0) {
        target.currentHp -= remainingDamage;
      }
    } else {
      // Pas de défense, dégâts directs
      target.currentHp -= damage;
    }
    
    // Gérer la mort si les PV descendent à 0 ou moins
    if (target.currentHp <= 0) {
      target.currentHp = 0;
      this.handleEnemyDeath(target);
    }
  }

  // Nouvelle méthode pour gérer les dégâts au joueur
  private dealDamageToPlayer(damage: number): void {
    this.gameState.playerHp -= damage;
    
    // S'assurer que les PV ne descendent pas en dessous de 0
    if (this.gameState.playerHp < 0) {
      this.gameState.playerHp = 0;
    }
    
    console.log(`Le joueur subit ${damage} dégâts ! PV: ${this.gameState.playerHp}/${this.gameState.maxPlayerHp}`);
  }

  private handleUnitDeath(unit: Card): void {
    // Marquer l'unité comme morte
    unit.currentHp = 0;
    
    // Retirer l'unité du terrain (optionnel - on peut la laisser affichée comme morte)
    // Ou bien on peut simplement la marquer comme morte et laisser l'affichage gérer l'apparence
    
    // Déclencher des effets de mort si nécessaire
    console.log(`L'unité ${unit.name} est morte !`);
  }

  private handleEnemyDeath(enemy: Enemy): void {
    // Marquer l'ennemi comme mort
    enemy.currentHp = 0;
    
    // Donner de l'or au joueur pour avoir tué un ennemi
    const goldReward = Math.floor(enemy.hp * 0.5) + 5; // Récompense basée sur les PV max
    this.goldService.addGold(goldReward);
    
    // Vérifier si le joueur a des Démonistes en vie pour invoquer des squelettes
    this.gameState.cardsInPlay.forEach(card => {
      if (card.id === 'demonist' && card.currentHp !== undefined && card.currentHp > 0) {
        this.summonSkeleton();
      }
    });
    
    console.log(`L'ennemi ${enemy.name} est mort ! +${goldReward} or`);
  }

  // Méthode pour invoquer un squelette via le Démoniste
  private summonSkeleton(): void {
    // Vérifier s'il y a de la place sur le terrain
    if (this.gameState.cardsInPlay.length >= this.gameState.maxSlots) {
      this.addNotification("Terrain plein ! Impossible d'invoquer un squelette.");
      return;
    }
    
    // Créer un squelette
    const skeleton: Card = {
      id: `skeleton-${Date.now()}-${Math.random()}`,
      name: 'Squelette',
      type: 'unit',
      cost: 0,
      hp: 1,
      attack: 1,
      defense: 0,
      effect: 'Invoqué par Démoniste',
      rarity: 'normal',
      price: 0,
      currentHp: 1,
      currentDefense: 0,
      canAttackThisTurn: true,
      hasAttackedThisTurn: false,
      temporaryEffects: []
    };
    
    // Ajouter le squelette au terrain
    this.gameState.cardsInPlay.push(skeleton);
    this.addNotification("Un squelette a été invoqué !");
    this.updateGameState();
  }

  private processTemporaryEffects(): void {
    // Traiter les effets temporaires sur les unités du joueur
    this.gameState.cardsInPlay.forEach(card => {
      if (card.temporaryEffects) {
        // Appliquer les effets de poison, etc.
        card.temporaryEffects.forEach(effect => {
          if (effect.type === 'poison' && effect.poisonDamage) {
            // Le poison n'affecte pas les unités du joueur directement
          }
        });

        // Décrémenter la durée et supprimer les effets expirés
        card.temporaryEffects = card.temporaryEffects.filter(effect => {
          if (effect.duration > 0) {
            effect.duration--;
            return effect.duration > 0;
          }
          return effect.duration === -1; // Garder les effets permanents
        });
      }
    });

    // Traiter les effets temporaires sur les ennemis
    this.gameState.enemies.forEach(enemy => {
      if (enemy.temporaryEffects) {
        // Appliquer les effets spéciaux
        enemy.temporaryEffects.forEach(effect => {
          if (effect.type === 'poison' && effect.poisonDamage) {
            // Appliquer les dégâts de poison
            this.dealDamageToEnemy(effect.poisonDamage, enemy);
          }
        });

        // Décrémenter la durée et supprimer les effets expirés
        enemy.temporaryEffects = enemy.temporaryEffects.filter(effect => {
          if (effect.duration > 0) {
            effect.duration--;
            return effect.duration > 0;
          }
          return effect.duration === -1; // Garder les effets permanents
        });
      }
    });

    // Nettoyer les ennemis morts après les effets de poison
    this.gameState.enemies = this.gameState.enemies.filter(enemy => enemy.currentHp > 0);
  }

  nextFloor(): void {
    this.startNewFloor();
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private updateGameState(): void {
    this.gameState$.next({ ...this.gameState });
  }

  // Vérifier si une unité peut attaquer
  canUnitAttack(unitIndex: number): boolean {
    const unit = this.gameState.cardsInPlay[unitIndex];
    
    // Le Puits de Mana ne peut jamais attaquer
    if (unit && unit.id === 'mana-well') {
      return false;
    }
    
    return !!(unit && unit.currentHp && unit.currentHp > 0 && 
              unit.attack && !unit.hasAttackedThisTurn && 
              unit.canAttackThisTurn !== false && 
              this.gameState.enemies.length > 0);
  }

  // Reset complet de toute la progression du jeu
  resetAllProgress(): void {
    // Reset des services
    this.cardService.resetAllProgress();
    this.goldService.resetGoldCompletely();
    
    // Reset de l'état du jeu
    this.resetGameState(1);
    
    // Notification à l'utilisateur
    this.addNotification("Toute la progression a été réinitialisée !");
    
    console.log("Reset complet effectué - Toutes les données ont été supprimées");
  }

  // Calcul de la récompense d'or avec progression infinie équilibrée
  private calculateGoldReward(floor: number): number {
    if (floor <= 5) {
      // Étages débutants : récompense linéaire
      return 25 + floor * 15; // 40, 55, 70, 85, 100
    }
    
    if (floor <= 20) {
      // Étages intermédiaires : progression modérée
      return 100 + (floor - 5) * 10; // 110, 120, 130... jusqu'à 250
    }
    
    if (floor <= 50) {
      // Étages avancés : progression logarithmique
      return 250 + Math.floor((floor - 20) * 8); // 258, 266, 274... jusqu'à 490
    }
    
    // Étages très élevés (50+) : progression logarithmique lente pour éviter l'inflation
    const baseHigh = 490;
    const bonus = Math.floor(Math.log10(floor - 49) * 50);
    return baseHigh + bonus; // Progression très lente aux étages extrêmes
  }

  // Gestion des notifications
  private addNotification(message: string): void {
    if (!this.gameState.notifications) {
      this.gameState.notifications = [];
    }
    this.gameState.notifications.push(message);
    
    // Auto-suppression des notifications après 3 secondes
    setTimeout(() => {
      if (this.gameState.notifications) {
        const index = this.gameState.notifications.indexOf(message);
        if (index > -1) {
          this.gameState.notifications.splice(index, 1);
          this.updateGameState();
        }
      }
    }, 3000);
  }

  clearNotifications(): void {
    this.gameState.notifications = [];
    this.updateGameState();
  }

  // Gestion des animations d'attaque et bulles de dégâts
  private showAttackAnimation(attackerId: string, targetId: string, damage: number, type: 'enemy-to-player' | 'enemy-to-card' | 'card-to-enemy'): void {
    this.gameState.currentAttack = {
      attackerId,
      targetId,
      damage,
      type
    };
    this.updateGameState();
    
    // Supprimer l'animation après 800ms
    setTimeout(() => {
      this.gameState.currentAttack = undefined;
      this.updateGameState();
    }, 800);
  }

  private addDamageFloater(damage: number, targetId: string, type: 'damage' | 'healing' | 'critical' = 'damage'): void {
    if (!this.gameState.damageFloaters) {
      this.gameState.damageFloaters = [];
    }
    
    const floater = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      damage,
      x: 0, // Position sera calculée côté composant
      y: 0, // Position sera calculée côté composant
      targetId, // ID de la cible pour calculer la position
      timestamp: Date.now(),
      type // Ajouter le type pour le style CSS
    };
    
    this.gameState.damageFloaters.push(floater as any);
    this.updateGameState();
    
    // Supprimer le floater après 1.5 secondes
    setTimeout(() => {
      if (this.gameState.damageFloaters) {
        const index = this.gameState.damageFloaters.findIndex(f => f.id === floater.id);
        if (index > -1) {
          this.gameState.damageFloaters.splice(index, 1);
          this.updateGameState();
        }
      }
    }, 1500);
  }
}
