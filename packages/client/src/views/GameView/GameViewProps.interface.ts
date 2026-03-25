import { Move } from '@rps/shared';

export interface GameViewProps {
  playerName: string;
  playerScore: number;
  playerMoved: boolean;
  opponentName: string;
  opponentScore: number;
  opponentMoved: boolean;
  timeoutAt: number | null;
  selectedMove: Move | null;
  opponentDisconnected: boolean;
  onMove: (move: Move) => void;
}
