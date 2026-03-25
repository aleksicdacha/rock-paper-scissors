import { MatchMode, Player } from '@rps/shared';
import { Match } from '../../models/Match.interface';

export interface MatchService {
  get(matchId: string): Promise<Match | undefined>;
  getAll(): Promise<Match[]>;
  create(player: Player, mode?: MatchMode): Promise<Match>;
  join(matchId: string, player: Player): Promise<Match>;
  leave(matchId: string, playerId: string): Promise<Match>;
  disconnect(matchId: string, playerId: string): Promise<Match | null>;
  reconnect(matchId: string, playerId: string, socketId: string): Promise<Match>;
}
