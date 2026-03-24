export interface MatchCallbacks {
  onRoundResolved(matchId: string): void;
  onForfeit(matchId: string): void;
}
