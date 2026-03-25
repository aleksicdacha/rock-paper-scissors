import { ROCK, PAPER, SCISSORS, Move } from '@rps/shared';
import { Phase } from './types';
import { GameStoreState } from './interfaces/GameStore.interface';

export const MOVES: readonly Move[] = [ROCK, PAPER, SCISSORS];
export const TICK_INTERVAL = 1000;

export const PLAYER_ID_KEY = 'rps_player_id';
export const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export const PHASE_IDLE: Phase = 'idle';
export const PHASE_WAITING: Phase = 'waiting';
export const PHASE_PLAYING: Phase = 'playing';
export const PHASE_RESOLVED: Phase = 'resolved';
export const PHASE_FINISHED: Phase = 'finished';

export const INITIAL_GAME_STATE: GameStoreState = {
  phase: PHASE_IDLE,
  matchId: null,
  players: null,
  matchState: null,
  round: 0,
  scores: [0, 0],
  timeoutAt: null,
  moved: [false, false],
  lastResult: null,
  selectedMove: null,
  opponentDisconnected: false,
  forfeitWinner: null,
  error: null,
};
