# RPS Multiplayer

A server-authoritative real-time Rock Paper Scissors web app for two players. Built to demonstrate clean architecture, SOLID design, real-time WebSocket communication, and a production-ready scaling path — not gameplay complexity.

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| **Client** | React + TypeScript + Vite | Component model maps naturally to game UI states (lobby, playing, result). Vite gives fast HMR and optimized production builds. TypeScript enforces the shared event contract. |
| **Server** | Node.js + TypeScript + Express | Familiar, non-blocking I/O is ideal for many concurrent WebSocket connections. Shares TypeScript types with the client via a `shared/` package. |
| **Real-Time Transport** | Socket.IO | Battle-tested WebSocket abstraction with built-in rooms (perfect for match sessions), automatic reconnection, and fallback transport. Avoids Nakama overhead for a 2-player turn-based game. |
| **State Store** | Redis | Sole state store via `RedisMatchStore`. `MatchStore` interface keeps business logic decoupled from storage — swap implementations at the DI root without touching services. |
| **Shared Types** | `packages/shared` | Single source of truth for all event names, payloads, and game domain types. Eliminates client/server contract drift. |
| **Containerization** | Docker + Docker Compose | One command to run the full stack. Mirrors a real deployment topology. |
| **Testing** | Vitest | Native ESM support, fast, same config as Vite. Server-side game logic is pure functions — easy to unit test with no mocking overhead. |
| **Linting / Formatting** | ESLint + Prettier | Enforced code style. |

---

## Architecture

The client is a static React SPA that never computes game outcomes — it only sends player intent and renders server-emitted state. All authoritative game logic lives on the Node.js server: `SocketGateway` (I/O translation only) → `MatchService` (match lifecycle, disconnect timers) → `GameService` (game state transitions, move timers) → `gameLogic` (pure resolution functions). Match state is persisted in Redis via `RedisMatchStore`, which implements the `MatchStore` interface — the load-bearing seam for horizontal scaling. Swapping to a `socket.io-redis` adapter and deploying multiple Node instances requires zero business logic changes.

---

## Why Not Nakama

Nakama's authoritative multiplayer model is architected around a tick-rate loop — a fixed-interval server cycle inherited from real-time action games where the server is continuously simulating physics or reconciling positional state. RPS is a fundamentally different problem: an event-driven, turn-based, low-frequency state machine. The server has nothing to compute between player actions. Forcing that model into Nakama's match loop means either leaving the loop body empty on every tick or contorting the design to fit a paradigm that doesn't apply.

Socket.IO's room-based pub/sub maps directly to the problem domain: a match is a room, moves are events, resolution is a broadcast. The transport primitive and the game primitive are the same thing — there is no impedance mismatch. This is a tool-to-problem fit decision, not a complexity-avoidance decision. At scale — a persistent ranked ladder with thousands of concurrent matches — Nakama or a purpose-built game backend becomes the right answer.

---

## Key Design Decisions

- **Shared types package** — `packages/shared` is the single source of truth for event enums, payload types, and game constants. Client and server import from the same barrel — contract drift is impossible.
- **Pure game logic** — `resolveRound()` and `determineWinner()` are plain functions, not wrapped in a stateless class. No state, no dependencies to inject — a class would add ceremony with no benefit.
- **`MatchStore` interface** — Business logic depends on the abstraction, not Redis directly. The Tier 1 → Tier 2 scaling transition is a one-line change at the DI root.
- **Server-authoritative state** — The client never computes the winner. Move timers are server-owned; the client displays a countdown from a broadcast `timeoutAt` epoch for UX only.
- **Structured logging** — pino JSON logging for all match lifecycle events. Machine-readable from day one — trivially ingestible by any log aggregator.

---

## Running Locally

### Prerequisites

- Node.js 20+
- Docker + Docker Compose

### With Docker (recommended)

```bash
git clone git@github.com:aleksicdacha/paper-rock-scissors.git
cd paper-rock-scissors
docker-compose up --build

# Client:  http://localhost:5173
# Server:  http://localhost:3001
```

### Without Docker

```bash
# Start Redis
docker-compose up redis

# Create packages/server/.env (see .env.example)
# Required: PORT, REDIS_URL, MATCH_PREFIX, MATCH_TTL_SECONDS, MOVE_TIMEOUT_MS, RECONNECT_TIMEOUT_MS

# Install dependencies
npm install

# Start server (terminal 1)
npm run dev --workspace=packages/server

# Start client (terminal 2)
npm run dev --workspace=packages/client
```

### Run Tests

```bash
npm run test --workspace=packages/server
```

### Makefile Shortcuts

```bash
make dev        # docker-compose up --build
make test       # run server unit tests
make lint       # eslint all packages
make clean      # docker-compose down + prune
```

---

## Trade-offs

- **Invite-code matchmaking over auto-queue** — Simpler, more demonstrable for 2-player scope. A shared Redis Sorted Set is the natural upgrade path for queue-based pairing.
- **Redis as sole state store** — No in-memory fallback. Proves the `MatchStore` abstraction works and demonstrates production-grade thinking. Docker Compose provides Redis for local dev.
- **Single-process architecture** — Comfortably handles ~500 concurrent players. Horizontal scaling requires only `RedisMatchStore` (already implemented) + `socket.io-redis` adapter — two files, zero business logic changes.
- **Server-authoritative move timer** — Client timer is purely cosmetic. Eliminates manipulation via tab-backgrounding, device sleep, or direct tampering.
- **`MatchStore` as the scaling seam** — The interface exists from day one so Tier 1 → Tier 2 is a configuration change, not a rewrite.
