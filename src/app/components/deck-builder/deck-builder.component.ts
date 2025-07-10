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
    this.collection = [...this.cardService.getCollection()];
    this.currentDeck = [...this.cardService.getDeck()];
    this.groupData();
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

  getUniqueCollectionCards(): { card: Card, available: number, inDeck: number }[] {
    return Object.keys(this.groupedCollection).map(cardId => ({
      card: this.groupedCollection[cardId][0],
      available: this.groupedCollection[cardId].length,
      inDeck: this.groupedDeck[cardId] ? this.groupedDeck[cardId].length : 0
    }));
  }

  addCardToDeck(cardId: string): void {
    const availableCards = this.groupedCollection[cardId];
    const cardsInDeck = this.groupedDeck[cardId] || [];
    
    if (cardsInDeck.length < availableCards.length && this.currentDeck.length < 30) {
      const cardToAdd = { ...availableCards[0] };
      this.currentDeck.push(cardToAdd);
      this.groupData();
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
    const availableCards = this.groupedCollection[cardId];
    const cardsInDeck = this.groupedDeck[cardId] || [];
    return cardsInDeck.length < availableCards.length && this.currentDeck.length < 30;
  }

  canRemoveCard(cardId: string): boolean {
    return (this.groupedDeck[cardId] || []).length > 0;
  }

  saveDeck(): void {
    if (this.currentDeck.length >= 20) {
      this.cardService.setDeck(this.currentDeck);
      alert('Deck sauvegardé avec succès!');
    } else {
      alert('Votre deck doit contenir au moins 20 cartes!');
    }
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
}
