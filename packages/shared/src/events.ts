export enum ClientEvent {
  MatchCreate = 'match:create',
  MatchJoin = 'match:join',
  GameMove = 'game:move',
  GameRematch = 'game:rematch',
  MatchLeave = 'match:leave',
}

export enum ServerEvent {
  MatchCreated = 'match:created',
  MatchJoined = 'match:joined',
  GameState = 'game:state',
  GameResult = 'game:result',
  GameRematchReady = 'game:rematch_ready',
  PlayerDisconnected = 'player:disconnected',
  PlayerReconnected = 'player:reconnected',
  MatchForfeit = 'match:forfeit',
  Error = 'error',
}
