import { create } from 'zustand';
import { ENDED } from '@rps/shared';
import { GameStore } from './GameStore.interface';
import {
  INITIAL_GAME_STATE,
  PHASE_WAITING,
  PHASE_FINISHED,
  PHASE_RESOLVED,
} from './GameStore.consts';
import { phaseFromMatchState } from './phaseFromMatchState';

export const useGameStore = create<GameStore>()((set) => ({
  ...INITIAL_GAME_STATE,

  onMatchCreated: ({ matchId }) =>
    set({ matchId, phase: PHASE_WAITING, error: null }),

  onGameState: (data) =>
    set({
      matchId: data.matchId,
      players: data.players,
      matchState: data.state,
      round: data.round,
      bestOf: data.bestOf,
      scores: data.scores,
      timeoutAt: data.timeoutAt,
      moved: data.moved,
      phase: phaseFromMatchState(data.state, false),
      error: null,
    }),

  onGameResult: (data) =>
    set({
      lastResult: data,
      scores: data.scores,
      selectedMove: null,
      phase: data.finished ? PHASE_FINISHED : PHASE_RESOLVED,
    }),

  onRematchReady: () =>
    set({ lastResult: null, selectedMove: null }),

  onPlayerDisconnected: () =>
    set({ opponentDisconnected: true }),

  onPlayerReconnected: () =>
    set({ opponentDisconnected: false }),

  onForfeit: ({ winner }) =>
    set({
      phase: PHASE_FINISHED,
      forfeitWinner: winner,
      lastResult: null,
      error: null,
      matchState: ENDED,
      opponentDisconnected: false,
      selectedMove: null,
    }),

  onError: (data) =>
    set({ error: data }),

  selectMove: (move) =>
    set({ selectedMove: move }),

  reset: () => set(INITIAL_GAME_STATE),
}));
