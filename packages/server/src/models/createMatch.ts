import { MatchMode, Player, PVP, WAITING } from '@rps/shared';
import { Match } from './Match.interface';

export function createMatch(id: string, player: Player, mode: MatchMode = PVP): Match {
  return {
    id,
    mode,
    players: [player, null],
    state: WAITING,
    rounds: [],
    scores: [0, 0],
    moves: [null, null],
    timeoutAt: null,
    disconnectedPlayer: null,
    rematchRequested: [false, false],
    winner: null,
  };
}

export function playerIndex(match: Match, playerId: string): 0 | 1 {
  if (match.players[0].id === playerId) return 0;
  if (match.players[1]?.id === playerId) return 1;
  throw new Error('Player not in match');
}
