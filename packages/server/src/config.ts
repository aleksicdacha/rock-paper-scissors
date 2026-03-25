function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: parseInt(requireEnv('PORT'), 10),
  redis: {
    url: requireEnv('REDIS_URL'),
  },
  match: {
    prefix: requireEnv('MATCH_PREFIX'),
    ttlSeconds: parseInt(requireEnv('MATCH_TTL_SECONDS'), 10),
  },
  timer: {
    moveTimeoutMs: parseInt(requireEnv('MOVE_TIMEOUT_MS'), 10),
    reconnectTimeoutMs: parseInt(requireEnv('RECONNECT_TIMEOUT_MS'), 10),
  },
  corsOrigin: requireEnv('CORS_ORIGIN'),
} as const;
