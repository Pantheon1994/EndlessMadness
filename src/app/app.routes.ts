import { Routes } from '@angular/router';
import { MenuComponent } from './components/menu/menu.component';
import { GameComponent } from './components/game/game.component';
import { DeckBuilderComponent } from './components/deck-builder/deck-builder.component';
import { CollectionComponent } from './components/collection/collection.component';
import { CardShopComponent } from './components/card-shop/card-shop.component';

export const routes: Routes = [
  { path: '', redirectTo: '/menu', pathMatch: 'full' },
  { path: 'menu', component: MenuComponent },
  { path: 'game', component: GameComponent },
  { path: 'deck-builder', component: DeckBuilderComponent },
  { path: 'collection', component: CollectionComponent },
  { path: 'shop', component: CardShopComponent },
  { path: '**', redirectTo: '/menu' }
];
