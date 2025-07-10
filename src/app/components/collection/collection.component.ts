import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardService } from '../../services/card.service';
import { GoldService } from '../../services/gold.service';
import { Card } from '../../models/card.interface';

@Component({
  selector: 'app-collection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.css']
})
export class CollectionComponent implements OnInit {
  collection: Card[] = [];
  groupedCollection: { [key: string]: Card[] } = {};
  currentGold = 0;

  constructor(
    private cardService: CardService,
    private goldService: GoldService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCollection();
    this.updateGold();
  }

  loadCollection(): void {
    this.collection = this.cardService.getCollection();
    this.groupCollection();
  }

  updateGold(): void {
    this.currentGold = this.goldService.getGold();
  }

  private groupCollection(): void {
    this.groupedCollection = {};
    this.collection.forEach(card => {
      if (!this.groupedCollection[card.id]) {
        this.groupedCollection[card.id] = [];
      }
      this.groupedCollection[card.id].push(card);
    });
  }

  getUniqueCards(): { card: Card, count: number }[] {
    return Object.keys(this.groupedCollection).map(cardId => ({
      card: this.groupedCollection[cardId][0],
      count: this.groupedCollection[cardId].length
    }));
  }

  sellCard(cardId: string): void {
    if (confirm('Êtes-vous sûr de vouloir vendre cette carte?')) {
      if (this.cardService.sellCard(cardId)) {
        this.loadCollection();
        this.updateGold();
      }
    }
  }

  getSellPrice(cardId: string): number {
    return this.cardService.getCardSellPrice(cardId);
  }

  goBack(): void {
    this.router.navigate(['/menu']);
  }

  goToDeckBuilder(): void {
    this.router.navigate(['/deck-builder']);
  }

  goToShop(): void {
    this.router.navigate(['/shop']);
  }
}
