# RPS Multiplayer

A **server-authoritative real-time Rock Paper Scissors** web app for two players. Built to demonstrate clean architecture, SOLID design, real-time WebSocket communication, and a production-ready scaling path — not gameplay complexity.

**Core features:**
- PVP multiplayer via invite code (create match → share code → opponent joins)
- vs Computer mode (bot plays random moves, instant start)
- Configurable best-of-N rounds (5, 10, 15) with tiebreaker support
- Server-authoritative move timer (configurable per match)
- 30-second reconnect window on disconnect (forfeit on timeout)
- Emoji animations on win/loss
- Structured JSON logging (pino) for all match lifecycle events
- 90+ server unit tests (Vitest) + 3 E2E test paths (Playwright)
- Selective CI pipeline (GitHub Actions) — skips unchanged packages
- Full Docker Compose setup (Redis + server + client)

---

## Running Locally

### Prerequisites

- **Node.js 20+**
- **Docker + Docker Compose** (Redis runs as a Docker service — required)

### With Docker (recommended)

```bash
git clone git@github.com:aleksicdacha/paper-rock-scissors.git
cd paper-rock-scissors
docker-compose up --build
```

| Service | URL |
|---|---|
| Client | http://localhost:5173 |
| Server | http://localhost:3001 |
| Redis | localhost:6380 (host) → 6379 (container) |

### Without Docker

```bash
# 1. Start Redis (required)
docker run -d --name rps-redis -p 6379:6379 redis:7-alpine

# 2. Install dependencies
npm install

# 3. Create server env file
cat > packages/server/.env << 'EOF'
PORT=3001
REDIS_URL=redis://localhost:6379
MATCH_PREFIX=match:
MATCH_TTL_SECONDS=3600
RECONNECT_TIMEOUT_MS=30000
CORS_ORIGIN=*
EOF

# 4. Start server (terminal 1)
npm run dev --workspace=packages/server

# 5. Start client (terminal 2)
VITE_SERVER_URL=http://localhost:3001 npm run dev --workspace=packages/client
```

### Environment Variables

**Server** (`packages/server/.env`):

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Server port (3001) |
| `REDIS_URL` | Yes | Redis connection URL |
| `MATCH_PREFIX` | Yes | Redis key prefix for matches |
| `MATCH_TTL_SECONDS` | Yes | Match TTL in Redis (3600 = 1hr) |
| `RECONNECT_TIMEOUT_MS` | Yes | Disconnect grace period (30000 = 30s) |
| `CORS_ORIGIN` | Yes | Allowed CORS origins (`*` for dev) |

**Client** (environment or `.env`):

| Variable | Required | Description |
|---|---|---|
| `VITE_SERVER_URL` | Yes | WebSocket server URL |

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Client** | React 18 · TypeScript · Vite 5 | Component model maps to game phases (lobby → playing → result). Vite gives fast HMR + optimized production builds. TypeScript enforces the shared event contract at compile time. |
| **Client State** | Zustand | Minimal hook-based store. Actions map 1:1 to server events. No boilerplate, no providers. |
| **Client Styling** | Tailwind CSS v4 · react-icons | Utility-first CSS with CSS-first config. SVG hand gesture icons from `react-icons/fa`. Custom keyframe animations. |
| **Server** | Node.js · TypeScript · Express | Non-blocking I/O for concurrent WebSocket connections. Shares types with client via `packages/shared`. |
| **Real-Time** | Socket.IO | WebSocket abstraction with built-in rooms, automatic reconnection, fallback transport. Rooms map 1:1 to matches. |
| **State Store** | Redis 7 (ioredis) | Sole state store via `RedisMatchStore`. `MatchStore` interface decouples business logic from storage. JSON serialization + TTL. |
| **Shared Types** | `packages/shared` | Single source of truth for event enums (`ClientEvent`, `ServerEvent`), payload types (`GameState`, `MatchResult`), game constants (`WINS_OVER`). Eliminates client/server contract drift. |
| **Containerization** | Docker · Docker Compose | One command full-stack setup. Redis + server + client with health checks. |
| **Unit Testing** | Vitest | Fast ESM-native test runner. Fake timers for deterministic timer testing. In-memory store mocks (Map-backed with `structuredClone`). |
| **E2E Testing** | Playwright | Browser-based tests against real server + client. Dual `webServer` config spins up both services. |
| **CI** | GitHub Actions | Selective execution via `dorny/paths-filter`. Lint (always), server build+tests (if changed), client build+E2E (if changed + Redis service container). PR title/branch validation. |
| **Linting** | ESLint v10 (flat config) · Prettier | Enforced code style. Flat config in `eslint.config.mjs`. |

---

## Architecture

