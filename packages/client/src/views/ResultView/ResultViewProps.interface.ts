export interface ResultViewProps {
  isFinished: boolean;
  youWon: boolean;
  isDraw: boolean;
  isForfeit: boolean;
  roundLabel: string;
  yourMove: string;
  theirMove: string;
  playerScore: number;
  opponentScore: number;
  onRematch: () => void;
  onLeave: () => void;
}
