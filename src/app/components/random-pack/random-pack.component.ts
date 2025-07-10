import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Card } from '../../models/card.interface';
import { CardService } from '../../services/card.service';
import { GoldService } from '../../services/gold.service';

@Component({
  selector: 'app-random-pack',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './random-pack.component.html',
  styleUrls: ['./random-pack.component.css']
})
export class RandomPackComponent implements OnInit {
  quantity: number = 1;
  maxQuantity: number = 10;
  
  // État de l'achat
  isRevealing: boolean = false;
  hasPurchased: boolean = false;
  revealedCards: Card[] = [];
  currentRevealIndex: number = 0;
  
  constructor(
    private cardService: CardService,
    private goldService: GoldService
  ) {}

  ngOnInit(): void {}

  get currentPrice(): number {
    return this.cardService.getRandomPackPrice(this.quantity);
  }

  get discount(): number {
    return this.cardService.getRandomPackDiscount(this.quantity);
  }

  get originalPrice(): number {
    return 50 * this.quantity;
  }

  get canAfford(): boolean {
    return this.goldService.getGold() >= this.currentPrice;
  }

  get playerGold(): number {
    return this.goldService.getGold();
  }

  onQuantityChange(): void {
    if (this.quantity < 1) this.quantity = 1;
    if (this.quantity > this.maxQuantity) this.quantity = this.maxQuantity;
  }

  buyPack(): void {
    if (!this.canAfford || this.isRevealing) return;

    const cards = this.cardService.buyRandomPack(this.quantity);
    if (cards) {
      this.revealedCards = cards;
      this.hasPurchased = true;
      this.startReveal();
    }
  }

  private startReveal(): void {
    this.isRevealing = true;
    this.currentRevealIndex = 0;
    this.revealNextCard();
  }

  private revealNextCard(): void {
    if (this.currentRevealIndex < this.revealedCards.length) {
      setTimeout(() => {
        this.currentRevealIndex++;
        if (this.currentRevealIndex < this.revealedCards.length) {
          this.revealNextCard();
        } else {
          this.isRevealing = false;
        }
      }, 800); // Délai entre chaque révélation
    }
  }

  reset(): void {
    this.hasPurchased = false;
    this.isRevealing = false;
    this.revealedCards = [];
    this.currentRevealIndex = 0;
    this.quantity = 1;
  }

  getCardRarity(card: Card): string {
    if (!card.price) return 'common';
    if (card.price <= 25) return 'common';
    if (card.price <= 40) return 'uncommon';
    if (card.price <= 55) return 'rare';
    return 'legendary';
  }
}
