export interface MarketCard {
  cardId: string;
  price: number;
  quantity: number;
  sold: number;
}

export interface DailyMarket {
  date: string; // Format YYYY-MM-DD
  cards: MarketCard[];
}
