import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GoldService {
  private gold = 100; // Or initial

  constructor() {
    this.loadGold();
  }

  getGold(): number {
    return this.gold;
  }

  addGold(amount: number): void {
    this.gold += amount;
    this.saveGold();
  }

  spendGold(amount: number): boolean {
    if (this.gold >= amount) {
      this.gold -= amount;
      this.saveGold();
      return true;
    }
    return false;
  }

  resetGold(): void {
    this.gold = 100;
    this.saveGold();
  }

  private saveGold(): void {
    localStorage.setItem('player-gold', this.gold.toString());
  }

  private loadGold(): void {
    const saved = localStorage.getItem('player-gold');
    if (saved) {
      this.gold = parseInt(saved, 10) || 100;
    }
  }
}
