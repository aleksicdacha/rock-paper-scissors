import { useGameStore } from '../store/gameStore';
import { PHASE_WAITING } from '../store/GameStore.consts';
import { LobbyViewProps } from '../views/LobbyView/LobbyViewProps.interface';
import { SocketService } from '../services/SocketService/SocketService.interface';

export function useLobby(socket: SocketService): LobbyViewProps {
  const { phase, matchId, error } = useGameStore();

  const onCreate = (name: string) => {
    socket.createMatch(name);
  };

  const onPlayComputer = (name: string) => {
    socket.createMatch(name, 'computer');
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
    onCreate,
    onPlayComputer,
    onJoin,
    onCopy,
  };
}
