import { useGameStore } from '../store/gameStore';
import { PHASE_WAITING } from '../consts';
import { LobbyViewProps } from '../interfaces/LobbyViewProps.interface';
import { SocketService } from '../interfaces/SocketService.interface';

export function useLobby(socket: SocketService): LobbyViewProps {
  const { phase, matchId, error } = useGameStore();

  const onCreate = (name: string) => {
    socket.createMatch(name);
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
    onJoin,
    onCopy,
  };
}
