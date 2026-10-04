# Crypto Dashboard — Project Plan

## Stack
- **Backend**: Go 1.26, Fiber v2, PostgreSQL, Redis, JWT, WebSocket (gorilla/websocket)
- **Frontend**: React 18, TypeScript, Vite, TradingView Lightweight Charts, Tailwind CSS
- **APIs**: CoinGecko REST (free, no key), Binance WebSocket (real-time prices)
- **Infra**: Docker Compose (local), Railway/Render (deploy)

---

## Phase 1: Project Structure & Infrastructure

### Steps
1. Initialize Go module structure
   - Create folders: `cmd/`, `internal/config/`, `internal/db/`, `internal/redis/`, `internal/handler/`, `internal/middleware/`, `internal/model/`, `internal/service/`, `internal/ws/`
   - Install dependencies: Fiber, pgx, go-redis, golang-jwt, bcrypt, gorilla/websocket, godotenv
   - `cmd/main.go` — entry point, load config, connect DB/Redis, start server

2. Environment config
   - `.env` file: DB_URL, REDIS_URL, JWT_SECRET, PORT
   - `internal/config/config.go` — load and validate env vars

3. Docker Compose
   - `docker-compose.yml`: postgres, redis services
   - Health checks for both services

4. Database schema
   - `migrations/001_init.sql`: users, watchlist, alerts, portfolio tables
   - Run migrations on startup

### Checks
- [ ] `docker compose up -d` starts postgres and redis without errors
- [ ] `go run cmd/main.go` connects to DB and Redis, server starts on PORT
- [ ] `go vet ./...` passes with no errors

---

## Phase 2: Authentication

### Steps
1. User model & DB layer
   - `internal/model/user.go`: User struct
   - `internal/db/user.go`: CreateUser, GetUserByEmail

2. Auth service
   - `internal/service/auth.go`: Register (hash password with bcrypt), Login (verify + issue JWT)
   - Access token (15min) + Refresh token (7d), stored refresh in DB

3. Auth handlers
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `POST /api/auth/refresh`
   - `POST /api/auth/logout`

4. JWT middleware
   - `internal/middleware/auth.go`: validate Bearer token, inject user_id into context

### Checks
- [ ] Register returns 201 with tokens
- [ ] Login with wrong password returns 401
- [ ] Protected route returns 401 without token
- [ ] Protected route returns 200 with valid token
- [ ] `go test ./internal/service/... -v` passes

---

## Phase 3: Crypto Data & WebSocket

### Steps
1. CoinGecko service
   - `internal/service/coingecko.go`: GetTopCoins(limit), GetCoinHistory(id, days)
   - Cache responses in Redis (TTL: 60s for prices, 5min for history)

2. Binance WebSocket client
   - `internal/ws/binance.go`: connect to Binance stream, parse price updates
   - Fan-out to all connected clients

3. Internal WebSocket hub
   - `internal/ws/hub.go`: Hub struct, Register/Unregister clients, Broadcast
   - `internal/ws/client.go`: Client struct, read/write pumps

4. API endpoints
   - `GET /api/coins` — top coins list (cached)
   - `GET /api/coins/:id/history?days=7` — historical data
   - `GET /api/ws` — WebSocket upgrade for real-time prices

### Checks
- [ ] `GET /api/coins` returns list of coins with price data
- [ ] `GET /api/coins/bitcoin/history?days=7` returns 7 days of OHLC data
- [ ] WebSocket connection receives price updates within 2 seconds
- [ ] Redis cache is used (second request faster, check logs)

---

## Phase 4: User Features (Backend)

### Steps
1. Watchlist
   - `internal/db/watchlist.go`: AddToWatchlist, RemoveFromWatchlist, GetWatchlist
   - `POST /api/watchlist/:coin_id`
   - `DELETE /api/watchlist/:coin_id`
   - `GET /api/watchlist`

2. Portfolio
   - `internal/model/portfolio.go`: Holding struct (coin_id, amount, buy_price)
   - `internal/db/portfolio.go`: CRUD
   - `GET /api/portfolio` — returns holdings with current value calculated
   - `POST /api/portfolio`
   - `PUT /api/portfolio/:id`
   - `DELETE /api/portfolio/:id`

3. Alerts
   - `internal/model/alert.go`: Alert struct (coin_id, target_price, direction: above/below)
   - `internal/service/alerts.go`: CheckAlerts() — called on each price update
   - `GET /api/alerts`, `POST /api/alerts`, `DELETE /api/alerts/:id`

### Checks
- [ ] Add coin to watchlist, fetch watchlist — coin appears
- [ ] Add holding to portfolio, GET portfolio — shows current value
- [ ] Create alert, trigger price condition — alert fires (log output)
- [ ] All routes return 401 without JWT

---

## Phase 5: Frontend

### Steps
1. Project setup
   - `frontend/` folder: `npm create vite@latest -- --template react-ts`
   - Install: tailwindcss, @tanstack/react-query, react-router-dom, lightweight-charts, axios, zustand

2. Auth pages
   - `/login`, `/register` pages
   - Auth store (zustand): token, user, login/logout actions
   - Axios interceptor: attach Bearer token, handle 401 refresh

3. Dashboard page (`/`)
   - Top coins table: name, price, 24h change, sparkline
   - Real-time price updates via WebSocket
   - Add to watchlist button

4. Coin detail page (`/coin/:id`)
   - TradingView Lightweight Charts: candlestick chart
   - Period selector: 1D / 7D / 30D / 1Y
   - Current price (real-time via WS)
   - Add to portfolio / Set alert buttons

5. Portfolio page (`/portfolio`)
   - Table of holdings
   - Total value calculation
   - P&L per holding

6. Watchlist page (`/watchlist`)
   - List of watched coins with live prices

7. Alerts page (`/alerts`)
   - List of active alerts
   - Create/delete alert form

8. UI polish
   - Dark/light theme toggle (Tailwind dark mode)
   - Responsive layout
   - Loading skeletons
   - Error states

### Checks
- [ ] Login/register flow works end-to-end
- [ ] Dashboard shows coins with live price updates
- [ ] Chart renders on coin detail page
- [ ] Portfolio calculates correct total value
- [ ] Alerts appear in list and can be deleted
- [ ] Works on mobile viewport (375px)

---

## Phase 6: Deploy

### Steps
1. Dockerfiles
   - `Dockerfile.backend`: multi-stage Go build
   - `Dockerfile.frontend`: build React, serve with nginx

2. Deploy backend to Railway
   - Connect GitHub repo
   - Set env vars
   - Add PostgreSQL and Redis plugins

3. Deploy frontend to Vercel or Netlify
   - Set `VITE_API_URL` env var
   - Configure SPA routing

4. Final checks
   - All API calls use HTTPS
   - CORS configured for production domain
   - JWT_SECRET is strong and stored as secret

### Checks
- [ ] Production URL loads the app
- [ ] Login works in production
- [ ] Real-time prices work in production
- [ ] No console errors in browser

---

## Progress Tracker
- [ ] Phase 1: Infrastructure
- [ ] Phase 2: Authentication
- [ ] Phase 3: Crypto Data & WebSocket
- [ ] Phase 4: User Features
- [ ] Phase 5: Frontend
- [ ] Phase 6: Deploy
