import { Player } from '@rps/shared';
import { Match } from '../interfaces/Match.interface';

export function createMatch(id: string, player: Player): Match {
  return {
    id,
    players: [player, null],
    state: 'WAITING',
    rounds: [],
    scores: [0, 0],
    moves: [null, null],
    timeoutAt: null,
    disconnectedPlayer: null,
    rematchRequested: [false, false],
    winner: null,
  };
}
