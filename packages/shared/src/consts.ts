import { Move } from './types';

export const ROCK: Move = 'rock';
export const PAPER: Move = 'paper';
export const SCISSORS: Move = 'scissors';

export const WINS_OVER: Record<Move, Move> = {
  [ROCK]: SCISSORS,
  [PAPER]: ROCK,
  [SCISSORS]: PAPER,
};
