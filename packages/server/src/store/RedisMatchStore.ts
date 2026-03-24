import Redis from 'ioredis';
import { config } from '../config';
import { Match } from '../interfaces/Match.interface';
import { MatchStore } from '../interfaces/MatchStore.interface';

export class RedisMatchStore implements MatchStore {
  constructor(private readonly redis: Redis) {}

  async get(matchId: string): Promise<Match | undefined> {
    const data = await this.redis.get(this.key(matchId));
    return data ? (JSON.parse(data) as Match) : undefined;
  }

  async set(matchId: string, match: Match): Promise<void> {
    await this.redis.set(
      this.key(matchId),
      JSON.stringify(match),
      'EX',
      config.match.ttlSeconds,
    );
  }

  async delete(matchId: string): Promise<void> {
    await this.redis.del(this.key(matchId));
  }

  async all(): Promise<Match[]> {
    const keys = await this.redis.keys(`${config.match.prefix}*`);
    if (keys.length === 0) return [];

    const values = await this.redis.mget(...keys);
    return values.filter((v): v is string => v !== null).map((v) => JSON.parse(v) as Match);
  }

  private key(matchId: string): string {
    return `${config.match.prefix}${matchId}`;
  }
}
