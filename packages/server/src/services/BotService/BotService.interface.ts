import { Match } from '../../models/Match.interface';

export interface BotService {
  afterMatchCreated(match: Match): Promise<Match | null>;
  afterRematchRequested(matchId: string): Promise<{ match: Match; ready: boolean } | null>;
}
