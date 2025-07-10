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
    gamePhase: 'draw'
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
      totalWavesInFloor: Math.min(2 + Math.floor(floor / 3), 5), // Plus de vagues aux étages élevés
      mana: 1, // Commencer avec 1 mana
      maxMana: 10, // Mana maximum toujours 10
      playerHp: 10, // PV par défaut du joueur
      maxPlayerHp: 10, // PV maximum du joueur
      playerHand: [],
      cardsInPlay: [],
      enemies: [],
      maxSlots: 6,
      gamePhase: 'draw'
    };
    this.updateGameState();
  }

  private startNewFloor(): void {
    this.gameState.currentWave = 1;
    // Progression plus graduelle des vagues par étage
    this.gameState.totalWavesInFloor = Math.min(2 + Math.floor(this.gameState.currentFloor / 3), 4);
    this.gameState.cardsInPlay = [];
    // Remettre le mana à 10 uniquement au début d'un nouvel étage
    this.gameState.mana = 10;
    this.gameState.maxMana = 10;
    this.drawInitialHand();
    this.spawnEnemies();
    this.gameState.gamePhase = 'player';
    this.updateGameState();
  }

  private drawInitialHand(): void {
    const deck = this.cardService.getDeck();
    this.gameState.playerHand = this.shuffleArray([...deck]).slice(0, 5);
  }

  private spawnEnemies(): void {
    const enemyTemplates = [
      { id: 'goblin', name: 'Gobelin', hp: 2, attack: 1 }, // Plus faible pour le début
      { id: 'orc', name: 'Orc', hp: 4, attack: 2 },
      { id: 'troll', name: 'Troll', hp: 6, attack: 3 }
    ];

    // Progression plus graduelle du nombre d'ennemis
    let enemyCount = 1; // Commencer avec 1 seul ennemi
    if (this.gameState.currentFloor >= 2) {
      enemyCount = 1 + Math.floor(this.gameState.currentFloor / 2);
    }
    if (this.gameState.currentFloor >= 4) {
      enemyCount = 2 + Math.floor((this.gameState.currentFloor - 4) / 3);
    }
    enemyCount = Math.min(enemyCount, 4); // Maximum 4 ennemis

    this.gameState.enemies = [];

    for (let i = 0; i < enemyCount; i++) {
      // Pour les premiers étages, privilégier les ennemis plus faibles
      let templateIndex;
      if (this.gameState.currentFloor === 1) {
        templateIndex = 0; // Seulement des gobelins à l'étage 1
      } else if (this.gameState.currentFloor <= 3) {
        templateIndex = Math.random() < 0.7 ? 0 : 1; // Majoritairement gobelins et quelques orcs
      } else {
        templateIndex = Math.floor(Math.random() * enemyTemplates.length);
      }
      
      const template = enemyTemplates[templateIndex];
      
      // Scaling progressif des stats des ennemis
      const floorMultiplier = 1 + (this.gameState.currentFloor - 1) * 0.3;
      const enemy: Enemy = {
        ...template,
        id: `${template.id}-${i}`,
        hp: Math.ceil(template.hp * floorMultiplier),
        attack: Math.ceil(template.attack * floorMultiplier),
        currentHp: Math.ceil(template.hp * floorMultiplier)
      };
      this.gameState.enemies.push(enemy);
    }
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
      
      this.gameState.cardsInPlay.push({
        ...card,
        currentHp: card.hp,
        currentDefense: card.defense || 0
      });

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
            return true;
          }
        }
        return false;

      case 'fireball':
        if (targetEnemyIndex !== undefined && this.gameState.enemies[targetEnemyIndex]) {
          const target = this.gameState.enemies[targetEnemyIndex];
          const damage = 3;
          this.dealDamageToEnemy(damage, target);
          
          // Nettoyer les ennemis morts après le sort
          this.gameState.enemies = this.gameState.enemies.filter(enemy => enemy.currentHp > 0);
          
          // Vérifier si tous les ennemis sont morts pour finir automatiquement le tour
          this.checkForAutoEndTurn();
          
          return true;
        }
        return false;

      case 'shield-boost':
        if (targetCardIndex !== undefined && this.gameState.cardsInPlay[targetCardIndex]) {
          const target = this.gameState.cardsInPlay[targetCardIndex];
          if (target.currentDefense !== undefined) {
            const defenseBonus = 2;
            target.currentDefense += defenseBonus;
            return true;
          }
        }
        return false;

      case 'mana-crystal':
        // Donner 1 mana
        const manaGain = 1;
        this.gameState.mana = Math.min(this.gameState.mana + manaGain, this.gameState.maxMana);
        return true;

      case 'rage-boost':
        if (targetCardIndex !== undefined && this.gameState.cardsInPlay[targetCardIndex]) {
          const target = this.gameState.cardsInPlay[targetCardIndex];
          
          // Initialiser le tableau d'effets temporaires si nécessaire
          if (!target.temporaryEffects) {
            target.temporaryEffects = [];
          }
          
          // Ajouter l'effet de rage
          target.temporaryEffects.push({
            type: 'rage-boost',
            duration: 2,
            attackMultiplier: 2,
            description: 'Dégâts doublés'
          });
          
          return true;
        }
        return false;

      case 'arsenal':
        if (targetCardIndex !== undefined && this.gameState.cardsInPlay[targetCardIndex]) {
          const target = this.gameState.cardsInPlay[targetCardIndex];
          
          // Initialiser le tableau d'effets temporaires si nécessaire
          if (!target.temporaryEffects) {
            target.temporaryEffects = [];
          }
          
          // Ajouter l'effet d'arsenal (permanent)
          target.temporaryEffects.push({
            type: 'arsenal',
            duration: -1, // Permanent jusqu'à la mort
            attackBonus: 2,
            description: '+2 Attaque permanent'
          });
          
          return true;
        }
        return false;

      case 'stun-bolt':
        if (targetEnemyIndex !== undefined && this.gameState.enemies[targetEnemyIndex]) {
          const target = this.gameState.enemies[targetEnemyIndex];
          
          // Initialiser le tableau d'effets temporaires si nécessaire
          if (!target.temporaryEffects) {
            target.temporaryEffects = [];
          }
          
          // Ajouter l'effet d'étourdissement
          target.temporaryEffects.push({
            type: 'stun',
            duration: 2,
            stunned: true,
            description: 'Étourdi'
          });
          
          return true;
        }
        return false;

      case 'divine-protection':
        if (targetCardIndex !== undefined && this.gameState.cardsInPlay[targetCardIndex]) {
          const target = this.gameState.cardsInPlay[targetCardIndex];
          
          // Initialiser le tableau d'effets temporaires si nécessaire
          if (!target.temporaryEffects) {
            target.temporaryEffects = [];
          }
          
          // Ajouter l'effet d'invulnérabilité
          target.temporaryEffects.push({
            type: 'invulnerable',
            duration: 1,
            invulnerable: true,
            description: 'Invulnérable'
          });
          
          return true;
        }
        return false;

      case 'poison':
        if (targetEnemyIndex !== undefined && this.gameState.enemies[targetEnemyIndex]) {
          const target = this.gameState.enemies[targetEnemyIndex];
          
          // Initialiser le tableau d'effets temporaires si nécessaire
          if (!target.temporaryEffects) {
            target.temporaryEffects = [];
          }
          
          // Ajouter l'effet de poison
          target.temporaryEffects.push({
            type: 'poison',
            duration: -1, // Jusqu'à la mort
            poisonDamage: 1,
            description: 'Empoisonné (1 dégât/tour)'
          });
          
          return true;
        }
        return false;

      default:
        return false;
    }
  }

  // Nouvelle mécanique: pioche en fin de tour
  drawCardEndOfTurn(): boolean {
    const deck = this.cardService.getDeck();
    const handSize = this.gameState.playerHand.length;
    
    if (handSize < 10 && deck.length > 0) { // Limite de 10 cartes en main
      const randomIndex = Math.floor(Math.random() * deck.length);
      const drawnCard = { ...deck[randomIndex] };
      
      // Initialiser les propriétés de jeu
      drawnCard.currentHp = drawnCard.hp;
      drawnCard.currentDefense = drawnCard.defense || 0;
      drawnCard.canAttackThisTurn = true;
      drawnCard.hasAttackedThisTurn = false;
      
      this.gameState.playerHand.push(drawnCard);
      this.updateGameState();
      return true;
    }
    return false;
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

    // Effectuer l'attaque
    const finalDamage = this.calculateAttackDamage(unit);
    this.dealDamageToEnemy(finalDamage, target);
    unit.hasAttackedThisTurn = true;

    // Nettoyer les ennemis morts
    this.gameState.enemies = this.gameState.enemies.filter(enemy => enemy.currentHp > 0);
    
    // Réinitialiser la sélection d'attaque
    this.awaitingAttackTarget = null;
    
    this.updateGameState();
    
    // Vérifier si tous les ennemis sont morts pour finir automatiquement le tour
    this.checkForAutoEndTurn();
    
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
    // Récupérer 1 de mana (jusqu'au maximum de 10)
    this.gameState.mana = Math.min(this.gameState.mana + 1, this.gameState.maxMana);

    // Piocher automatiquement une carte à la fin du tour
    this.drawCardEndOfTurn();

    // Réinitialiser les attaques des unités
    this.gameState.cardsInPlay.forEach(card => {
      card.hasAttackedThisTurn = false;
      card.canAttackThisTurn = true;
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
    // Les ennemis attaquent (une seule fois chacun)
    this.gameState.enemies.forEach(enemy => {
      if (!enemy.hasAttackedThisTurn) {
        // Vérifier si l'ennemi est étourdi
        const isStunned = enemy.temporaryEffects?.some(effect => 
          effect.type === 'stun' && effect.stunned
        );
        
        if (!isStunned) {
          const aliveTargets = this.gameState.cardsInPlay.filter(card => 
            card.currentHp !== undefined && card.currentHp > 0
          );
          
          if (aliveTargets.length > 0) {
            // Attaquer une unité aléatoire
            const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
            this.dealDamage(enemy.attack, target);
          } else {
            // Aucune unité en vie, attaquer le joueur directement
            this.dealDamageToPlayer(enemy.attack);
          }
        }
        enemy.hasAttackedThisTurn = true;
      }
    });

    // Nettoyer les unités mortes
    this.gameState.cardsInPlay = this.gameState.cardsInPlay.filter(card => 
      card.currentHp !== undefined && card.currentHp > 0
    );

    // Nettoyer les ennemis morts
    this.gameState.enemies = this.gameState.enemies.filter(enemy => 
      enemy.currentHp > 0
    );

    // Gérer les effets temporaires
    this.processTemporaryEffects();

    // Vérifier les conditions de fin
    this.checkGameConditions();
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
        // Récompense d'or progressive
        const baseReward = 25 + this.gameState.currentFloor * 15;
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
        effect.type === 'invulnerable' && effect.invulnerable
      );
      if (invulnerable) {
        return; // Pas de dégâts si invulnérable
      }
    }

    if (target.currentDefense !== undefined && target.currentDefense > 0) {
      // La défense absorbe les dégâts
      const damageBlocked = Math.min(damage, target.currentDefense);
      target.currentDefense -= damageBlocked;
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
      // La défense absorbe les dégâts
      const damageBlocked = Math.min(damage, target.currentDefense);
      target.currentDefense -= damageBlocked;
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
    
    console.log(`L'ennemi ${enemy.name} est mort ! +${goldReward} or`);
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
    return !!(unit && unit.currentHp && unit.currentHp > 0 && 
              unit.attack && !unit.hasAttackedThisTurn && 
              unit.canAttackThisTurn !== false && 
              this.gameState.enemies.length > 0);
  }
}
