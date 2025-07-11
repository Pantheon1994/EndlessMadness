import { Injectable } from '@angular/core';
import { Player } from '../models/player.interface';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly STORAGE_KEY = 'endless-madness-data';

  savePlayer(player: Player): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(player));
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  }

  loadPlayer(): Player | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Erreur chargement:', error);
      return null;
    }
  }

  clearSave(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Reset complet de toute la progression
  resetAll(): void {
    // Vider complètement le localStorage pour ce jeu
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('endless-madness') || key.includes('player-') || key.includes('daily-market')) {
        localStorage.removeItem(key);
      }
    });
    
    // Alternativement, on peut tout vider (plus radical)
    // localStorage.clear();
    
    console.log('Toute la progression a été réinitialisée !');
  }
}
