import {
  GameState as ServerGameState,
  MatchResult,
  ErrorPayload,
  Move,
  MatchState,
} from '@rps/shared';
import { Phase } from './GameStore.types';

export interface GameStoreState {
  phase: Phase;
  matchId: string | null;
  players: [{ id: string; name: string }, { id: string; name: string }] | null;
  matchState: MatchState | null;
  round: number;
  scores: [number, number];
  timeoutAt: number | null;
  moved: [boolean, boolean];
  lastResult: MatchResult | null;
  selectedMove: Move | null;
  opponentDisconnected: boolean;
  forfeitWinner: string | null;
  error: ErrorPayload | null;
}

export interface GameStoreActions {
  onMatchCreated: (data: { matchId: string }) => void;
  onGameState: (data: ServerGameState) => void;
  onGameResult: (data: MatchResult) => void;
  onRematchReady: () => void;
  onPlayerDisconnected: () => void;
  onPlayerReconnected: () => void;
  onForfeit: (data: { winner: string }) => void;
  onError: (data: ErrorPayload) => void;
  selectMove: (move: Move) => void;
  reset: () => void;
}

export interface GameStore extends GameStoreState, GameStoreActions {}
