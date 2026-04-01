export interface Game {
  id: string;
  title: string;
  description: string;
  steamId: number | null;
  tags: string[];
  genres: string[];
  rating: number;
  year: number;
  developer: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'brutal';
  playtime: string;
}

export interface RecommendationResult {
  game: Game;
  score: number;
  matchedTags: string[];
  reason: string;
}

export type GameStatus = 'liked' | 'disliked' | 'completed' | 'none';