```
React SPA (Vite)                           Node.js Game Server
┌──────────────────────┐                  ┌────────────────────────────────────┐
│  useLobby / useGame  │                  │  SocketGateway (I/O only)          │
│  useResult (hooks)   │   WebSocket      │    ↓                               │
│        ↓             │ ◄──────────────► │  MatchService (lifecycle)           │
│  LobbyView/GameView  │   Socket.IO      │    ↓                               │
│  ResultView (render) │                  │  GameService (state + timers)       │
│        ↓             │                  │    ↓                               │
│  SocketService       │                  │  gameLogic (pure functions)         │
│  Zustand gameStore   │                  │    ↓                               │
└──────────────────────┘                  │  RedisMatchStore → Redis            │
                                          └────────────────────────────────────┘
```

**Server-authoritative:** The client never computes game outcomes. It sends player intent and renders server-emitted state. Move timers are server-owned; the client displays a visual countdown from a broadcast `timeoutAt` epoch.

**SOLID boundaries:**
- **SocketGateway** — I/O translation only. Socket events ↔ service method calls + structured logging. Zero game logic.
- **MatchService** — Match lifecycle: create, join, leave, disconnect/reconnect timers. Delegates game state to GameService.
- **GameService** — Game state transitions: round start, move submission, rematch, forfeit. Owns move timers.
- **gameLogic** — Pure functions (`resolveRound`, `determineWinner`). No state, no I/O, no dependencies.
- **BotService** — vs Computer virtual client. Auto-joins, submits random moves, auto-accepts rematches.
- **RedisMatchStore** — Redis persistence. Implements `MatchStore` interface.
- **matchMappers** — Pure payload builders (`buildGameState`, `buildMatchResult`). Projects internal `Match` into client-facing types.

**Client architecture** follows the **Container/Presentational pattern:** Views are pure render functions — all store access, service calls, and derived state live in container hooks (`useLobby`, `useGame`, `useResult`). `App.tsx` is the composition root.

**Dependency Inversion:** Every injection point programs to an interface. Concrete implementations are only imported in composition roots (`server/src/index.ts`, `client/src/App.tsx`). TypeScript structural typing enforces contracts — no `implements` keyword needed.

---

## Project Structure

```
paper-rock-scissors/
├── packages/
│   ├── shared/                     # Shared TypeScript types & constants
│   │   └── src/
│   │       ├── consts.ts           # ROCK, PAPER, SCISSORS, WINS_OVER, BOT_PLAYER_ID, state constants
│   │       ├── events.ts           # ClientEvent (5) & ServerEvent (9) enums
│   │       ├── types.ts            # Move, MatchMode, MatchState, Player, GameState, MatchResult, etc.
│   │       └── index.ts            # Barrel re-exports
│   │
│   ├── server/                     # Node.js game server
│   │   ├── src/
│   │   │   ├── index.ts            # Entry point: Express + Socket.IO + DI wiring
│   │   │   ├── config.ts           # requireEnv() — all env vars required, no fallbacks
│   │   │   ├── logger.ts           # pino structured JSON logger
│   │   │   ├── models/             # Match interface + factory function
│   │   │   ├── store/              # MatchStore interface + RedisMatchStore
│   │   │   ├── game/               # gameLogic (pure) + matchMappers (pure)
│   │   │   ├── services/           # GameService, MatchService, BotService (each with interface)
│   │   │   └── gateway/            # SocketGateway + MatchCallbacks interface
│   │   └── tests/                  # 90+ unit tests (Vitest)
│   │
│   └── client/                     # React SPA (Vite + Tailwind v4)
│       ├── src/
│       │   ├── App.tsx             # Composition root: hooks → views by phase
│       │   ├── gameConfig.ts       # All UI strings, options, timeouts — single config source
│       │   ├── services/           # SocketService (singleton + interface)
│       │   ├── store/              # Zustand gameStore + interfaces + phase helpers
│       │   ├── hooks/              # useSocket, useLobby, useGame, useResult (container hooks)
│       │   ├── views/              # LobbyView, GameView, ResultView (pure render + props interface)
│       │   └── components/         # CountdownTimer, MoveSelector, PlayerStatus
│       └── e2e/                    # 11 Playwright E2E tests
│
├── docker-compose.yml              # Redis + server + client
├── Makefile                        # dev, test, lint, clean shortcuts
├── eslint.config.mjs               # ESLint v10 flat config
└── .github/workflows/
    ├── ci.yml                      # Selective CI with path filtering
    └── pr-conventions.yml          # PR title + branch name validation
```

---

## Why Socket.IO over Nakama

Nakama is architectured around a **tick-rate loop** — a fixed-interval server cycle for games where the server continuously simulates physics or reconciles positional state. RPS is fundamentally different: an **event-driven, turn-based, low-frequency state machine**. The server has nothing to compute between player actions.

