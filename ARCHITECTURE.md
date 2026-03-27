# ARCHITECTURE.md — Real-Time Multiplayer Rock Paper Scissors

> Arkadium Coding Challenge Submission  
> Game: Rock Paper Scissors (2-player, real-time)  
> Stack: Node.js · TypeScript · React · Socket.IO · Redis · Docker

---

## Table of Contents

1. [Original Challenge Requirements](#original-challenge-requirements)
2. [Tech Stack & Rationale](#tech-stack--rationale)
3. [High-Level Architecture](#high-level-architecture)
4. [Project Structure](#project-structure)
5. [Component Design & SOLID Principles](#component-design--solid-principles)
6. [Game State Flow](#game-state-flow)
7. [WebSocket Event Contract](#websocket-event-contract)
8. [Matchmaking & Lobby](#matchmaking--lobby)
9. [Disconnection Handling](#disconnection-handling)
10. [Player Identity & Auth](#player-identity--auth)
11. [Scalability Strategy (2 → 10,000 Players)](#scalability-strategy)
12. [Asset Delivery & CDN Strategy](#asset-delivery--cdn-strategy)
13. [Pub/Sub & Event Architecture](#pubsub--event-architecture)
14. [Observability & Logging](#observability--logging)
15. [Testing Strategy](#testing-strategy)
16. [Running the Project Locally](#running-the-project-locally)

---

## Original Challenge Requirements

### Overview

Design and build a **simple real-time multiplayer game** that two or more players can join and play simultaneously in a web browser.

The game itself can be minimal — the primary focus of this challenge is **how you architect the system**, not the complexity of the gameplay. We want to understand how you think about real-time communication, resource delivery, scalability, and the full lifecycle of a multiplayer experience.

### What We're Evaluating

- **Architecture & System Design** — How do you structure the client, server, and communication layer? What are the boundaries between them? How would your design evolve if the player count scaled from 2 to 2,000?
- **Real-Time Communication** — How do you handle WebSockets, matchmaking, and game state synchronization? What trade-offs are you making between consistency, latency, and bandwidth?
- **Resource Delivery** — How are static assets (HTML, JS, images, audio) served? Would you use a CDN? How do you think about caching, versioning, and load times?
- **State Management** — Where does authoritative game state live? How do you handle conflicts, disconnections, and reconnections?
- **Pub/Sub & Event Architecture** — How do game events flow through the system? Is there a message broker or event bus? How would you decouple components?
- **Code Quality & Pragmatism** — Clean, readable code. Sensible abstractions. Evidence of YAGNI thinking — build what's needed, not everything imaginable.

### The Challenge

#### Build a real-time multiplayer game that supports:

1. **Lobby / Matchmaking** — Players can create or join a game session.
2. **Real-Time Gameplay** — At least two players interact in the same shared game state with updates reflected in near real-time.
3. **Game Resolution** — The game has a win/lose/draw condition and handles end-of-game gracefully.
4. **Disconnection Handling** — If a player drops, the system handles it reasonably (timeout, forfeit, reconnect window — your call).

#### Technical Requirements

**Must Have**
- A web-based client (HTML/JS — any framework or vanilla).
- A server component that owns authoritative game state.
- Real-time communication between client and server (WebSockets, or framework equivalent).
- A README explaining your architecture, decisions, and how to run the project.

**Recommended**
- Nakama as your game server, or an equivalent justifiable alternative (Socket.IO, Colyseus, custom Node.js, Firebase Realtime DB).

**Nice to Have**
- Containerized setup (Docker Compose to spin up the full stack).
- A simple CDN or asset serving strategy (even if described in the README).
- Basic observability: logging of game events, match lifecycle, or player actions.
- Automated tests for server-side game logic.
- CI pipeline or Makefile for build/run.

#### Evaluation Rubric

| Area | Weight | What We Look For |
|---|---|---|
| System Design & Architecture | 30% | Clear separation of concerns, scalability thinking, well-reasoned component boundaries |
| Real-Time & Networking | 25% | Correct use of WebSockets/Nakama, state sync strategy, latency awareness |
| Code Quality | 20% | Readable, maintainable code with sensible abstractions and minimal over-engineering |
| Documentation & Communication | 15% | Clear README, architecture rationale, honest reflection on trade-offs |
| Extras & Polish | 10% | Docker setup, tests, observability, CDN strategy, CI — anything that shows engineering maturity |

---

## Tech Stack & Rationale

| Layer | Technology | Why |
|---|---|---|
| **Client** | React + TypeScript + Vite | Component model maps naturally to game UI states (lobby, playing, result). Vite gives fast HMR and optimized production builds. TypeScript enforces the shared event contract. |
| **Client State** | Zustand | Minimal, hook-based state management. No boilerplate. Store actions map 1:1 to server events. |
| **Client Styling** | Tailwind CSS v4 + react-icons | Utility-first CSS avoids style drift. SVG hand gesture icons from `react-icons/fa`. |
| **Server** | Node.js + TypeScript + Express | Familiar, non-blocking I/O is ideal for many concurrent WebSocket connections. Shares TypeScript types with the client via a `shared/` package. |
| **Real-Time Transport** | Socket.IO | Battle-tested WebSocket abstraction with built-in rooms (perfect for match sessions), automatic reconnection, and fallback transport. Avoids Nakama overhead for a 2-player turn-based game. |
| **State Store** | Redis (via ioredis) | All match state persisted in Redis with TTL. `MatchStore` interface keeps business logic decoupled from storage. Proves the abstraction works — swapping to a different store requires zero changes to services. |
| **Shared Types** | `packages/shared` (TypeScript) | Single source of truth for all event names, payloads, and game domain types. Eliminates client/server contract drift. |
| **Containerization** | Docker + Docker Compose | One command to run the full stack. Redis service, game server, and client container in `docker-compose.yml`. |
| **Unit Testing** | Vitest | Native ESM support, fast, same config as Vite. Server-side game logic is pure functions — easy to unit test with no mocking overhead. |
| **E2E Testing** | Playwright | Browser-based E2E tests against real server + client. Dual `webServer` config spins up both server and client for test runs. |
| **Linting / Formatting** | ESLint (flat config) + Prettier | Enforced code style. ESLint v10 flat config (`eslint.config.mjs`). Non-negotiable at this seniority level. |

### Why Socket.IO over Nakama

Nakama's authoritative multiplayer model is architected around a **tick-rate loop** — a fixed-interval server cycle inherited from real-time action games where the server is continuously simulating physics, running AI, or reconciling positional state across many clients. That model is the right answer for a shooter, an RTS, or any game where the world evolves independently of player input.

RPS is a fundamentally different problem. It is an **event-driven, turn-based, low-frequency state machine**. The server has nothing to compute between player actions. The correct server model is: receive event → validate → mutate state → broadcast delta. That's the entire runtime.

Forcing that model into Nakama's match loop means either leaving the loop body empty on every tick — wasting cycles on a no-op — or contorting the design to fit a paradigm that doesn't apply. Either way, the abstraction works against the architecture rather than for it.

Socket.IO's room-based pub/sub maps directly to the problem domain: a match is a room, moves are events, resolution is a broadcast. The transport primitive and the game primitive are the same thing. There is no impedance mismatch.

This is a tool-to-problem fit decision, not a complexity-avoidance decision. At scale — if this were a persistent ranked ladder with thousands of concurrent matches, replay storage, and cross-region presence — Nakama or a purpose-built game backend becomes the right answer. That evolution path is described in the [Scalability Strategy](#scalability-strategy) section.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          CDN / Static Host                        │
│              (Cloudfront / Nginx in Docker locally)               │
│                   Serves: HTML, JS bundles, assets                │
└────────────────────────────┬─────────────────────────────────────┘
                             │  HTTP (initial page load)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                        React Client (Vite)                        │
│                                                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐  │
│  │ useLobby │    │ useGame  │    │ useResult│    │ useSocket  │  │
│  │ (hook)   │    │ (hook)   │    │ (hook)   │    │ (hook)     │  │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └─────┬─────┘  │
│       │               │               │                 │        │
│  ┌────▼─────┐    ┌────▼─────┐    ┌────▼──────┐         │        │
│  │LobbyView │    │ GameView │    │ResultView │     Zustand      │
│  │ (render) │    │ (render) │    │ (render)  │    gameStore     │
│  └──────────┘    └──────────┘    └───────────┘         │        │
│                                                         │        │
│  ┌──────────────────────────────────────────────────────▼──────┐ │
│  │                SocketService (singleton)                      │ │
│  │       Manages connection lifecycle, emits & listens          │ │
│  └──────────────────────────┬───────────────────────────────── ┘ │
└─────────────────────────────┼────────────────────────────────────┘
                              │  WebSocket (Socket.IO)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Game Server (Node.js)                        │
│                                                                   │
│  ┌────────────────┐   ┌─────────────┐   ┌────────────────────┐  │
│  │  SocketGateway │   │MatchService │   │   GameService      │  │
│  │  (I/O handler) │──▶│ (lifecycle) │──▶│ (state + timers)   │  │
│  └────────────────┘   └─────────────┘   └────────────────────┘  │
│         │                                        │               │
│         ▼                                        ▼               │
│  ┌────────────┐                         ┌─────────────────┐     │
│  │ BotService │                         │  gameLogic.ts   │     │
│  │ (vs CPU)   │                         │ (pure functions) │     │
│  └────────────┘                         └─────────────────┘     │
│                                                                   │
│                       ┌─────────────────────────────────────┐    │
│                       │ RedisMatchStore → Redis (ioredis)    │    │
│                       │  Match { id, mode, bestOf, players,  │    │
│                       │  state, rounds, scores, moveTimeoutMs}│    │
│                       └─────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

The client is a static Single Page Application. All authoritative game logic lives on the server. The client never computes the winner — it only sends player intent and renders server-emitted state.

**Client architecture follows the Container/Presentational pattern:** Views (LobbyView, GameView, ResultView) are pure render functions that accept only props. All store access, service calls, and derived state live in container hooks (`useLobby`, `useGame`, `useResult`). `App.tsx` acts as the composition root, wiring hooks to views.

---

## Project Structure

```
paper-rock-scissors/
├── packages/
│   ├── shared/                          # Shared TypeScript types & constants
│   │   └── src/
│   │       ├── consts.ts                # ROCK, PAPER, SCISSORS, WINS_OVER, BOT_PLAYER_ID, state constants
│   │       ├── events.ts               # ClientEvent & ServerEvent enums
│   │       ├── types.ts                # Move, MatchMode, MatchState, Player, RoundResult, GameState, MatchResult, ErrorPayload
│   │       └── index.ts                # Barrel re-exports
│   │
│   ├── server/                          # Node.js game server
│   │   ├── src/
│   │   │   ├── index.ts                # Entry point: Express + Socket.IO + Redis bootstrap with DI wiring
│   │   │   ├── config.ts               # requireEnv() — all env vars required, no fallbacks
│   │   │   ├── logger.ts               # pino structured JSON logger
│   │   │   │
│   │   │   ├── models/
│   │   │   │   ├── Match.interface.ts   # Match domain model interface
│   │   │   │   └── createMatch.ts       # Factory function + playerIndex() helper
│   │   │   │
│   │   │   ├── store/
│   │   │   │   ├── MatchStore.interface.ts      # Async store interface (get, set, delete, all)
│   │   │   │   └── RedisMatchStore/
│   │   │   │       └── RedisMatchStore.ts       # Redis-backed implementation with JSON serialization + TTL
│   │   │   │
│   │   │   ├── game/
│   │   │   │   ├── gameLogic.ts         # Pure functions: resolveRound(), determineWinner()
│   │   │   │   └── matchMappers.ts      # buildGameState(), buildMatchResult() — payload builders
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── GameService/
│   │   │   │   │   ├── GameService.ts           # Stateful: startRound, submitMove, requestRematch, forfeit, move timers
│   │   │   │   │   └── GameService.interface.ts # Interface consumed by MatchService & SocketGateway
│   │   │   │   ├── MatchService/
│   │   │   │   │   ├── MatchService.ts          # Match lifecycle: create, join, leave, disconnect, reconnect
│   │   │   │   │   └── MatchService.interface.ts
│   │   │   │   └── BotService/
│   │   │   │       ├── BotService.ts            # Virtual client for vs Computer mode (random moves)
│   │   │   │       └── BotService.interface.ts
│   │   │   │
│   │   │   └── gateway/
│   │   │       └── SocketGateway/
│   │   │           ├── SocketGateway.ts         # I/O-only: socket events ↔ service calls + logging
│   │   │           └── MatchCallbacks.interface.ts  # onRoundResolved, onForfeit — timer-driven events
│   │   │
│   │   └── tests/
│   │       ├── gameLogic.test.ts        # 6 test definitions (including it.each): all move combos + null/timeout
│   │       ├── matchMappers.test.ts     # 10: buildGameState + buildMatchResult payload shapes
│   │       ├── createMatch.test.ts      # 12: factory function + playerIndex helper
│   │       ├── GameService.test.ts      # 29 test definitions (including it.each): moves, timers, rematch, forfeit
│   │       ├── MatchService.test.ts     # 26: create, join, leave, disconnect/reconnect timers
│   │       └── BotService.test.ts       # 7: afterMatchCreated, afterRematchRequested, PVP passthrough
│   │
│   └── client/                          # React SPA (Vite + Tailwind CSS v4)
│       ├── src/
│       │   ├── main.tsx                 # React entry point
│       │   ├── App.tsx                  # Composition root: hooks → views by phase
│       │   ├── gameConfig.ts            # All UI strings, bestOfOptions, moveTimeoutMs — single config source
│       │   │
│       │   ├── services/
│       │   │   └── SocketService/
│       │   │       ├── SocketService.ts         # Singleton Socket.IO client wrapper
│       │   │       ├── SocketService.interface.ts   # Interface consumed by all hooks
│       │   │       └── SocketService.consts.ts  # PLAYER_ID_KEY, SERVER_URL
│       │   │
│       │   ├── store/
│       │   │   ├── gameStore.ts         # Zustand store: server event → state
│       │   │   ├── GameStore.interface.ts   # GameStoreState + GameStoreActions interfaces
│       │   │   ├── GameStore.types.ts   # Phase type
│       │   │   ├── GameStore.consts.ts  # PHASE_* constants, INITIAL_GAME_STATE
│       │   │   └── phaseFromMatchState.ts   # MatchState → Phase lookup
│       │   │
│       │   ├── hooks/
│       │   │   ├── useSocket.ts         # Data-driven event binding (ServerEvent → store action)
│       │   │   ├── useLobby.ts          # Container hook: store + service → LobbyViewProps
│       │   │   ├── useGame.ts           # Container hook: store + service → GameViewProps
│       │   │   └── useResult.ts         # Container hook: store + service → ResultViewProps
│       │   │
│       │   ├── views/
│       │   │   ├── LobbyView/
│       │   │   │   ├── LobbyView.tsx            # Pure render: create/join + vs Computer + best-of-N selector
│       │   │   │   └── LobbyViewProps.interface.ts
│       │   │   ├── GameView/
│       │   │   │   ├── GameView.tsx             # Pure render: player status, timer, move selector
│       │   │   │   └── GameViewProps.interface.ts
│       │   │   └── ResultView/
│       │   │       ├── ResultView.tsx           # Pure render: round/match result + emoji animations
│       │   │       └── ResultViewProps.interface.ts
│       │   │
│       │   └── components/
│       │       ├── CountdownTimer/
│       │       │   ├── CountdownTimer.tsx        # Interval-based countdown from timeoutAt
│       │       │   ├── CountdownTimerProps.interface.ts
│       │       │   ├── CountdownTimer.consts.ts
│       │       │   └── calcRemaining.ts         # Pure helper: timeoutAt → seconds remaining
│       │       ├── MoveSelector/
│       │       │   ├── MoveSelector.tsx          # Data-driven icon buttons (ROCK/PAPER/SCISSORS)
│       │       │   ├── MoveSelectorProps.interface.ts
│       │       │   └── MoveSelector.consts.ts   # MOVE_ICON, MOVE_LABEL Record maps
│       │       └── PlayerStatus/
│       │           ├── PlayerStatus.tsx          # Card: name, score, moved indicator, "you" label
│       │           └── PlayerStatusProps.interface.ts
│       │
│       └── e2e/
│           └── app.spec.ts              # 11 Playwright E2E tests: lobby, join, full game, rematch, leave
│
├── docker-compose.yml                   # Redis + server + client services
├── eslint.config.mjs                    # ESLint v10 flat config
├── Makefile                             # dev, test, lint, clean shortcuts
└── README.md
```

---

## Component Design & SOLID Principles

The server is designed around a clear separation of responsibilities. Each class has a single reason to change. Every dependency injection point programs to an interface — concrete implementations are only referenced in the composition root (`index.ts`).

### Single Responsibility Principle

- **`SocketGateway`** — owns *only* the translation between raw socket events and service calls. It has no game logic. Also implements `MatchCallbacks` for timer-driven broadcasts.
- **`MatchService`** — owns *only* the match lifecycle: create, join, leave, disconnect/reconnect. It delegates all game state transitions to `GameService`.
- **`GameService`** — owns *only* game state transitions: round start, move submission, rematch, forfeit. Manages move timers (server-authoritative). Does NOT own pure game rules — those live in `gameLogic.ts`.
- **`gameLogic.ts`** — pure functions (`resolveRound`, `determineWinner`) with no state, no I/O, no dependencies. Adding a new game variant requires adding to the rules matrix, not modifying the resolution algorithm.
- **`BotService`** — owns *only* the vs-Computer virtual client logic. Submits random moves on behalf of the bot player.
- **`RedisMatchStore`** — owns *only* the Redis persistence of active matches. It does not emit events or contain logic.
- **`matchMappers.ts`** — pure payload builders (`buildGameState`, `buildMatchResult`) that project internal `Match` state into the `GameState`/`MatchResult` types the client receives.

### Open/Closed Principle

**Server:** `resolveRound(move1, move2)` is a pure function. Adding a new game (e.g. RPS-Lizard-Spock) requires extending the `WINS_OVER` lookup table in `shared/consts.ts`, not modifying the resolution algorithm.

**Client:** `useSocket` uses a data-driven binding system — `buildEventBindings()` returns `[ServerEvent, handler][]` tuples. Adding a new server event requires adding one tuple to the array. No scattered subscribe/unsubscribe code to update. This satisfies Open/Closed and scales horizontally (new game modes, spectator mode = more tuples).

### Liskov Substitution / Interface Segregation

`MatchStore` is an async interface consumed by `MatchService` and `GameService`. The implementation is `RedisMatchStore` (Redis-backed with JSON serialization and TTL). A different store (e.g. DynamoDB, Postgres) can be swapped in with zero changes to the service layer.

```typescript
// store/MatchStore.interface.ts
export interface MatchStore {
  get(matchId: string): Promise<Match | undefined>;
  set(matchId: string, match: Match): Promise<void>;
  delete(matchId: string): Promise<void>;
  all(): Promise<Match[]>;
}
```

### Dependency Inversion Principle

Every DI point programs to an interface. Concrete implementations are only imported in the composition root.

**Server interfaces:**
- `MatchStore` ← `RedisMatchStore`
- `MatchCallbacks` ← `SocketGateway`
- `GameService` interface ← `GameService` class
- `MatchService` interface ← `MatchService` class
- `BotService` interface ← `BotService` class

**Client interfaces:**
- `SocketService` interface ← `SocketService` class (all 4 hooks accept the interface, not the concrete)
- `GameStoreState` / `GameStoreActions` interfaces ← Zustand store

No `implements` keyword needed — TypeScript's structural typing enforces the contract. Class satisfies interface if shapes match.

```typescript
// Composition root: server/src/index.ts
const redis = new Redis(config.redis.url);
const store = new RedisMatchStore(redis);

// Deferred callback pattern resolves circular SocketGateway ↔ GameService dependency
const callbackHolder: { gateway?: SocketGateway } = {};
const gameService = new GameService(store, {
  onRoundResolved: (matchId) => callbackHolder.gateway?.onRoundResolved(matchId),
  onForfeit: (matchId) => callbackHolder.gateway?.onForfeit(matchId),
});
const matchService = new MatchService(store, gameService);
const botService = new BotService(matchService, gameService);
const gateway = new SocketGateway(io, matchService, gameService, botService);
callbackHolder.gateway = gateway;
```

**Client composition root** (`App.tsx`):
```tsx
const lobbyProps = useLobby(socketService);    // hook receives interface
const gameProps  = useGame(socketService);
const resultProps = useResult(socketService);
// Views receive only props — zero imports from store or services
```

---

## Game State Flow

RPS has a finite state machine. The server is the sole authority over state transitions. Matches support configurable **best-of-N** rounds.

```
         ┌──────────┐
         │  WAITING │  ← Player 1 creates match; waiting for opponent
         └────┬─────┘
              │  player_join (or BotService auto-joins for vs Computer)
              ▼
         ┌──────────┐
         │  PLAYING │  ← Both players connected; move timer begins (configurable per match)
         └────┬─────┘
              │  both moves submitted OR timer expires
              ▼
         ┌──────────┐
         │ RESOLVED │  ← Server computes round result, broadcasts outcome
         └────┬─────┘
              │
              ├── roundsPlayed < bestOf → both rematch → PLAYING (next round)
              │
              ├── roundsPlayed >= bestOf AND scores differ → ENDED (winner determined)
              │
              └── roundsPlayed >= bestOf AND scores tied → both rematch → PLAYING (decider round)
              
         ┌──────────┐
         │  ENDED   │  ← Match over: winner determined or forfeit
         └──────────┘
```

**State is never derived on the client.** The client only stores what the server sends it. This eliminates an entire class of desync bugs.

### Win Condition: Play-All-Rounds

The match plays all N rounds (where N = `bestOf`). After N rounds, the player with more wins takes the match. If scores are tied after N rounds, **decider rounds** continue one at a time until one player breaks the tie. This is deliberately NOT "first to majority" — every round counts, and draws don't prematurely extend the match beyond the intended length.

```typescript
// GameService.ts — resolveCurrentRound()
const roundsPlayed = match.rounds.length;
const [s0, s1] = match.scores;
const hasWinner = roundsPlayed >= match.bestOf && s0 !== s1;

if (hasWinner) {
  match.state = ENDED;
  match.winner = match.players[s0 > s1 ? 0 : 1]!.id;
} else {
  match.state = RESOLVED;
}
```

### Move Timer Architecture

The move timer is **configurable per match** via `moveTimeoutMs` (set at match creation, piped from client `gameConfig.ts`). The timer is managed exclusively on the server — the client displays a countdown for UX purposes, but the server is the sole authority on expiration.

```
Server                                     Client
  │  match transitions to PLAYING             │
  │──── game:state { timeoutAt: epoch } ─────▶│
  │                                           │  Client starts local display
  │                                           │  timer from (timeoutAt - now)
  │  ... moveTimeoutMs elapses (server) ...   │  ... client counts down visually
  │                                           │
  │  server.clearTimeout fires                │
  │  unsubmitted moves → null                 │
  │──── game:result ──────────────────────────▶│
  │                                           │  Client discards its local timer
```

The server broadcasts `timeoutAt` as an absolute epoch timestamp (not a duration) in the `GameState` payload. The client computes `timeoutAt - Date.now()` to initialize its visual countdown. This handles clock skew within acceptable bounds for a turn-based game — the server timer is the only one that matters for resolution.

**Why not trust the client timer?** A client-controlled timer is trivially manipulated. Even without malicious intent, tab-backgrounding or device sleep would cause the browser timer to fire late. The server timer fires regardless of client state.

---

## WebSocket Event Contract

All event names are defined in `packages/shared/src/events.ts` as an enum — never as raw strings in either client or server code.

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `match:create` | `{ playerName: string, mode?: MatchMode, bestOf?: number, moveTimeoutMs?: number }` | Create a new match (PVP or vs Computer) with configurable round count and timer |
| `match:join` | `{ matchId: string, playerName: string }` | Join an existing match by ID |
| `game:move` | `{ matchId: string, move: Move }` | Submit rock / paper / scissors |
| `game:rematch` | `{ matchId: string }` | Request the next round (or accept rematch) |
| `match:leave` | `{ matchId: string }` | Gracefully leave a match |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `match:created` | `{ matchId: string }` | Confirms match creation; returns shareable ID |
| `match:joined` | `{ matchId: string, players: Pick<Player, 'id' \| 'name'>[] }` | Opponent has joined; game begins |
| `game:state` | `GameState` | Authoritative state broadcast after any change |
| `game:result` | `MatchResult` | Round result with both moves revealed, scores, and `finished` flag |
| `game:rematch_ready` | `{ matchId: string }` | Both players agreed; next round starting |
| `player:disconnected` | `{ playerName: string, timeoutMs: number }` | Opponent dropped; reconnect window open |
| `player:reconnected` | `{ playerName: string }` | Opponent reconnected; game resumes |
| `match:forfeit` | `{ winner: string }` | Opponent did not reconnect in time or left |
| `error` | `{ code: string, message: string }` | Structured error (invalid move, match not found, etc.) |

### Key Payload Types

```typescript
interface GameState {
  matchId: string;
  players: [Pick<Player, 'id' | 'name'>, Pick<Player, 'id' | 'name'>];
  state: MatchState;            // 'WAITING' | 'PLAYING' | 'RESOLVED' | 'ENDED'
  round: number;                // current round number (1-indexed)
  bestOf: number;               // total rounds configured for this match
  scores: [number, number];     // cumulative win count per player
  timeoutAt: number | null;     // absolute epoch ms for move deadline
  moved: [boolean, boolean];    // whether each player has submitted a move this round
}

interface MatchResult {
  matchId: string;
  round: RoundResult;           // { moves: [Move|null, Move|null], winner: number|null }
  scores: [number, number];
  winner: string | null;        // round winner's playerId (null on draw)
  finished: boolean;            // true when match is over (ENDED)
}
```

---

## Matchmaking & Lobby

Rock Paper Scissors is a 2-player game, so matchmaking is intentionally simple.

### PVP Mode (Invite-Code)

1. Player A calls `match:create` with `{ playerName, mode: 'pvp', bestOf, moveTimeoutMs }`. The server generates a short UUID-based `matchId`, stores a new `Match` in `WAITING` state, joins the Socket.IO room, and returns the ID.
2. Player A shares the `matchId` (displayed in the UI with a copy button).
3. Player B calls `match:join` with that ID. The server validates the match exists and is in `WAITING` state, adds Player B to the room, transitions match to `PLAYING`, and broadcasts `game:state` to the room.
4. The configurable move timer begins server-side. If a player hasn't moved when the timer expires, their move defaults to `null` and the round resolves.

### vs Computer Mode

Player calls `match:create` with `{ mode: 'computer' }`. The `SocketGateway` delegates to `BotService.afterMatchCreated()`, which:

1. Auto-joins a virtual bot player (`id: '__bot__'`, `name: 'Computer'`)
2. Immediately submits a random move for the bot
3. The match transitions to `PLAYING` instantly — no waiting room

On rematch, `BotService.afterRematchRequested()` auto-accepts and submits a new random move. The bot uses no strategy — pure `Math.random()` over `[ROCK, PAPER, SCISSORS]`.

**Why not auto-matchmaking (queue-based)?**  
For a 2-player casual game, invite-code matchmaking is simpler, more demonstrable, and more honest to scope. A queue-based system is the natural next step: a shared Redis Sorted Set (scored by join timestamp) would allow any server instance to dequeue and pair waiting players — covered in the [Scalability Strategy](#scalability-strategy) section.

---

## Disconnection Handling

Disconnection is handled at the `SocketGateway` level via Socket.IO's built-in `disconnect` event.

**Strategy: 30-second reconnect window with forfeit fallback.**

```
Player disconnects
      │
      ▼
Server sets match.disconnectedPlayer = playerId
Server starts 30s reconnect timer (configurable via RECONNECT_TIMEOUT_MS)
Server broadcasts `player:disconnected` to remaining player
      │
      ├── Player reconnects within 30s (socket sends same playerId via handshake auth)
      │       └── Server clears timer, broadcasts `player:reconnected`, resumes
      │
      └── Timer expires
              └── Server calls gameService.forfeit(), broadcasts `match:forfeit`
                  Remaining player wins. Match transitions to ENDED.
```

**Reconnection identity:** Players are assigned a stable `playerId` (stored in `localStorage` on the client as `rps_player_id`) on first connection. On reconnect, the client sends this ID in the Socket.IO handshake `auth` object, allowing the server to restore session without requiring auth.

**Mid-move disconnection:** If a player disconnects after submitting their move, the move is preserved in the `Match` model. If the opponent also moves before the timer expires, resolution proceeds normally.

**vs Computer disconnection:** BotService matches do not have meaningful disconnection handling — the bot is a virtual client with no socket. If the human player disconnects from a bot match, the match is deleted after the timeout window.

---

## Player Identity & Auth

### Current Implementation

Players are assigned a `playerId` (a `crypto.randomUUID()` value) on first connection. This ID is persisted in `localStorage` on the client and sent in the Socket.IO handshake `auth` object on every connection. The server maps `playerId → socketId` in a `Map` on `SocketGateway`, which is how reconnection works: when a returning socket sends a known `playerId`, the server restores their session rather than treating them as a new player.

This is intentionally lightweight. There is no login, no token issuance, no server-side user record. The `playerId` is a session-scoped correlation key, not an identity claim.

**What this gives you:** Disconnection recovery within a match works correctly. A player who closes and reopens the tab within the 30-second reconnect window will rejoin seamlessly.

**What this doesn't give you:** Cross-session identity. Closing the browser and returning an hour later (after the match has ended) means the `playerId` is useless — the match is gone (expired by Redis TTL). There is no player profile, no stats, no persistent history.

### The JWT Upgrade Path

The `MatchStore` interface is already the seam for stateful scaling. The identity layer has an equivalent seam: `SocketGateway` currently trusts the client-provided `playerId` without verification. Adding auth is a single gateway concern:

```typescript
// Current — trust the client
const playerId = socket.handshake.auth.playerId ?? crypto.randomUUID();

// With JWT auth — verify before admitting
const token = socket.handshake.auth.token;
const payload = jwt.verify(token, process.env.JWT_SECRET);
const playerId = payload.sub; // verified, tamper-proof
```

The Auth Service in the Tier 3 architecture issues short-lived JWTs (15-minute expiry, refresh token pattern) even for anonymous players — no registration required. This gives you verified identity that survives reconnects, tab refreshes, and eventually cross-device sessions, without forcing a sign-up wall. `MatchService` and `GameService` never touch auth — it stays entirely in the gateway layer.

---

## Scalability Strategy

This section walks through three distinct tiers of scale: the current implementation, the first horizontal step, and a production-grade decomposition. Each tier is a deliberate architectural decision — the code is structured from the start so each transition requires the minimum possible change.

---

### Tier 1 — Current: Single Process, Redis State Store

**Target:** Local development, demos, up to ~500 concurrent players.

All match state is persisted in **Redis** via `RedisMatchStore`. The game server is a single Node.js process. Redis runs as a Docker service alongside the server.

```
Client A ──┐
           ├──▶  Node.js (Socket.IO) ──▶ Redis (64-bit JSON match state)
Client B ──┘
```

**Why Redis from the start:** The `MatchStore` interface exists specifically to prove that business logic is decoupled from storage. Using Redis from day one — rather than an in-memory `Map` — demonstrates this is not theoretical. `MatchService` and `GameService` don't know or care that Redis is the storage backend. Future readers don't need to imagine the transition, because it's already done.

**Practical ceiling:**
- Memory: each `Match` object is ~1KB of JSON. 1,000 active matches = ~1MB in Redis. Not the bottleneck.
- Event loop: Node.js is single-threaded. CPU-bound work (there is almost none in RPS) would block the loop. For a pure I/O game like this, the ceiling is effectively connection count × OS file descriptor limit.
- Real ceiling: the OS socket buffer and the load balancer's connection timeout settings, not the application logic.

**What breaks at scale:** Two players in the same match are guaranteed to land on the same process, because there is only one process. That guarantee disappears the moment you add a second Node instance — two players could connect to different servers, their sockets live in different processes, and `io.to(matchId).emit(...)` only reaches sockets on the local process. This drives the Tier 2 architecture.

---

### Tier 2 — Horizontal Scaling: Redis Adapter

**Target:** ~500 → ~5,000 concurrent players (1,000+ simultaneous matches).

One change — and nothing else — unlocks horizontal scaling. The `RedisMatchStore` is already in place. The remaining piece is cross-process Socket.IO broadcast.

```
                    ┌──────────────────────────────────────┐
                    │      Load Balancer (nginx / AWS ALB)  │
                    │      Sticky sessions (cookie-based)   │
                    └───────┬──────────┬──────────┬─────────┘
                            │          │          │
                       ┌────▼──┐  ┌────▼──┐  ┌───▼───┐
                       │ Node  │  │ Node  │  │ Node  │
                       │  #1   │  │  #2   │  │  #3   │
                       └────┬──┘  └────┬──┘  └───┬───┘
                            │          │          │
                    ┌────────▼──────────▼──────────▼──────┐
                    │              Redis                    │
                    │  ┌─────────────────────────────────┐ │
                    │  │  socket.io-redis adapter         │ │
                    │  │  (cross-process room broadcasts) │ │
                    │  ├─────────────────────────────────┤ │
                    │  │  RedisMatchStore                 │ │
                    │  │  (shared authoritative state)    │ │
                    │  │  ✅ Already implemented           │ │
                    │  └─────────────────────────────────┘ │
                    └─────────────────────────────────────┘
```

**The one remaining change — `socket.io-redis` adapter:**

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
io.adapter(createAdapter(pubClient, subClient));
```

This makes `io.to(matchId).emit(...)` fan out through Redis pub/sub to all Node instances. A socket on Node #2 receives a broadcast emitted by a handler running on Node #1. From the application code's perspective, nothing changed.

`RedisMatchStore` is already the shared state store — any Node instance can read or mutate any match. Atomic operations (`SET NX` for match creation, `WATCH`/`MULTI` for state transitions) prevent race conditions in the unlikely case two events for the same match arrive on different servers simultaneously.

**Why sticky sessions?**

Sticky sessions (load balancer routes a client to the same upstream server, identified by a cookie) are a pragmatic optimization. Socket.IO's HTTP long-polling fallback requires session affinity to function. For pure WebSocket connections (the common case), stickiness is not strictly required — any server can accept the socket and the Redis adapter handles cross-process broadcast. But sticky sessions reduce Redis pub/sub chatter and simplify the reconnection flow. Cost: near-zero. Benefit: measurable.

**What this tier does NOT solve:**
- A single Redis instance is now a single point of failure. Mitigate with Redis Sentinel (HA failover) or Redis Cluster (sharding + HA).
- Matchmaking (the queue that pairs players) is still per-process. Two players waiting for opponents on different servers will never find each other. This is acceptable with invite-code matchmaking (current design). Auto-matchmaking requires a shared queue in Redis.
- Move timers running on a specific Node instance: if that instance restarts, timers are lost. At this scale, accepting the rare timer-miss is pragmatic. At Tier 3, timer orchestration moves to a durable scheduler.

---

### Tier 3 — Service Decomposition: 5,000 → 10,000+ Concurrent Players

At this scale, the monolithic game server becomes a coordination bottleneck and a deployment risk. A bad deploy or a memory leak takes down the entire game. The right move is to decompose by responsibility boundary.

```
Clients (browsers)
  │
  ▼
CDN (CloudFront / Cloudflare)
  │  Static assets (HTML/JS) served from edge — no origin hits
  │
  ▼
API Gateway (Kong / AWS API GW)
  │
  ├──▶ Auth Service
  │      Issues short-lived JWTs (even for anonymous players)
  │      Player identity survives reconnects and tab refreshes
  │
  ├──▶ Matchmaking Service  [stateless, scales horizontally]
  │      Maintains a match queue in Redis Sorted Set (scored by join time)
  │      Pairs players, writes match record to Redis
  │      Notifies players of their assigned Game Server via HTTP callback or SSE
  │
  ├──▶ Game Server Fleet  [Socket.IO clusters, per-region]
  │      Each server handles a bounded number of active matches (~200–400)
  │      Reads/writes match state from Redis
  │      Publishes game events to Kafka topic `game.events`
  │
  └──▶ Event Consumer (Kafka consumer group)
         Persists game events to DynamoDB or Postgres
         Powers: leaderboards, match history, analytics, replay
         Decoupled from game servers — consumers can lag without affecting gameplay
```

**Why decompose Matchmaking from Game Servers?**

Matchmaking is stateless and CPU-light — it's queue operations and player pairing logic. Game serving is stateful and connection-bound — it requires persistent WebSocket connections. These have different scaling curves and different failure modes. Running them in the same process means you scale them together when only one of them is under load.

**Why Kafka for game events?**

At this scale, game events (match started, move submitted, match resolved) have multiple consumers: the analytics pipeline, the leaderboard updater, the replay store, the notification service. Coupling the game server directly to each of these consumers creates a dependency graph that becomes unmanageable. Kafka decouples producers from consumers — the game server emits to a topic and is done. Consumers operate at their own pace, can replay from a specific offset, and can be added without touching game server code.

For RPS specifically, Kafka is overkill (event frequency is very low). The right graduation path is: in-process event emitter (current) → Redis Streams (intermediate, simpler operationally) → Kafka (when you have multiple consumer teams and need replay guarantees).

**Regional topology:**

At 10,000 players globally, latency matters. The load balancer should route players to the nearest regional Game Server fleet. Both players in a match must connect to the same region — the Matchmaking Service is responsible for co-locating them. Redis Cluster with cross-region replication handles shared match state. This is the point at which Nakama or a purpose-built game backend (Hathora, Rivet) starts to offer real value — they handle the regional topology, match placement, and session management that you'd otherwise build yourself.

---

### Evolution Summary

| Tier | Scale | Key Change | Code Impact |
|---|---|---|---|
| **1** | 0 → ~500 players | Single process + Redis store | — (current state) |
| **2** | ~500 → ~5,000 players | `socket.io-redis` adapter | 1 file, 0 business logic changes |
| **3** | ~5,000 → 10,000+ players | Service decomposition, Kafka, regional fleet | Full architectural split |

The `MatchStore` interface is the load-bearing seam in this progression. Tier 1 → Tier 2 is a one-line change at the DI root (the adapter). Tier 2 → Tier 3 is a genuine architectural investment — justified only when the operational complexity pays for itself in resilience and independent scalability.

---

## Asset Delivery & CDN Strategy

### Local (Docker)

Nginx serves the Vite-built client bundle from `/usr/share/nginx/html`. Cache-Control headers are set per asset type:

```nginx
# Content-hashed bundles — cache forever
location /assets/ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}

# index.html — never cache
location / {
  add_header Cache-Control "no-cache, no-store, must-revalidate";
  try_files $uri /index.html;
}
```

### Production

Vite appends a content hash to all output filenames (e.g. `main.a3f9c12.js`). This enables:

- **Aggressive CDN caching** — assets are immutable by name. CloudFront/Cloudflare can cache them at the edge with TTLs of one year.
- **Cache busting by deployment** — new filenames on every build. No user ever gets stale JS after a deploy.
- **CDN topology**: Client origin (S3 / GCS) sits behind CloudFront. The game WebSocket server is NOT behind the CDN — it requires a persistent connection routed directly to the application load balancer.

---

## Pub/Sub & Event Architecture

Within the current single-server scope, Socket.IO rooms act as the pub/sub primitive. Each match has a room `match:{matchId}`. All players in that room receive broadcasts.

**Event flow for a move submission:**

```
Client                    SocketGateway              GameService            gameLogic
  │                             │                         │                    │
  │──── game:move ─────────────▶│                         │                    │
  │                             │── submitMove() ────────▶│                    │
  │                             │                         │── resolveRound() ─▶│
  │                             │                         │                    │
  │                             │                         │◀── RoundResult ────│
  │                             │                         │                    │
  │                             │◀── { match, resolved } ─│                    │
  │                             │                         │                    │
  │◀─── game:state (to room) ───│                         │                    │
  │◀─── game:result (to room) ──│  (if both moved)        │                    │
```

**Timer-driven resolution:** When the move timer expires, `GameService` resolves the round internally and calls `MatchCallbacks.onRoundResolved()`, which is implemented by `SocketGateway` to broadcast the result. This decouples the timer from the I/O layer.

**Spectator mode** (future): Adding spectators requires zero changes to game logic. A new `spectator:join` event handler in `SocketGateway` would join the socket to the match room. The existing `io.to(matchId).emit(...)` broadcasts would automatically reach spectators.

**Message broker (future scale)**: At 10k+ players, replace in-process event dispatch with Kafka or Redis Streams. Game events become durable, replayable messages. This decouples game servers from analytics, leaderboards, and notification services.

---

## Observability & Logging

All server-side game events are logged using **pino** (structured JSON logging). This is intentional: logs are machine-readable from day one, making them trivially ingestible by DataDog, CloudWatch, or any ELK stack.

**Logged events (all in `SocketGateway`, the I/O boundary):**
- `match.created` — `{ matchId, playerName, mode }`
- `match.started` — `{ matchId, players }` (on join)
- `player.moved` — `{ matchId, playerId }` (move value intentionally omitted until resolution to prevent log-based cheating)
- `match.resolved` — `{ matchId, result, moves }` (on both sync resolve and timer-driven resolve)
- `player.disconnected` — `{ matchId, playerId, phase }`
- `match.forfeited` — `{ matchId, winner, reason }` (distinguishes `'leave'` vs `'disconnect_timeout'`)
- `error` — `{ code, socketId, message }`

---

## Testing Strategy

### Server Unit Tests — 90 test definitions across 6 files

All server tests use Vitest with `vi.useFakeTimers()` for deterministic timer testing and in-memory `MatchStore` mocks (Map-backed with `structuredClone`). No Redis dependency in tests.

| File | Test Definitions | Coverage |
|---|---|---|
| `gameLogic.test.ts` | 6 (including `it.each`) | All 6 decisive move outcomes, 3 draws, null-move timeout scenarios |
| `matchMappers.test.ts` | 10 | `buildGameState` payload shape (4) + `buildMatchResult` with all winner/draw/finished combos (6) |
| `createMatch.test.ts` | 12 | Factory function defaults + overrides (8) + `playerIndex` helper (4) |
| `GameService.test.ts` | 29 (including `it.each`) | All 9 move combos, score accumulation, state transitions, timers, rematch, forfeit, edge cases |
| `MatchService.test.ts` | 26 | Create, join, leave, disconnect/reconnect timers, concurrent disconnects, edge cases |
| `BotService.test.ts` | 7 | Auto-join + random move for computer mode, rematch auto-accept, PVP passthrough |

Tests have zero I/O dependencies and run in ~200ms total.

### E2E Tests — 11 Playwright tests

Browser-based end-to-end tests using Playwright with a real server (Redis + Express + Socket.IO) and client (Vite preview).

| Scenario | Tests |
|---|---|
| **Lobby Create Match** | Renders lobby, create disabled without name, enables with name, transitions to waiting |
| **Lobby Join Match** | Disabled without inputs, disabled name only, disabled match ID only, enables with both |
| **Full Game Flow** | Create → join → play → result, rematch starts new round, leaving returns to lobby |

Playwright config uses dual `webServer` to start both server and client before test runs. The CI workflow provisions a Redis service container for E2E.

### CI Pipeline

GitHub Actions (`ci.yml`) runs on every PR and push to `main` and `develop`:

```
┌─────────────────────────────────────────────────┐
│  Detect Changes (dorny/paths-filter)             │
│  → client (packages/client/** + shared/**)       │
│  → server (packages/server/** + shared/**)       │
└─────────┬───────────────┬───────────────┬────────┘
          │               │               │
    ┌─────▼─────┐   ┌────▼──────┐   ┌───▼──────────┐
    │   Lint    │   │  Server   │   │   Client      │
    │ (always)  │   │  Build +  │   │   Build +     │
    │           │   │  Tests    │   │   E2E Tests   │
    └───────────┘   │ (if       │   │  (if changed) │
                    │ changed)  │   │  + Redis svc  │
                    └───────────┘   └───────────────┘
```

- **Selective execution** — `dorny/paths-filter` skips jobs when the corresponding package hasn't changed
- **Redis service container** — CI spins up `redis:7-alpine` with health check for E2E tests
- **Playwright artifacts** — test report uploaded on failure for debugging
- **PR conventions** (`pr-conventions.yml`) — validates PR title (`[RPS-N] description`) and branch name (`type/snake_case`)

---

## Running the Project Locally

### Prerequisites

- Node.js 20+
- Docker + Docker Compose (required — Redis runs as a Docker service)

### With Docker (recommended)

```bash
git clone <repo-url>
cd paper-rock-scissors
docker-compose up --build

# Client:  http://localhost:5173
# Server:  http://localhost:3001
# Redis:   localhost:6379
```

### Without Docker (requires local Redis)

```bash
# Start Redis (via Docker or locally installed)
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Install all workspace dependencies
npm install

# Start server (port 3001) — requires env vars
PORT=3001 REDIS_URL=redis://localhost:6379 MATCH_PREFIX="match:" \
MATCH_TTL_SECONDS=3600 RECONNECT_TIMEOUT_MS=30000 CORS_ORIGIN="*" \
npm run dev --workspace=packages/server

# Start client (port 5173)
VITE_SERVER_URL=http://localhost:3001 npm run dev --workspace=packages/client
```

### Run Tests

```bash
# Server unit tests
npm run test --workspace=packages/server

# Client E2E tests (requires server + client running)
npm run test:e2e --workspace=packages/client
```

### Makefile Shortcuts

```bash
make dev        # docker-compose up --build
make test       # run server unit tests
make lint       # eslint all packages
make clean      # docker-compose down + prune
```
