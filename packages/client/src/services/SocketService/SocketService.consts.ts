export const PLAYER_ID_KEY = 'rps_player_id';

function requireEnv(name: string): string {
  const value = import.meta.env[name] as string | undefined;
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const SERVER_URL = requireEnv('VITE_SERVER_URL');
