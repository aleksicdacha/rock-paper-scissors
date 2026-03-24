import { MatchState, Move } from './types';

export const ROCK: Move = 'rock';
export const PAPER: Move = 'paper';
export const SCISSORS: Move = 'scissors';

export const WAITING: MatchState = 'WAITING';
export const PLAYING: MatchState = 'PLAYING';
export const RESOLVED: MatchState = 'RESOLVED';
export const ENDED: MatchState = 'ENDED';

export const WINS_OVER: Record<Move, Move> = {
  [ROCK]: SCISSORS,
  [PAPER]: ROCK,
  [SCISSORS]: PAPER,
};
