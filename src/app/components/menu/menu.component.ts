import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardService } from '../../services/card.service';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent {
  showFloorSelection = false;
  availableFloors: number[] = [];

  constructor(
    private router: Router,
    private cardService: CardService,
    private gameService: GameService
  ) {
    this.loadAvailableFloors();
  }

  loadAvailableFloors(): void {
    this.availableFloors = this.cardService.getAvailableFloors();
    console.log('Étages disponibles:', this.availableFloors);
    console.log('Max étage atteint:', this.cardService.getMaxFloorReached());
  }

  // Méthode de test pour débloquer des étages
  unlockTestFloors(): void {
    this.cardService.unlockMultipleFloors(5);
    this.loadAvailableFloors();
  }

  // Méthode pour réinitialiser la progression
  resetProgress(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser TOUTE votre progression ? Cette action supprimera TOUT : cartes, or, étages débloqués, etc. Cette action est IRRÉVERSIBLE.')) {
      // Utiliser la nouvelle méthode de reset complet
      this.gameService.resetAllProgress();
      this.loadAvailableFloors();
      alert('TOUTE la progression a été réinitialisée ! Tout a été supprimé du localStorage.');
    }
  }

  startGame(): void {
    if (this.availableFloors.length > 1) {
      this.showFloorSelection = true;
    } else {
      this.startGameWithFloor(1);
    }
  }

  startGameWithFloor(floor: number): void {
    this.gameService.startGame(floor);
    this.router.navigate(['/game']);
  }

  cancelFloorSelection(): void {
    this.showFloorSelection = false;
  }

  openDeckBuilder(): void {
    this.router.navigate(['/deck-builder']);
  }

  openCollection(): void {
    this.router.navigate(['/collection']);
  }

  openShop(): void {
    this.router.navigate(['/shop']);
  }
}
