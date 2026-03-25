import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const serverUrl = env.VITE_SERVER_URL;
  if (!serverUrl) throw new Error('Missing required env var: VITE_SERVER_URL');
  const port = parseInt(env.VITE_PORT || '5173', 10);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@rps/shared': path.resolve(__dirname, '../shared/src'),
      },
    },
    server: {
      host: true,
      port,
      proxy: {
        '/socket.io': {
          target: serverUrl,
          ws: true,
        },
      },
    },
  };
});
