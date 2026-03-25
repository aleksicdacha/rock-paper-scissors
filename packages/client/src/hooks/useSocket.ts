import { useEffect } from 'react';
import { ServerEvent } from '@rps/shared';
import { useGameStore } from '../store/gameStore';
import { GameStoreActions } from '../store/GameStore.interface';
import { SocketService } from '../services/SocketService/SocketService.interface';

type EventBinding = [ServerEvent, (...args: never[]) => void];

function buildEventBindings(actions: GameStoreActions): EventBinding[] {
  return [
    [ServerEvent.MatchCreated, actions.onMatchCreated],
    [ServerEvent.GameState, actions.onGameState],
    [ServerEvent.GameResult, actions.onGameResult],
    [ServerEvent.GameRematchReady, actions.onRematchReady],
    [ServerEvent.PlayerDisconnected, actions.onPlayerDisconnected],
    [ServerEvent.PlayerReconnected, actions.onPlayerReconnected],
    [ServerEvent.MatchForfeit, actions.onForfeit],
    [ServerEvent.Error, actions.onError],
  ];
}

export function useSocket(socket: SocketService): void {
  const store = useGameStore();

  useEffect(() => {
    socket.connect();

    const bindings = buildEventBindings(store);
    bindings.forEach(([event, handler]) => socket.on(event, handler));

    return () => {
      bindings.forEach(([event]) => socket.off(event));
      socket.disconnect();
    };
  }, [socket, store]);
}
