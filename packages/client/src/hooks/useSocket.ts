import { useEffect } from 'react';
import {
  ServerEvent,
  GameState,
  MatchResult,
  ErrorPayload,
} from '@rps/shared';
import { socketService } from '../services/SocketService';
import { useGameStore } from '../store/gameStore';

export function useSocket(): void {
  const {
    onMatchCreated,
    onGameState,
    onGameResult,
    onRematchReady,
    onPlayerDisconnected,
    onPlayerReconnected,
    onForfeit,
    onError,
  } = useGameStore();

  useEffect(() => {
    socketService.connect();

    socketService.on<{ matchId: string }>(ServerEvent.MatchCreated, onMatchCreated);
    socketService.on<GameState>(ServerEvent.GameState, onGameState);
    socketService.on<MatchResult>(ServerEvent.GameResult, onGameResult);
    socketService.on<{ matchId: string }>(ServerEvent.GameRematchReady, onRematchReady);
    socketService.on<{ playerName: string; timeoutMs: number }>(ServerEvent.PlayerDisconnected, onPlayerDisconnected);
    socketService.on<{ playerName: string }>(ServerEvent.PlayerReconnected, onPlayerReconnected);
    socketService.on<{ winner: string }>(ServerEvent.MatchForfeit, onForfeit);
    socketService.on<ErrorPayload>(ServerEvent.Error, onError);

    return () => {
      socketService.off(ServerEvent.MatchCreated);
      socketService.off(ServerEvent.GameState);
      socketService.off(ServerEvent.GameResult);
      socketService.off(ServerEvent.GameRematchReady);
      socketService.off(ServerEvent.PlayerDisconnected);
      socketService.off(ServerEvent.PlayerReconnected);
      socketService.off(ServerEvent.MatchForfeit);
      socketService.off(ServerEvent.Error);
      socketService.disconnect();
    };
  }, [
    onMatchCreated,
    onGameState,
    onGameResult,
    onRematchReady,
    onPlayerDisconnected,
    onPlayerReconnected,
    onForfeit,
    onError,
  ]);
}
