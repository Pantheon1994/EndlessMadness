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
  
  // Configuration des limitations par rareté
  private readonly RARITY_LIMITS = {
    'normal': 5,     // Cartes normales : 5 max
    'blue': 3,       // Cartes bleues : 3 max  
    'epic': 2,       // Cartes épiques : 2 max
    'legendary': 1   // Cartes légendaires : 1 max
  };

  // Configuration des limitations par type de carte (fallback)
  private readonly DECK_LIMITS = {
    'unit': 3,    // Max 3 unités de chaque type
    'spell': 1    // Max 1 sort de chaque type (unique)
  };

  private allCards: Card[] = [
    {
      id: 'guard-of-void',
      name: 'Garde du Néant',
      type: 'unit',
      cost: 2,
      hp: 4,
      attack: 1,
      defense: 1,
      effect: 'Provoque',
      price: 40,
      rarity: 'blue'
    },
    {
      id: 'fire-mage',
      name: 'Mage de Feu',
      type: 'unit',
      cost: 2,
      hp: 3,
      attack: 3,
      defense: 0,
      effect: 'Attaque à distance',
      price: 40,
      rarity: 'blue'
    },
    {
      id: 'healing-potion',
      name: 'Potion de Soin',
      type: 'spell',
      cost: 1,
      effect: 'Restaure 3 PV à une unité ciblée',
      price: 30,
      rarity: 'normal'
    },
    {
      id: 'berserker',
      name: 'Berserker',
      type: 'unit',
      cost: 3,
      hp: 5,
      attack: 3,
      defense: 0,
      effect: 'Gagne +1 Attaque quand blessé',
      price: 50,
      rarity: 'epic'
    },
    {
      id: 'basic-warrior',
      name: 'Guerrier',
      type: 'unit',
      cost: 1,
      hp: 3,
      attack: 1,
      defense: 0,
      effect: 'Unité de base',
      price: 20,
      rarity: 'normal'
    },
    {
      id: 'armored-knight',
      name: 'Chevalier Blindé',
      type: 'unit',
      cost: 3,
      hp: 4,
      attack: 2,
      defense: 2,
      effect: 'Haute défense',
      price: 60,
      rarity: 'epic'
    },
    {
      id: 'fireball',
      name: 'Boule de Feu',
      type: 'spell',
      cost: 2,
      effect: 'Inflige 3 dégâts à un ennemi ciblé',
      price: 35,
      rarity: 'blue'
    },
    {
      id: 'shield-boost',
      name: 'Renforcement',
      type: 'spell',
      cost: 1,
      effect: 'Donne +2 Défense à une unité ciblée',
      price: 25,
      rarity: 'normal'
    },
    {
      id: 'mana-crystal',
      name: 'Cristal de Mana',
      type: 'spell',
      cost: 0,
      effect: 'Donne +1 Mana ce tour',
      price: 15,
      rarity: 'normal'
    },
    {
      id: 'rage-boost',
      name: 'Rage Bestiale',
      type: 'spell',
      cost: 2,
      effect: 'Double les dégâts d\'une unité ciblée pendant 2 tours',
      price: 50,
      rarity: 'epic'
    },
    {
      id: 'arsenal',
      name: 'Arsenal',
      type: 'spell',
      cost: 4,
      effect: 'Augmente définitivement l\'attaque d\'une unité de +2',
      price: 80,
      rarity: 'legendary'
    },
    {
      id: 'stun-bolt',
      name: 'Éclair Paralysant',
      type: 'spell',
      cost: 3,
      effect: 'Étourdit un ennemi pendant 2 tours',
      price: 60,
      rarity: 'blue'
    },
    {
      id: 'divine-protection',
      name: 'Protection Divine',
      type: 'spell',
      cost: 5,
      effect: 'Rend une unité invulnérable pendant 1 tour',
      price: 100,
      rarity: 'legendary'
    },
    {
      id: 'poison',
      name: 'Poison',
      type: 'spell',
      cost: 2,
      effect: 'Inflige 1 dégât par tour à un ennemi jusqu\'à sa mort',
      price: 45,
      rarity: 'blue'
    },
    {
      id: 'mana-conversion',
      name: 'Conversion de Mana',
      type: 'spell',
      cost: 0,
      effect: 'Convertit tous vos points de mana en cartes (1 mana = 1 carte)',
      price: 70,
      rarity: 'epic'
    },
    {
      id: 'card-draw',
      name: 'Pioche',
      type: 'spell',
      cost: 1,
      effect: 'Pioche 2 cartes de votre deck',
      price: 25,
      rarity: 'normal'
    },
    {
      id: 'explosion',
      name: 'Explosion',
      type: 'spell',
      cost: 6,
      effect: 'Inflige 2 dégâts à tous les ennemis et 1 dégât à toutes vos unités',
      price: 120,
      rarity: 'epic'
    },
    {
      id: 'demonist',
      name: 'Démoniste',
      type: 'unit',
      cost: 4,
      hp: 3,
      attack: 2,
      defense: 0,
      effect: 'Invoque un Squelette (1/1) quand un ennemi meurt',
      price: 90,
      rarity: 'epic'
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
      
      // Nettoyer les propriétés de jeu des cartes existantes dans la collection et le deck
      this.player.collection = this.player.collection.map(card => this.cleanCard(card));
      this.player.deck = this.player.deck.map(card => this.cleanCard(card));
      
      // Synchroniser la collection avec le deck pour corriger les incohérences
      this.synchronizeCollectionWithDeck();
      
      // Appliquer les nouvelles règles de limitation aux decks existants
      this.applyNewDeckRules();
      
      this.savePlayer(); // Sauvegarder les cartes nettoyées et synchronisées
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
          this.copyCard('mana-crystal'),
          this.copyCard('card-draw')
        ],
        deck: []
      };
      this.buildStarterDeck();
    }
  }

  private buildStarterDeck(): void {
    // Deck de départ équilibré avec seulement les cartes de la collection
    this.player.deck = [
      ...this.player.collection // Toutes les cartes de la collection
    ];
  }

  private copyCard(cardId: string): Card {
    const template = this.allCards.find(c => c.id === cardId);
    if (!template) throw new Error(`Carte non trouvée: ${cardId}`);
    
    // Copier seulement les propriétés de base (pas les propriétés de jeu)
    return {
      id: template.id,
      name: template.name,
      type: template.type,
      cost: template.cost,
      hp: template.hp,
      attack: template.attack,
      defense: template.defense,
      effect: template.effect,
      price: template.price,
      rarity: template.rarity, // Inclure la rareté
      maxInDeck: template.maxInDeck // Inclure la limite de deck si définie
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

  // Méthode pour nettoyer les propriétés de jeu des cartes (pour les sauvegardes corrompues)
  private cleanCard(card: Card): Card {
    return {
      id: card.id,
      name: card.name,
      type: card.type,
      cost: card.cost,
      hp: card.hp,
      attack: card.attack,
      defense: card.defense,
      effect: card.effect,
      price: card.price,
      maxInDeck: card.maxInDeck // Préserver la limite de deck
    };
  }

  // Méthode pour obtenir le nombre d'exemplaires de chaque carte dans la collection
  getCardCount(cardId: string): number {
    return this.player.collection.filter(card => card.id === cardId).length;
  }

  // Méthode pour obtenir les cartes uniques avec leurs quantités
  getUniqueCardsWithCounts(): { card: Card, count: number }[] {
    const cardCounts: { [key: string]: { card: Card, count: number } } = {};
    
    this.player.collection.forEach(card => {
      if (cardCounts[card.id]) {
        cardCounts[card.id].count++;
      } else {
        cardCounts[card.id] = { card: card, count: 1 };
      }
    });
    
    return Object.values(cardCounts);
  }

  // Méthode pour synchroniser la collection avec le deck existant
  private synchronizeCollectionWithDeck(): void {
    // Compter les cartes dans le deck
    const deckCounts: { [key: string]: number } = {};
    this.player.deck.forEach(card => {
      deckCounts[card.id] = (deckCounts[card.id] || 0) + 1;
    });
    
    // Compter les cartes dans la collection
    const collectionCounts: { [key: string]: number } = {};
    this.player.collection.forEach(card => {
      collectionCounts[card.id] = (collectionCounts[card.id] || 0) + 1;
    });
    
    // Ajouter les cartes manquantes à la collection
    Object.keys(deckCounts).forEach(cardId => {
      const neededInDeck = deckCounts[cardId];
      const availableInCollection = collectionCounts[cardId] || 0;
      const missing = neededInDeck - availableInCollection;
      
      if (missing > 0) {
        console.log(`Ajout de ${missing} exemplaires de ${cardId} à la collection`);
        for (let i = 0; i < missing; i++) {
          this.player.collection.push(this.copyCard(cardId));
        }
      }
    });
  }

  // Méthode publique pour forcer la synchronisation
  forceSynchronizeCollection(): void {
    this.synchronizeCollectionWithDeck();
    this.savePlayer();
  }

  // Méthode pour obtenir la limite maximale d'une carte dans un deck
  getCardMaxInDeck(card: Card): number {
    // Priorité au système de rareté
    if (card.rarity && this.RARITY_LIMITS[card.rarity]) {
      console.log(`Limite par rareté pour ${card.name} (${card.rarity}): ${this.RARITY_LIMITS[card.rarity]}`);
      return this.RARITY_LIMITS[card.rarity];
    }
    
    // Fallback vers les limites individuelles (pour compatibilité)
    if (card.maxInDeck !== undefined) {
      console.log(`Limite individuelle pour ${card.name}: ${card.maxInDeck}`);
      return card.maxInDeck;
    }
    
    // Fallback vers les limites par type
    const typeLimit = this.DECK_LIMITS[card.type] || 3;
    console.log(`Limite par type pour ${card.name} (${card.type}): ${typeLimit}`);
    return typeLimit;
  }

  // Méthode pour vérifier si on peut ajouter une carte au deck
  canAddCardToDeck(cardId: string, currentDeck: Card[]): boolean {
    const card = this.allCards.find(c => c.id === cardId);
    if (!card) {
      console.log(`Carte ${cardId} non trouvée`);
      return false;
    }
    
    const maxAllowed = this.getCardMaxInDeck(card);
    const currentCount = currentDeck.filter(c => c.id === cardId).length;
    
    console.log(`Carte ${cardId} (${card.rarity}): ${currentCount}/${maxAllowed} dans le deck`);
    
    return currentCount < maxAllowed;
  }

  // Méthode pour obtenir le nombre de cartes de ce type déjà dans le deck
  getCardCountInDeck(cardId: string, deck: Card[]): number {
    return deck.filter(card => card.id === cardId).length;
  }

  // Méthode pour nettoyer un deck selon les nouvelles règles de limitation
  cleanDeckAccordingToLimits(deck: Card[]): Card[] {
    const cleanedDeck: Card[] = [];
    const cardCounts: { [key: string]: number } = {};
    
    deck.forEach(card => {
      const cardId = card.id;
      const currentCount = cardCounts[cardId] || 0;
      const maxAllowed = this.getCardMaxInDeck(card);
      
      if (currentCount < maxAllowed) {
        cleanedDeck.push(card);
        cardCounts[cardId] = currentCount + 1;
      } else {
        console.log(`Carte ${card.name} retirée du deck (limite: ${maxAllowed})`);
      }
    });
    
    return cleanedDeck;
  }

  // Méthode pour appliquer les nouvelles règles au deck actuel
  applyNewDeckRules(): void {
    const originalDeckSize = this.player.deck.length;
    this.player.deck = this.cleanDeckAccordingToLimits(this.player.deck);
    const newDeckSize = this.player.deck.length;
    
    if (originalDeckSize !== newDeckSize) {
      console.log(`Deck nettoyé: ${originalDeckSize} → ${newDeckSize} cartes`);
      this.savePlayer();
    }
  }

  // Méthode pour obtenir toutes les limites de cartes (utile pour debug)
  getAllCardLimits(): { [cardId: string]: number } {
    const limits: { [cardId: string]: number } = {};
    this.allCards.forEach(card => {
      limits[card.id] = this.getCardMaxInDeck(card);
    });
    return limits;
  }

  // Méthode pour mettre à jour la limite d'une carte spécifique
  updateCardLimit(cardId: string, newLimit: number): boolean {
    const cardIndex = this.allCards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;
    
    this.allCards[cardIndex].maxInDeck = newLimit;
    console.log(`Limite de ${this.allCards[cardIndex].name} mise à jour: ${newLimit}`);
    return true;
  }

  // Méthode pour réinitialiser complètement la progression
  resetPlayerProgress(): void {
    localStorage.removeItem('endless-madness-player');
    this.initializePlayer(); // Réinitialise avec la nouvelle configuration
  }
}
