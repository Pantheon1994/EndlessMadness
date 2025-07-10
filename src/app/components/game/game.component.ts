import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { GoldService } from '../../services/gold.service';
import { GameState } from '../../models/game-state.interface';
import { Card } from '../../models/card.interface';
import { Enemy } from '../../models/enemy.interface';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  gameState$: Observable<GameState>;
  currentGold = 0;
  awaitingTarget: { cardIndex: number, card: Card } | null = null;
  awaitingAttackTarget: { unitIndex: number } | null = null;
  private goldSubscription?: Subscription;
  private gameStateSubscription?: Subscription;

  constructor(
    private gameService: GameService,
    private goldService: GoldService,
    private router: Router
  ) {
    this.gameState$ = this.gameService.getGameState();
  }

  ngOnInit(): void {
    this.updateGold();
    // Le jeu est déjà démarré depuis le menu, pas besoin de le redémarrer
    
    // S'abonner aux changements d'état pour détecter les demandes de cible
    this.gameStateSubscription = this.gameState$.subscribe((gameState) => {
      this.awaitingTarget = this.gameService.getAwaitingTarget();
      this.awaitingAttackTarget = this.gameService.getAwaitingAttackTarget();
      
      // Déclencher automatiquement les effets visuels
      if (gameState) {
        this.handleGameStateEffects(gameState);
      }
    });

    // Méthodes pour améliorer l'UX mobile
    this.addMobileUXEnhancements();
  }

  ngOnDestroy(): void {
    if (this.goldSubscription) {
      this.goldSubscription.unsubscribe();
    }
    if (this.gameStateSubscription) {
      this.gameStateSubscription.unsubscribe();
    }
  }

  private updateGold(): void {
    this.currentGold = this.goldService.getGold();
  }

  playCard(cardIndex: number): void {
    // Déclencher l'animation de carte jouée
    const cardElement = document.querySelector(`.hand .card:nth-child(${cardIndex + 1})`) as HTMLElement;
    if (cardElement) {
      this.playCardAnimation(cardElement);
    }
    
    // Vérifier si c'est un cristal de mana pour l'animation spéciale
    this.gameState$.subscribe(gameState => {
      const card = gameState.playerHand[cardIndex];
      if (card && card.id === 'mana-crystal') {
        this.animateManaGain();
      }
    }).unsubscribe();
    
    if (this.gameService.playCard(cardIndex)) {
      this.updateGold();
    }
  }

  attackWithUnit(unitIndex: number): void {
    if (this.gameService.canUnitAttack(unitIndex)) {
      // Cela va maintenant demander la sélection de cible
      this.gameService.attackWithUnit(unitIndex);
      this.updateGold();
    }
  }

  selectAttackTarget(enemyIndex: number): void {
    if (this.awaitingAttackTarget) {
      const unitIndex = this.awaitingAttackTarget.unitIndex;
      
      // Déclencher l'animation d'attaque
      const unitElement = document.querySelector(`.player-field .card:nth-child(${unitIndex + 1})`) as HTMLElement;
      const enemyElement = document.querySelector(`.enemies .enemy:nth-child(${enemyIndex + 1})`) as HTMLElement;
      
      if (unitElement && enemyElement) {
        this.playAttackAnimation(unitElement, enemyElement);
      }
      
      if (this.gameService.selectAttackTarget(enemyIndex)) {
        this.updateGold();
        this.awaitingAttackTarget = null;
        
        // Vérifier si l'ennemi est mort et déclencher l'effet approprié
        setTimeout(() => {
          this.checkForVictoryEffects();
        }, 800);
      }
    }
  }

  cancelAttackSelection(): void {
    this.gameService.cancelAttackSelection();
    this.awaitingAttackTarget = null;
  }

  canUnitAttack(unitIndex: number): boolean {
    return this.gameService.canUnitAttack(unitIndex);
  }

  endTurn(): void {
    // Petit effet visuel pour la fin de tour
    const gameContainer = document.querySelector('.game-container') as HTMLElement;
    if (gameContainer) {
      gameContainer.classList.add('screen-shake');
      setTimeout(() => gameContainer.classList.remove('screen-shake'), 500);
    }
    
    // Animation du changement de mana
    this.animateManaChange();
    
    this.gameService.endPlayerTurn();
    this.updateGold();
    
    // Animer les nouvelles cartes piochées
    setTimeout(() => {
      const handCards = document.querySelectorAll('.hand .card');
      if (handCards.length > 0) {
        const lastCard = handCards[handCards.length - 1] as HTMLElement;
        this.animateNewCard(lastCard);
      }
    }, 600);
  }

  nextFloor(): void {
    // Effet de victoire avant de passer à l'étage suivant
    this.createVictoryEffect();
    this.showFloorTransition();
    
    // Bonus d'or pour la montée d'étage
    const floorBonus = 50;
    this.showGoldBonus(floorBonus);
    
    // Ajouter un petit délai pour que l'effet soit visible
    setTimeout(() => {
      this.gameService.nextFloor();
      this.updateGold();
    }, 1000);
  }

  returnToMenu(): void {
    this.router.navigate(['/menu']);
  }

  getCardClass(card: Card): string {
    let classes = 'card';
    if (card.currentHp && card.currentHp <= 0) classes += ' dead';
    
    // Ajouter des classes pour les effets temporaires
    if (card.temporaryEffects) {
      card.temporaryEffects.forEach(effect => {
        classes += ` effect-${effect.type}`;
      });
    }
    
    return classes;
  }

  getEnemyClass(enemy: Enemy): string {
    let classes = 'enemy';
    if (enemy.currentHp <= 0) classes += ' dead';
    return classes;
  }

  selectCardTarget(cardIndex: number): void {
    if (this.awaitingTarget) {
      const spellCard = this.awaitingTarget.card;
      const targetElement = document.querySelector(`.player-field .card:nth-child(${cardIndex + 1})`) as HTMLElement;
      
      // Déclencher l'animation appropriée selon le sort
      if (targetElement) {
        if (spellCard.id === 'healing-potion') {
          this.playHealAnimation(targetElement);
        } else if (spellCard.id === 'shield-boost') {
          this.playSpellAnimation(targetElement);
        }
      }
      
      // Animation spéciale pour le gain de mana
      if (spellCard.id === 'mana-crystal') {
        this.animateManaGain();
      }
      
      if (this.gameService.selectTarget(cardIndex)) {
        this.updateGold();
        this.awaitingTarget = null;
      }
    }
  }

  selectEnemyTarget(enemyIndex: number): void {
    if (this.awaitingTarget) {
      const spellCard = this.awaitingTarget.card;
      const enemyElement = document.querySelector(`.enemies .enemy:nth-child(${enemyIndex + 1})`) as HTMLElement;
      
      // Déclencher l'animation pour les sorts offensifs
      if (enemyElement && spellCard.id === 'fireball') {
        this.playSpellAnimation(enemyElement);
        // Effet de dégâts après un délai
        setTimeout(() => {
          this.showDamageNumber(enemyElement, 'damage');
        }, 500);
      }
      
      if (this.gameService.selectTarget(undefined, enemyIndex)) {
        this.updateGold();
        this.awaitingTarget = null;
        
        // Vérifier les effets de victoire après un sort offensif
        setTimeout(() => {
          this.checkForVictoryEffects();
        }, 800);
      }
    } else if (this.awaitingAttackTarget) {
      this.selectAttackTarget(enemyIndex);
    }
  }

  cancelTargetSelection(): void {
    this.gameService.cancelTargetSelection();
    this.awaitingTarget = null;
  }

  isTargetable(card: Card): boolean {
    if (!this.awaitingTarget) return false;
    
    const spellCard = this.awaitingTarget.card;
    // Définir quelles cartes peuvent être ciblées par quels sorts
    if (spellCard.id === 'healing-potion' || spellCard.id === 'shield-boost') {
      return true; // Ces sorts peuvent cibler toutes les unités alliées
    }
    return false;
  }

  isEnemyTargetable(enemy: Enemy): boolean {
    if (!this.awaitingTarget && !this.awaitingAttackTarget) return false;
    
    if (this.awaitingTarget) {
      const spellCard = this.awaitingTarget.card;
      // Définir quels ennemis peuvent être ciblés par quels sorts
      if (spellCard.id === 'fireball') {
        return enemy.currentHp > 0; // Seulement les ennemis vivants
      }
    }
    
    if (this.awaitingAttackTarget) {
      return enemy.currentHp > 0; // Pour les attaques, tous les ennemis vivants
    }
    
    return false;
  }

  private handleGameStateEffects(gameState: GameState): void {
    // Effets automatiques basés sur l'état du jeu
    
    // Effet de victoire
    if (gameState.gamePhase === 'victory') {
      setTimeout(() => this.createVictoryEffect(), 100);
    }
    
    // Effet de changement de phase
    const gameContainer = document.querySelector('.game-container') as HTMLElement;
    if (gameContainer && gameState.gamePhase === 'enemy') {
      gameContainer.style.filter = 'hue-rotate(30deg)';
      setTimeout(() => {
        gameContainer.style.filter = '';
      }, 2000);
    }
  }

  private checkForVictoryEffects(): void {
    this.gameState$.subscribe(gameState => {
      if (gameState && gameState.gamePhase === 'victory') {
        this.createVictoryEffect();
      }
    }).unsubscribe();
  }



  private showGoldBonus(amount: number): void {
    const goldBonus = document.createElement('div');
    goldBonus.className = 'gold-bonus';
    goldBonus.textContent = `+${amount} Or`;
    
    document.body.appendChild(goldBonus);
    setTimeout(() => goldBonus.remove(), 2000);
  }

  private showCriticalHit(element: HTMLElement): void {
    const critical = document.createElement('div');
    critical.className = 'critical-hit';
    critical.textContent = 'CRITIQUE!';
    
    element.style.position = 'relative';
    element.appendChild(critical);
    setTimeout(() => critical.remove(), 1500);
  }

  private animateEnemyDeath(enemyElement: HTMLElement): void {
    enemyElement.classList.add('dying');
    setTimeout(() => {
      enemyElement.style.display = 'none';
    }, 1000);
  }

  private showFloorTransition(): void {
    const transition = document.createElement('div');
    transition.className = 'floor-transition';
    
    document.body.appendChild(transition);
    setTimeout(() => transition.remove(), 2000);
  }

  private animateNewCard(cardElement: HTMLElement): void {
    cardElement.classList.add('newly-drawn');
    setTimeout(() => cardElement.classList.remove('newly-drawn'), 2000);
  }

  private animateManaChange(): void {
    const manaContainer = document.querySelector('.mana-container') as HTMLElement;
    if (manaContainer) {
      manaContainer.classList.add('mana-change');
      setTimeout(() => manaContainer.classList.remove('mana-change'), 800);
    }
  }

  private animateManaGain(): void {
    const manaContainer = document.querySelector('.mana-container') as HTMLElement;
    if (manaContainer) {
      manaContainer.classList.add('mana-change');
      setTimeout(() => manaContainer.classList.remove('mana-change'), 800);
    }
    
    // Afficher un bonus de mana
    const manaBonus = document.createElement('div');
    manaBonus.className = 'gold-bonus'; // Réutiliser le style du bonus d'or
    manaBonus.textContent = '+1 Mana';
    manaBonus.style.color = '#4ecdc4'; // Couleur bleue pour le mana
    
    document.body.appendChild(manaBonus);
    setTimeout(() => manaBonus.remove(), 2000);
  }

  // Méthodes pour améliorer l'UX mobile
  private addMobileUXEnhancements(): void {
    // Ajouter un feedback visuel pour les éléments cliquables
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }

  private handleTouchStart(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('card') || 
        target.classList.contains('enemy') || 
        target.classList.contains('field-card') ||
        target.classList.contains('btn')) {
      target.style.opacity = '0.8';
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('card') || 
        target.classList.contains('enemy') || 
        target.classList.contains('field-card') ||
        target.classList.contains('btn')) {
      setTimeout(() => {
        target.style.opacity = '';
      }, 100);
    }
  }

  // Système d'effets visuels et sonores
  private playCardAnimation(cardElement: HTMLElement): void {
    cardElement.classList.add('card-play');
    setTimeout(() => cardElement.classList.remove('card-play'), 500);
    
    // Effet de particules
    this.createParticleEffect(cardElement, 'spell');
  }

  private playAttackAnimation(unitElement: HTMLElement, targetElement: HTMLElement): void {
    unitElement.classList.add('attack-glow');
    targetElement.classList.add('taking-damage');
    
    // Chance de critique (20%)
    if (Math.random() < 0.2) {
      this.showCriticalHit(targetElement);
    }
    
    setTimeout(() => {
      unitElement.classList.remove('attack-glow');
      targetElement.classList.remove('taking-damage');
    }, 800);
    
    // Effet de dégâts flottants
    this.showDamageNumber(targetElement, 'damage');
    
    // Vérifier si l'ennemi meurt pour l'animation
    setTimeout(() => {
      if (targetElement.classList.contains('dead') || targetElement.style.display === 'none') {
        this.animateEnemyDeath(targetElement);
      }
    }, 900);
  }

  private playSpellAnimation(spellElement: HTMLElement): void {
    spellElement.classList.add('spell-cast');
    setTimeout(() => spellElement.classList.remove('spell-cast'), 1000);
    
    // Effet de particules magiques
    this.createParticleEffect(spellElement, 'magic');
  }

  private playHealAnimation(targetElement: HTMLElement): void {
    targetElement.classList.add('card-flip');
    setTimeout(() => targetElement.classList.remove('card-flip'), 600);
    
    // Nombre de soins flottant
    this.showDamageNumber(targetElement, 'heal');
  }

  private createParticleEffect(element: HTMLElement, type: 'spell' | 'magic' | 'damage' | 'heal'): void {
    const particles = document.createElement('div');
    particles.className = 'particle-container';
    
    const colors = {
      spell: ['#4ecdc4', '#26de81', '#00d2d3'],
      magic: ['#8e44ad', '#ba55d3', '#da70d6'],
      damage: ['#ff4757', '#ff3742', '#ff1e2d'],
      heal: ['#2ed573', '#26de81', '#20bf6b']
    };

    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.background = colors[type][Math.floor(Math.random() * colors[type].length)];
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 2 + 's';
      particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
      particles.appendChild(particle);
    }

    element.appendChild(particles);
    setTimeout(() => particles.remove(), 3000);
  }

  private showDamageNumber(element: HTMLElement, type: 'damage' | 'heal'): void {
    const damageNum = document.createElement('div');
    damageNum.className = type === 'damage' ? 'damage-number' : 'heal-number';
    damageNum.textContent = type === 'damage' ? '-' + Math.floor(Math.random() * 5 + 1) : '+' + Math.floor(Math.random() * 3 + 2);
    damageNum.style.left = Math.random() * 50 + 25 + '%';
    damageNum.style.top = '10px';
    
    element.style.position = 'relative';
    element.appendChild(damageNum);
    setTimeout(() => damageNum.remove(), 1000);
  }

  private createVictoryEffect(): void {
    // Effet confetti
    const container = document.querySelector('.game-container');
    if (container) {
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][Math.floor(Math.random() * 5)];
        confetti.style.left = Math.random() * window.innerWidth + 'px';
        confetti.style.top = '-10px';
        confetti.style.zIndex = '9999';
        confetti.style.animation = `confetti ${Math.random() * 3 + 2}s linear`;
        confetti.style.pointerEvents = 'none';
        
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 5000);
      }
    }
  }

  isPlayerHealthLow(gameState: GameState): boolean {
    return gameState.playerHp <= Math.floor(gameState.maxPlayerHp * 0.3); // 30% ou moins
  }
}
