import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { PHASE_WAITING } from '../store/GameStore.consts';
import { LobbyViewProps } from '../views/LobbyView/LobbyViewProps.interface';
import { SocketService } from '../services/SocketService/SocketService.interface';
import { gameConfig } from '../gameConfig';

export function useLobby(socket: SocketService): LobbyViewProps {
  const { phase, matchId, error } = useGameStore();
  const [bestOf, setBestOf] = useState(gameConfig.lobby.bestOfOptions[0]);

  const onCreate = (name: string) => {
    socket.createMatch(name, undefined, bestOf, gameConfig.game.moveTimeoutMs);
  };

  const onPlayComputer = (name: string) => {
    socket.createMatch(name, 'computer', bestOf, gameConfig.game.moveTimeoutMs);
  };

  const onJoin = (matchId: string, name: string) => {
    socket.joinMatch(matchId, name);
  };

  const onCopy = () => {
    if (matchId) navigator.clipboard.writeText(matchId);
  };

  return {
    isWaiting: phase === PHASE_WAITING,
    matchId,
    error,
    bestOf,
    onBestOfChange: setBestOf,
    onCreate,
    onPlayComputer,
    onJoin,
    onCopy,
  };
}
