import { Move } from '@rps/shared';
import { Match } from './Match.interface';

export interface GameService {
  startRound(matchId: string): Promise<Match>;
  submitMove(matchId: string, playerId: string, move: Move): Promise<{ match: Match; resolved: boolean }>;
  requestRematch(matchId: string, playerId: string): Promise<{ match: Match; ready: boolean }>;
  forfeit(matchId: string, loserId: string): Promise<Match>;
  clearMoveTimer(matchId: string): void;
}
