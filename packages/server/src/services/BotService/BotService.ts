import { Move, BOT_PLAYER_ID, ROCK, PAPER, SCISSORS, COMPUTER } from '@rps/shared';
import { Match } from '../../models/Match.interface';
import { GameService } from '../GameService/GameService.interface';
import { MatchService } from '../MatchService/MatchService.interface';

const MOVES: Move[] = [ROCK, PAPER, SCISSORS];

function randomMove(): Move {
  return MOVES[Math.floor(Math.random() * MOVES.length)];
}

export class BotService {
  constructor(
    private readonly matchService: MatchService,
    private readonly gameService: GameService,
  ) {}

  async afterMatchCreated(match: Match): Promise<Match | null> {
    if (match.mode !== COMPUTER) return null;

    const bot = { id: BOT_PLAYER_ID, name: 'Computer', socketId: '' };
    await this.matchService.join(match.id, bot);
    const { match: started } = await this.gameService.submitMove(match.id, BOT_PLAYER_ID, randomMove());
    return started;
  }

  async afterRematchRequested(matchId: string): Promise<{ match: Match; ready: boolean } | null> {
    const match = await this.matchService.get(matchId);
    if (!match || match.mode !== COMPUTER) return null;

    const { match: updated, ready } = await this.gameService.requestRematch(matchId, BOT_PLAYER_ID);
    if (ready) {
      const { match: started } = await this.gameService.submitMove(matchId, BOT_PLAYER_ID, randomMove());
      return { match: started, ready };
    }
    return { match: updated, ready };
  }
}