Socket.IO's room-based pub/sub maps directly to the problem domain: a match is a room, moves are events, resolution is a broadcast. The transport primitive and the game primitive are the same thing — zero impedance mismatch.

At scale (persistent ranked ladder, thousands of concurrent matches), Nakama or a purpose-built game backend becomes the right answer. The `MatchStore` interface and service boundaries are designed so that transition requires minimal code changes.

---

## Game Rules

- Players choose **rock**, **paper**, or **scissors** each round
- Rock beats scissors, scissors beats paper, paper beats rock
- **Best-of-N**: Match plays until one player reaches majority wins (`ceil(N/2)`)
- **Draws** don't count as decisive rounds — the round replays
- **Move timer**: if time expires, unsubmitted moves default to `null` (timeout). One move vs null = the mover wins. Both null = draw (replayed)
- **Disconnection**: 30-second reconnect window. If the player doesn't return, opponent wins by forfeit

---

## WebSocket Event Contract

All event names are defined as enums in `packages/shared/src/events.ts` — never as raw strings.

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `match:create` | `{ playerName, mode?, bestOf?, moveTimeoutMs? }` | Create a new match (PVP or vs Computer) |
| `match:join` | `{ matchId, playerName }` | Join existing match by invite code |
| `game:move` | `{ matchId, move }` | Submit rock / paper / scissors |
| `game:rematch` | `{ matchId }` | Request next round |
| `match:leave` | `{ matchId }` | Leave the match |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `match:created` | `{ matchId }` | Match created; returns shareable invite code |
| `match:joined` | `{ matchId, players }` | Opponent joined; game begins |
| `game:state` | `GameState` | Authoritative state broadcast after any change |
| `game:result` | `MatchResult` | Round result with moves revealed, scores, `finished` flag |
| `game:rematch_ready` | `{ matchId }` | Both players agreed; next round starting |
| `player:disconnected` | `{ playerName, timeoutMs }` | Opponent dropped; reconnect window open |
| `player:reconnected` | `{ playerName }` | Opponent reconnected |
| `match:forfeit` | `{ winner }` | Player forfeited (left or disconnect timeout) |
| `error` | `{ code, message }` | Structured error |

---

## Game State Machine

```
WAITING  →  player joins  →  PLAYING  →  both moved / timer  →  RESOLVED
                                                                    │
                              ├── majority reached → ENDED          │
                              └── both rematch → PLAYING ◄──────────┘
```

States: `WAITING` (1 player) → `PLAYING` (moves open) → `RESOLVED` (round result shown) → `ENDED` (match over).

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Redis-only state store** | No in-memory fallback. Proves the `MatchStore` abstraction works from day one. Tier 1→2 scaling = adding `socket.io-redis` adapter (one line). |
| **Pure game logic functions** | `resolveRound()` and `determineWinner()` are plain functions. No state, no dependencies — a class would add ceremony with zero benefit. |
| **MatchService + GameService split** | Match lifecycle (create/join/disconnect) and game state (moves/timers/resolution) have different reasons to change. SRP. |
| **Data-driven event binding** | `useSocket` maps `[ServerEvent, handler][]` tuples. Adding events = adding one tuple. Open/Closed Principle. |
| **Container/Presentational views** | Views have zero imports from store or services. All logic lives in container hooks. Testable without mocking. |
| **Full Dependency Inversion** | Every DI point programs to an interface. Concretes only in composition roots. |
| **Server-authoritative timers** | Client timers are cosmetic. Server timer fires regardless of client state (tab backgrounding, device sleep, manipulation). |
| **Structured logging (pino)** | JSON from day one. Machine-readable, trivially ingestible by DataDog/CloudWatch/ELK. Move values omitted until resolution (anti-cheat). |
| **No env var fallbacks** | `requireEnv()` throws on missing vars. Production code must never silently use dev defaults. |
| **`gameConfig.ts`** | All UI strings, button labels, options in one file. Easy i18n path, no magic strings scattered in components. |

---

## Scalability Path

| Tier | Scale | Change Required |
|---|---|---|
| **1 — Current** | ~500 concurrent | Single Node.js process + Redis. Already implemented. |
| **2 — Horizontal** | ~5,000 concurrent | Add `socket.io-redis` adapter (1 line). Multiple Node instances behind a sticky-session load balancer. `RedisMatchStore` is already the shared state store. |
| **3 — Decomposed** | 10,000+ concurrent | Service decomposition: separate Auth, Matchmaking (Redis Sorted Set queue), Game Server fleet, Kafka event consumers for analytics/leaderboards/replay. |

---

## Testing

### Server Unit Tests (90+ tests across 6 files)

