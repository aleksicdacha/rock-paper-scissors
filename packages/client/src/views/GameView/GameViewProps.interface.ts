import { Move } from '@rps/shared';

export interface GameViewProps {
  playerName: string;
  playerScore: number;
  playerMoved: boolean;
  opponentName: string;
  opponentScore: number;
  opponentMoved: boolean;
  round: number;
  bestOf: number;
  timeoutAt: number | null;
  selectedMove: Move | null;
  opponentDisconnected: boolean;
  onMove: (move: Move) => void;
}
