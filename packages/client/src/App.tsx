import { useSocket } from './hooks/useSocket';
import { useGameStore } from './store/gameStore';
import { useLobby } from './hooks/useLobby';
import { useGame } from './hooks/useGame';
import { useResult } from './hooks/useResult';
import { socketService } from './services/SocketService';
import {
  PHASE_IDLE,
  PHASE_WAITING,
  PHASE_PLAYING,
  PHASE_RESOLVED,
  PHASE_FINISHED,
} from './consts';
import { LobbyView } from './views/LobbyView';
import { GameView } from './views/GameView';
import { ResultView } from './views/ResultView';

export const App = () => {
  useSocket(socketService);
  const phase = useGameStore((s) => s.phase);
  const lobbyProps = useLobby(socketService);
  const gameProps = useGame(socketService);
  const resultProps = useResult(socketService);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {(() => {
          switch (phase) {
            case PHASE_IDLE:
            case PHASE_WAITING:
              return <LobbyView {...lobbyProps} />;
            case PHASE_PLAYING:
              return <GameView {...gameProps} />;
            case PHASE_RESOLVED:
            case PHASE_FINISHED:
              return <ResultView {...resultProps} />;
          }
        })()}
      </div>
    </div>
  );
};
