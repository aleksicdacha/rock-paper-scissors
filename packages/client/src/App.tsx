import { useSocket } from './hooks/useSocket';
import { useGameStore } from './store/gameStore';
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
  useSocket();
  const phase = useGameStore((s) => s.phase);

  switch (phase) {
    case PHASE_IDLE:
      return <LobbyView />;
    case PHASE_WAITING:
      return <LobbyView />;
    case PHASE_PLAYING:
      return <GameView />;
    case PHASE_RESOLVED:
      return <ResultView />;
    case PHASE_FINISHED:
      return <ResultView />;
  }
};
