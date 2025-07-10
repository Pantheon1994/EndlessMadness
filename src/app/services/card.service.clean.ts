import { Injectable } from '@angular/core';
import { Card } from '../models/card.interface';
import { Player } from '../models/player.interface';
import { DailyMarket, MarketCard } from '../models/market.interface';
import { GoldService } from './gold.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private player!: Player;
  private dailyMarket: DailyMarket | null = null;
  private allCards: Card[] = [
    {
      id: 'guard-of-void',
      name: 'Garde du Néant',
      type: 'unit',
      cost: 2,
      hp: 3,
      attack: 1,
      defense: 1,
      effect: 'Provoque',
      price: 40
    },
    {
      id: 'fire-mage',
      name: 'Mage de Feu',
      type: 'unit',
      cost: 2,
      hp: 2,
      attack: 3,
      defense: 0,
      effect: 'Attaque à distance',
      price: 40
    },
    {
      id: 'healing-potion',
      name: 'Potion de Soin',
      type: 'spell',
      cost: 1,
      effect: 'Restaure 3 PV à une unité ciblée',
      price: 30
    },
    {
      id: 'berserker',
      name: 'Berserker',
      type: 'unit',
      cost: 3,
      hp: 4,
      attack: 3,
      defense: 0,
      effect: 'Gagne +1 Attaque quand blessé',
      price: 50
    },
    {
      id: 'basic-warrior',
      name: 'Guerrier',
      type: 'unit',
      cost: 1,
      hp: 2,
      attack: 1,
      defense: 0,
      effect: 'Unité de base',
      price: 20
    },
    {
      id: 'armored-knight',
      name: 'Chevalier Blindé',
      type: 'unit',
      cost: 3,
      hp: 3,
      attack: 2,
      defense: 2,
      effect: 'Haute défense',
      price: 60
    },
    {
      id: 'fireball',
      name: 'Boule de Feu',
      type: 'spell',
      cost: 2,
      effect: 'Inflige 3 dégâts à un ennemi ciblé',
      price: 35
    },
    {
      id: 'shield-boost',
      name: 'Renforcement',
      type: 'spell',
      cost: 1,
      effect: 'Donne +2 Défense à une unité ciblée',
      price: 25
    },
    {
      id: 'mana-crystal',
      name: 'Cristal de Mana',
      type: 'spell',
      cost: 0,
      effect: 'Donne +1 Mana ce tour',
      price: 15
    },
    {
      id: 'rage-boost',
      name: 'Rage Bestiale',
      type: 'spell',
      cost: 2,
      effect: 'Double les dégâts d\'une unité ciblée pendant 2 tours',
      price: 50
    },
    {
      id: 'arsenal',
      name: 'Arsenal',
      type: 'spell',
      cost: 4,
      effect: 'Augmente définitivement l\'attaque d\'une unité de +2',
      price: 80
    },
    {
      id: 'stun-bolt',
      name: 'Éclair Paralysant',
      type: 'spell',
      cost: 3,
      effect: 'Étourdit un ennemi pendant 2 tours',
      price: 60
    },
    {
      id: 'divine-protection',
      name: 'Protection Divine',
      type: 'spell',
      cost: 5,
      effect: 'Rend une unité invulnérable pendant 1 tour',
      price: 100
    },
    {
      id: 'poison',
      name: 'Poison',
      type: 'spell',
      cost: 2,
      effect: 'Inflige 1 dégât par tour à un ennemi jusqu\'à sa mort',
      price: 45
    }
  ];

  constructor(
    private goldService: GoldService,
    private storageService: StorageService
  ) {
    this.initializePlayer();
    this.loadDailyMarket();
  }

  private initializePlayer(): void {
    const saved = this.storageService.loadPlayer();
    if (saved) {
      this.player = saved;
      // Vérifier si maxFloorReached existe, sinon l'initialiser
      if (this.player.maxFloorReached === undefined) {
        this.player.maxFloorReached = 1;
        this.savePlayer();
      }
    } else {
      // Collection de départ avec quelques cartes de base
      this.player = {
        gold: 100,
        maxFloorReached: 1, // Commence à l'étage 1
        collection: [
          this.copyCard('basic-warrior'),
          this.copyCard('basic-warrior'),
          this.copyCard('basic-warrior'),
          this.copyCard('guard-of-void'),
          this.copyCard('fire-mage'),
          this.copyCard('healing-potion'),
          this.copyCard('healing-potion'),
          this.copyCard('mana-crystal'),
          this.copyCard('mana-crystal')
        ],
        deck: []
      };
      this.buildStarterDeck();
    }
  }

  private buildStarterDeck(): void {
    // Deck de départ de 20 cartes équilibré
    this.player.deck = [
      ...this.player.collection, // 9 cartes de la collection (incluant 2 cristaux)
      ...Array(11).fill(null).map(() => this.copyCard('basic-warrior')) // 11 guerriers de base
    ];
  }

  private copyCard(cardId: string): Card {
    const template = this.allCards.find(c => c.id === cardId);
    if (!template) throw new Error(`Carte non trouvée: ${cardId}`);
    
    return {
      ...template,
      currentHp: template.hp,
      currentDefense: template.defense || 0
    };
  }

  getPlayer(): Player {
    return this.player;
  }

  getCollection(): Card[] {
    // Retourner une copie pour éviter les modifications non intentionnelles
    return [...this.player.collection];
  }

  getDeck(): Card[] {
    return this.player.deck;
  }

  setDeck(newDeck: Card[]): void {
    this.player.deck = [...newDeck];
    this.savePlayer();
  }

  // Marché quotidien
  getDailyMarket(): DailyMarket {
    const today = new Date().toISOString().split('T')[0];
    
    if (!this.dailyMarket || this.dailyMarket.date !== today) {
      this.generateDailyMarket(today);
    }
    
    return this.dailyMarket!;
  }

  private generateDailyMarket(date: string): void {
    // Générer un marché basé sur la date pour que tous les joueurs aient le même
    const seed = this.hashString(date);
    const rng = this.seededRandom(seed);
    
    const marketCards: MarketCard[] = [];
    const selectedCards = this.shuffleArrayWithSeed([...this.allCards], rng).slice(0, 6);
    
    selectedCards.forEach(card => {
      marketCards.push({
        cardId: card.id,
        price: card.price || 50,
        quantity: Math.floor(rng() * 3) + 2, // 2-4 exemplaires
        sold: 0
      });
    });

    this.dailyMarket = {
      date,
      cards: marketCards
    };
    
    // Sauvegarder le marché
    this.saveDailyMarket();
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number): () => number {
    return function() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  private shuffleArrayWithSeed<T>(array: T[], rng: () => number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  buyFromDailyMarket(cardId: string): boolean {
    const market = this.getDailyMarket();
    const marketCard = market.cards.find(mc => mc.cardId === cardId);
    
    if (!marketCard || marketCard.sold >= marketCard.quantity) {
      return false; // Carte non disponible ou épuisée
    }
    
    if (this.goldService.spendGold(marketCard.price)) {
      this.player.collection.push(this.copyCard(cardId));
      marketCard.sold++;
      this.savePlayer();
      this.saveDailyMarket();
      return true;
    }
    
    return false;
  }

  sellCard(cardId: string): boolean {
    const cardIndex = this.player.collection.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return false;
    
    const card = this.allCards.find(c => c.id === cardId);
    if (!card || !card.price) return false;
    
    // Revendre à 65% du prix initial
    const sellPrice = Math.floor(card.price * 0.65);
    
    this.player.collection.splice(cardIndex, 1);
    this.goldService.addGold(sellPrice);
    this.savePlayer();
    
    return true;
  }

  getCardSellPrice(cardId: string): number {
    const card = this.allCards.find(c => c.id === cardId);
    if (!card || !card.price) return 0;
    return Math.floor(card.price * 0.65);
  }

  private saveDailyMarket(): void {
    if (this.dailyMarket) {
      localStorage.setItem('daily-market', JSON.stringify(this.dailyMarket));
    }
  }

  private loadDailyMarket(): void {
    try {
      const saved = localStorage.getItem('daily-market');
      if (saved) {
        this.dailyMarket = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Erreur chargement marché quotidien:', error);
    }
  }

  resetPlayer(): void {
    this.storageService.clearSave();
    this.initializePlayer();
  }

  private savePlayer(): void {
    this.storageService.savePlayer(this.player);
  }

  // Système d'achat de cartes aléatoires avec ristournes
  getRandomPackPrice(quantity: number): number {
    const basePrice = 50; // Prix de base par carte
    
    // Ristournes progressives
    if (quantity >= 8) return Math.floor(basePrice * quantity * 0.7); // 30% de réduction
    if (quantity >= 5) return Math.floor(basePrice * quantity * 0.8); // 20% de réduction
    if (quantity >= 3) return Math.floor(basePrice * quantity * 0.9); // 10% de réduction
    
    return basePrice * quantity;
  }

  getRandomPackDiscount(quantity: number): number {
    if (quantity >= 8) return 30;
    if (quantity >= 5) return 20;
    if (quantity >= 3) return 10;
    return 0;
  }

  buyRandomPack(quantity: number): Card[] | null {
    if (quantity < 1 || quantity > 10) return null;
    
    const totalPrice = this.getRandomPackPrice(quantity);
    
    if (!this.goldService.spendGold(totalPrice)) {
      return null; // Pas assez d'or
    }

    // Générer les cartes aléatoires
    const newCards: Card[] = [];
    for (let i = 0; i < quantity; i++) {
      // Probabilités pondérées : cartes plus chères = plus rares
      const weightedCards = this.createWeightedCardPool();
      const randomIndex = Math.floor(Math.random() * weightedCards.length);
      const selectedCard = weightedCards[randomIndex];
      newCards.push(this.copyCard(selectedCard.id));
    }

    // Ajouter à la collection
    this.player.collection.push(...newCards);
    this.savePlayer();

    return newCards;
  }

  private createWeightedCardPool(): Card[] {
    const pool: Card[] = [];
    
    this.allCards.forEach(card => {
      let weight = 1;
      
      // Pondération basée sur le prix (cartes plus chères = plus rares)
      if (!card.price || card.price <= 25) {
        weight = 5; // Très commun
      } else if (card.price <= 40) {
        weight = 3; // Commun
      } else if (card.price <= 55) {
        weight = 2; // Peu commun
      } else {
        weight = 1; // Rare
      }
      
      // Ajouter la carte selon son poids
      for (let i = 0; i < weight; i++) {
        pool.push(card);
      }
    });
    
    return pool;
  }

  getAllCards(): Card[] {
    return this.allCards;
  }

  // Gestion de la progression des étages
  getMaxFloorReached(): number {
    return this.player.maxFloorReached;
  }

  unlockFloor(floor: number): void {
    if (floor > this.player.maxFloorReached) {
      this.player.maxFloorReached = floor;
      this.savePlayer();
    }
  }

  // Méthode de test pour débloquer plusieurs étages
  unlockMultipleFloors(maxFloor: number): void {
    if (maxFloor > this.player.maxFloorReached) {
      this.player.maxFloorReached = maxFloor;
      this.savePlayer();
    }
  }

  getAvailableFloors(): number[] {
    return Array.from({ length: this.player.maxFloorReached }, (_, i) => i + 1);
  }
}
