import { Match } from '../models/Match.interface';

export interface MatchStore {
  get(matchId: string): Promise<Match | undefined>;
  set(matchId: string, match: Match): Promise<void>;
  delete(matchId: string): Promise<void>;
  all(): Promise<Match[]>;
}
