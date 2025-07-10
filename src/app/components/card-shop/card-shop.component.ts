import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardService } from '../../services/card.service';
import { GoldService } from '../../services/gold.service';
import { Card } from '../../models/card.interface';
import { DailyMarket, MarketCard } from '../../models/market.interface';
import { RandomPackComponent } from '../random-pack/random-pack.component';

@Component({
  selector: 'app-card-shop',
  standalone: true,
  imports: [CommonModule, RandomPackComponent],
  templateUrl: './card-shop.component.html',
  styleUrls: ['./card-shop.component.css']
})
export class CardShopComponent implements OnInit {
  dailyMarket: DailyMarket | null = null;
  currentGold = 0;
  activeTab: 'daily' | 'packs' = 'daily';

  constructor(
    private cardService: CardService,
    private goldService: GoldService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDailyMarket();
    this.updateGold();
  }

  loadDailyMarket(): void {
    this.dailyMarket = this.cardService.getDailyMarket();
  }

  updateGold(): void {
    this.currentGold = this.goldService.getGold();
  }

  buyMarketCard(marketCard: MarketCard): void {
    if (this.cardService.buyFromDailyMarket(marketCard.cardId)) {
      this.updateGold();
      this.loadDailyMarket(); // Rafraîchir pour mettre à jour les quantités
    }
  }

  canAffordMarket(marketCard: MarketCard): boolean {
    return this.currentGold >= marketCard.price && marketCard.sold < marketCard.quantity;
  }

  getCardInfo(cardId: string): Card | undefined {
    // Récupérer les infos complètes de la carte depuis allCards
    return this.cardService.getAllCards().find((c: Card) => c.id === cardId);
  }

  switchTab(tab: 'daily' | 'packs'): void {
    this.activeTab = tab;
  }

  goBack(): void {
    this.router.navigate(['/menu']);
  }

  goToCollection(): void {
    this.router.navigate(['/collection']);
  }
}
