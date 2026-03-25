import { Player } from '@rps/shared';
import { Match } from './Match.interface';

export interface MatchService {
  get(matchId: string): Promise<Match | undefined>;
  getAll(): Promise<Match[]>;
  create(player: Player): Promise<Match>;
  join(matchId: string, player: Player): Promise<Match>;
  leave(matchId: string, playerId: string): Promise<Match>;
  disconnect(matchId: string, playerId: string): Promise<Match | null>;
  reconnect(matchId: string, playerId: string, socketId: string): Promise<Match>;
}
