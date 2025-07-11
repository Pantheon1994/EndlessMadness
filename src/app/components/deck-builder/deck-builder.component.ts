import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardService } from '../../services/card.service';
import { Card } from '../../models/card.interface';

@Component({
  selector: 'app-deck-builder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deck-builder.component.html',
  styleUrls: ['./deck-builder.component.css']
})
export class DeckBuilderComponent implements OnInit {
  collection: Card[] = [];
  currentDeck: Card[] = [];
  groupedCollection: { [key: string]: Card[] } = {};
  groupedDeck: { [key: string]: Card[] } = {};

  constructor(
    private cardService: CardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Recharger les données fraîches depuis le service
    this.collection = this.cardService.getCollection();
    this.currentDeck = this.cardService.getDeck();
    this.groupData();
    
    // Debug: afficher les données pour vérifier
    console.log('Collection chargée:', this.collection.length, 'cartes');
    console.log('Deck actuel:', this.currentDeck.length, 'cartes');
    console.log('Cartes uniques avec comptes:', this.cardService.getUniqueCardsWithCounts());
  }

  refreshData(): void {
    this.loadData();
  }

  private groupData(): void {
    // Grouper la collection
    this.groupedCollection = {};
    this.collection.forEach(card => {
      if (!this.groupedCollection[card.id]) {
        this.groupedCollection[card.id] = [];
      }
      this.groupedCollection[card.id].push(card);
    });

    // Grouper le deck
    this.groupedDeck = {};
    this.currentDeck.forEach(card => {
      if (!this.groupedDeck[card.id]) {
        this.groupedDeck[card.id] = [];
      }
      this.groupedDeck[card.id].push(card);
    });
  }

  getUniqueCollectionCards(): { card: Card, available: number, inDeck: number, maxInDeck: number }[] {
    // Utiliser la méthode du service pour obtenir les cartes uniques avec leurs comptes
    const uniqueCards = this.cardService.getUniqueCardsWithCounts();
    
    return uniqueCards.map(item => ({
      card: item.card,
      available: item.count, // Nombre de cartes disponibles dans la collection
      inDeck: this.groupedDeck[item.card.id] ? this.groupedDeck[item.card.id].length : 0,
      maxInDeck: this.cardService.getCardMaxInDeck(item.card) // Limite maximale pour cette carte
    }));
  }

  addCardToDeck(cardId: string): void {
    const availableInCollection = this.cardService.getCardCount(cardId);
    const cardsInDeck = this.groupedDeck[cardId] ? this.groupedDeck[cardId].length : 0;
    
    // Vérifier les limitations avec le nouveau système
    const canAdd = this.cardService.canAddCardToDeck(cardId, this.currentDeck);
    
    if (cardsInDeck < availableInCollection && this.currentDeck.length < 30 && canAdd) {
      // Obtenir la carte template depuis la collection
      const cardTemplate = this.collection.find(card => card.id === cardId);
      if (cardTemplate) {
        const cardToAdd = { ...cardTemplate };
        this.currentDeck.push(cardToAdd);
        this.groupData();
      }
    }
  }

  removeCardFromDeck(cardId: string): void {
    const cardIndex = this.currentDeck.findIndex(card => card.id === cardId);
    if (cardIndex !== -1) {
      this.currentDeck.splice(cardIndex, 1);
      this.groupData();
    }
  }

  canAddCard(cardId: string): boolean {
    const availableInCollection = this.cardService.getCardCount(cardId);
    const cardsInDeck = this.groupedDeck[cardId] ? this.groupedDeck[cardId].length : 0;
    const canAddBasedOnLimits = this.cardService.canAddCardToDeck(cardId, this.currentDeck);
    
    return cardsInDeck < availableInCollection && 
           this.currentDeck.length < 30 && 
           canAddBasedOnLimits;
  }

  canRemoveCard(cardId: string): boolean {
    return (this.groupedDeck[cardId] || []).length > 0;
  }

  saveDeck(): void {
    this.cardService.setDeck(this.currentDeck);
    alert('Deck sauvegardé avec succès!');
  }

  resetDeck(): void {
    if (confirm('Êtes-vous sûr de vouloir vider le deck?')) {
      this.currentDeck = [];
      this.groupData();
    }
  }

  goBack(): void {
    this.router.navigate(['/menu']);
  }

  getDeckCost(): { total: number, average: number } {
    const total = this.currentDeck.reduce((sum, card) => sum + card.cost, 0);
    return {
      total,
      average: this.currentDeck.length > 0 ? Math.round((total / this.currentDeck.length) * 100) / 100 : 0
    };
  }

  getCardsWithCost(cost: number): Card[] {
    return this.currentDeck.filter(card => card.cost === cost);
  }

  getCardsByType(type: string): Card[] {
    return this.currentDeck.filter(card => card.type === type);
  }

  getUniqueDeckCards(): { card: Card, count: number }[] {
    return Object.keys(this.groupedDeck).map(cardId => ({
      card: this.groupedDeck[cardId][0],
      count: this.groupedDeck[cardId].length
    }));
  }

  debugCollectionData(): void {
    console.log('=== DEBUG COLLECTION DATA ===');
    console.log('Collection brute:', this.cardService.getCollection());
    console.log('Cartes uniques avec comptes:', this.cardService.getUniqueCardsWithCounts());
    console.log('Deck actuel:', this.cardService.getDeck());
    console.log('Collection groupée:', this.groupedCollection);
    console.log('Deck groupé:', this.groupedDeck);
    console.log('getUniqueCollectionCards():', this.getUniqueCollectionCards());
    
    // Afficher spécifiquement pour le Garde du Néant
    const guardCount = this.cardService.getCardCount('guard-of-void');
    console.log('Nombre de Gardes du Néant dans la collection:', guardCount);
    
    // Afficher toutes les limites de cartes
    console.log('=== LIMITES PAR CARTE ===');
    console.log(this.cardService.getAllCardLimits());
  }

  // Méthode pour forcer la synchronisation
  forceSyncCollection(): void {
    console.log('Forçage de la synchronisation...');
    this.cardService.forceSynchronizeCollection();
    this.loadData(); // Recharger les données
    console.log('Synchronisation terminée !');
  }
}
