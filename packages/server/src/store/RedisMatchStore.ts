import Redis from 'ioredis';
import { Match } from '../interfaces/Match.interface';
import { MatchStore } from '../interfaces/MatchStore.interface';

const MATCH_PREFIX = 'match:';
const MATCH_TTL_SECONDS = 3600;

export class RedisMatchStore implements MatchStore {
  constructor(private readonly redis: Redis) {}

  async get(matchId: string): Promise<Match | undefined> {
    const data = await this.redis.get(this.key(matchId));
    return data ? (JSON.parse(data) as Match) : undefined;
  }

  async set(matchId: string, match: Match): Promise<void> {
    await this.redis.set(this.key(matchId), JSON.stringify(match), 'EX', MATCH_TTL_SECONDS);
  }

  async delete(matchId: string): Promise<void> {
    await this.redis.del(this.key(matchId));
  }

  async all(): Promise<Match[]> {
    const keys = await this.redis.keys(`${MATCH_PREFIX}*`);
    if (keys.length === 0) return [];

    const values = await this.redis.mget(...keys);
    return values.filter((v): v is string => v !== null).map((v) => JSON.parse(v) as Match);
  }

  private key(matchId: string): string {
    return `${MATCH_PREFIX}${matchId}`;
  }
}