```bash
npm run test --workspace=packages/server
```

| File | Tests | Coverage |
|---|---|---|
| `gameLogic.test.ts` | 6 defs (`it.each`) | All move combos, draws, null/timeout |
| `matchMappers.test.ts` | 10 | Payload shape validation |
| `createMatch.test.ts` | 12 | Factory function + playerIndex |
| `GameService.test.ts` | 29 defs (`it.each`) | Moves, timers, rematch, forfeit |
| `MatchService.test.ts` | 26 | Lifecycle, disconnect/reconnect timers |
| `BotService.test.ts` | 7 | Bot auto-join, rematch, PVP passthrough |

All tests use fake timers (`vi.useFakeTimers()`), in-memory store mocks (`Map` + `structuredClone`), and mock callbacks. Zero I/O dependencies. ~200ms total.

### E2E Tests (3 Playwright test paths)

```bash
# Requires server + client running (Playwright webServer handles this)
npm run test:e2e --workspace=packages/client
```

| Path | Tests | Coverage |
|---|---|---|
| Lobby — Create Match | 4 | Renders lobby, disabled without name, enables with name, transitions to waiting |
| Lobby — Join Match | 4 | Disabled without inputs, disabled name-only, disabled ID-only, enables with both |
| Full game — two players | 3 | Create→join→play→result, rematch starts new round, leaving returns to lobby |

### Makefile Shortcuts

```bash
make dev        # docker-compose up --build
make test       # server unit tests
make lint       # eslint all packages
make clean      # docker-compose down + prune
```

---

## CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`):

1. **Detect Changes** — `dorny/paths-filter` skips jobs for unchanged packages
2. **Lint** — always runs
3. **Server Build + Tests** — if `packages/server/**` or `packages/shared/**` changed
4. **Client Build + E2E** — if `packages/client/**` or `packages/shared/**` changed. Spins up Redis service container.

PR conventions (`.github/workflows/pr-conventions.yml`): validates PR title format (`[RPS-N] description`) and branch naming (`type/snake_case`).

---

## Trade-offs

| Choice | Trade-off |
|---|---|
| **Redis-only (no in-memory fallback)** | Requires Docker/Redis for local dev. Proves the abstraction works rather than deferring the integration. |
| **Socket.IO over Nakama** | Perfect fit for event-driven 2-player game. Would need replacement for a persistent ranked ladder at scale. |
| **No auth** | `playerId` in localStorage is a session correlation key, not an identity claim. Fine for a demo. JWT upgrade path is documented. |
| **`structuredClone` in test mocks** | Simulates Redis serialization behavior (no shared references). Slightly slower than direct Map, but catches a real class of bugs. |
| **No queue-based matchmaking** | Invite-code matchmaking is simpler, more demonstrable. Queue-based (Redis Sorted Set) is the natural next step. |
| **Single-region** | Both players must connect to the same server. Multi-region requires match placement logic in a Matchmaking Service. |

---

## What I'd Do Differently With More Time

**HTTPS + domain name.** The app currently runs on a raw IP over HTTP. This breaks `navigator.clipboard` and `crypto.randomUUID` (both require a secure context), forcing fallbacks. A domain + Let's Encrypt cert solves this cleanly and is table stakes for production.

**Queue-based matchmaking.** The invite-code system works for demos but doesn't scale. A Redis Sorted Set (scored by join timestamp) would let any server instance dequeue and pair waiting players. Straightforward addition — the `MatchService.create` / `join` boundary already separates match creation from player pairing.

**Player authentication.** The current `playerId` in `localStorage` is a session correlation key, not identity. Adding JWT auth (even for anonymous players — issue a token on first visit, no registration wall) provides verified identity that survives tab refreshes and eventually cross-device sessions. The `SocketGateway` handshake is the only code that changes.

**Spectator mode.** The architecture already supports it (join the Socket.IO room as read-only, broadcasts reach all room members). The missing pieces are a `spectator:join` event handler, a UI for spectators, and filtering move data from `game:state` broadcasts until resolution.

**Integration tests for SocketGateway.** Unit tests cover services and pure logic thoroughly (106 tests). E2E tests cover the full stack. The gap is the SocketGateway layer — currently only tested indirectly through E2E. A test harness with a real Socket.IO server (in-memory Redis, `socket.io-client` as the test driver) would catch event mapping bugs faster.

**Rate limiting and abuse prevention.** No server-side rate limiting on Socket.IO events. A player could spam `game:move` or `match:create`. Socket.IO middleware that tracks event frequency per `playerId` and disconnects abusers would be the minimal viable protection.

**Accessibility.** The UI lacks ARIA labels, keyboard navigation for move selection, and screen reader support. These are non-trivial to retrofit but important for a public-facing game.
