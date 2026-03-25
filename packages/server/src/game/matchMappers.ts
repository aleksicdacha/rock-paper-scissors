import { GameState, MatchResult, ENDED } from '@rps/shared';
import { Match } from '../models/Match.interface';

export function buildGameState(match: Match): GameState {
  return {
    matchId: match.id,
    players: [
      { id: match.players[0].id, name: match.players[0].name },
      { id: match.players[1]!.id, name: match.players[1]!.name },
    ],
    state: match.state,
    round: match.rounds.length + 1,
    scores: match.scores,
    timeoutAt: match.timeoutAt,
    moved: [match.moves[0] !== null, match.moves[1] !== null],
  };
}

export function buildMatchResult(match: Match): MatchResult {
  const lastRound = match.rounds[match.rounds.length - 1];
  const winnerId =
    lastRound.winner !== null
      ? match.players[lastRound.winner]!.id
      : null;
  return {
    matchId: match.id,
    round: lastRound,
    scores: match.scores,
    winner: winnerId,
    finished: match.state === ENDED,
  };
}
