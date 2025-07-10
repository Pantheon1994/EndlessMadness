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
}
