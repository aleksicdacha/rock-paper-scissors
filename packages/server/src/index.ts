import 'dotenv/config';
import http from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import { config } from './config';
import { RedisMatchStore } from './store/RedisMatchStore/RedisMatchStore';
import { GameService } from './services/GameService/GameService';
import { MatchService } from './services/MatchService/MatchService';
import { BotService } from './services/BotService/BotService';
import { SocketGateway } from './gateway/SocketGateway/SocketGateway';
import { logger } from './logger';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: config.corsOrigin },
});

const redis = new Redis(config.redis.url);
const store = new RedisMatchStore(redis);

const callbackHolder: { gateway?: SocketGateway } = {};
const gameService = new GameService(store, {
  onRoundResolved: (matchId) => callbackHolder.gateway?.onRoundResolved(matchId),
  onForfeit: (matchId) => callbackHolder.gateway?.onForfeit(matchId),
});
const matchService = new MatchService(store, gameService);
const botService = new BotService(matchService, gameService);
const gateway = new SocketGateway(io, matchService, gameService, botService);
callbackHolder.gateway = gateway;

gateway.registerHandlers();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

server.listen(config.port, () => {
  logger.info({ port: config.port }, 'Server listening');
});
