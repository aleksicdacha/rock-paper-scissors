export type Move = 'rock' | 'paper' | 'scissors';

export type MatchState = 'WAITING' | 'PLAYING' | 'RESOLVED' | 'ENDED';

export interface Player {
  id: string;
  name: string;
  socketId: string;
}

export interface RoundResult {
  moves: [Move | null, Move | null];
  winner: number | null;
}

export interface GameState {
  matchId: string;
  players: [Pick<Player, 'id' | 'name'>, Pick<Player, 'id' | 'name'>];
  state: MatchState;
  round: number;
  scores: [number, number];
  timeoutAt: number | null;
  moved: [boolean, boolean];
}

export interface MatchResult {
  matchId: string;
  round: RoundResult;
  scores: [number, number];
  winner: string | null;
  finished: boolean;
}

export interface ErrorPayload {
  code: string;
  message: string;
}
