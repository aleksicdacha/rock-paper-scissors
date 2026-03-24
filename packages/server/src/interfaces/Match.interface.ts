import { MatchState, Move, Player, RoundResult } from '@rps/shared';

export interface Match {
  id: string;
  players: [Player, Player | null];
  state: MatchState;
  rounds: RoundResult[];
  scores: [number, number];
  moves: [Move | null, Move | null];
  timeoutAt: number | null;
  disconnectedPlayer: string | null;
  rematchRequested: [boolean, boolean];
  winner: string | null;
}
