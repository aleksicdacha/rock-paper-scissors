import { Phase } from './GameStore.types';
import { GameStoreState } from './GameStore.interface';
import { gameConfig } from '../gameConfig';

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
  bestOf: gameConfig.lobby.bestOfOptions[0],
  scores: [0, 0],
  timeoutAt: null,
  moved: [false, false],
  lastResult: null,
  selectedMove: null,
  opponentDisconnected: false,
  forfeitWinner: null,
  error: null,
};
