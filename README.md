# 🎟️ Venuro — Entertainment Discovery & Real-Time Event Booking Platform

[![CI/CD Pipeline](https://github.com/vishwambhar-kinage/venuro/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/vishwambhar-kinage/venuro/actions)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933.svg?style=flat&logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000.svg?style=flat&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_Vector-47A248.svg?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Distributed_Lock-DC382D.svg?style=flat&logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=docker)](https://www.docker.com/)

**Venuro** is an enterprise full-stack entertainment discovery and booking platform engineered for high-concurrency ticket reservation workloads. It features a 3-tier Role-Based Access Control (RBAC) architecture (**Customer**, **Organizer / Coordinator**, **Admin**), sub-second distributed seat locking powered by Redis (`SET NX EX 300`), real-time Socket.IO synchronization, cryptographic digital ticket issuance (HMAC-SHA256), automated tiered refund workflows, and an AI discovery copilot powered by Google Gemini 1.5 Flash and vector cosine similarity search.

---

## 🏗️ System Architecture & Engineering Design

The platform uses a decoupled microservices architecture designed to eliminate race conditions under spike traffic and ensure zero double-booking during high-demand event releases.

```mermaid
flowchart TD
    subgraph Client_Layer["🖥️ Client Presentation Layer"]
        UI["React 18 SPA (Vite + Tailwind CSS)"]
        State["Auth & Socket Context State"]
        Matrix["Interactive Multi-Tier Seat Matrix"]
        UI <--> State
        State <--> Matrix
    end

    subgraph RealTime_Sync["⚡ Real-Time Concurrency Layer"]
        WS["Socket.IO Server (Room-based Show Broadcasts)"]
    end

    subgraph Gateway_Layer["🛡️ Application Gateway & Middleware Layer"]
        API["Express.js REST API Gateway"]
        AuthMid["JWT & RBAC Security Middleware"]
        RateLimit["Rate Limiting & Helmet Guard"]
        API --> AuthMid
        API --> RateLimit
    end

    subgraph Core_Services["⚙️ Microservice & Business Logic Engines"]
        LockSvc["Distributed Lock Service (Redis SET NX EX 300)"]
        PaySvc["Payment Engine & HMAC-SHA256 Signature Verification"]
        QRSvc["Cryptographic Pass Generator & Verification"]
        RAGSvc["AI Semantic RAG Engine & Cosine Vector Search"]
        RefundSvc["Instant Automated Wallet Refund Engine"]
    end

    subgraph Storage_Cloud["🗄️ Persistence & Infrastructure Layer"]
        RedisDB[("Redis Cloud / Distributed Lock Store")]
        MongoDBAtlas[("MongoDB Atlas (M0 Cluster & Vector Indexes)")]
        GeminiAI["Google Gemini 1.5 Flash LLM"]
    end

    %% Flow connections
    Client_Layer <-->|Bi-Directional Events| WS
    Client_Layer -->|HTTPS REST API| API
    
    AuthMid --> LockSvc
    AuthMid --> PaySvc
    AuthMid --> QRSvc
    AuthMid --> RAGSvc
    AuthMid --> RefundSvc

    LockSvc <-->|Atomic Acquire / Release / Heartbeat| RedisDB
    WS <-->|Seat Status Changes| LockSvc
    PaySvc <-->|Order Creation & Verification| MongoDBAtlas
    QRSvc <-->|Signed Ticket Metadata| MongoDBAtlas
    RAGSvc <-->|Contextual Embeddings & Knowledge Base| GeminiAI
    RefundSvc <-->|Balance Updates & Status Staging| MongoDBAtlas
```

---

## ⚡ High-Concurrency Distributed Seat Locking Flow

During high-volume ticket drops, hundreds of concurrent users may attempt to reserve the same seat simultaneously. Venuro solves this with distributed Redis locks:

```mermaid
sequenceDiagram
    autonumber
    actor UserA as User A (Browser)
    actor UserB as User B (Browser)
    participant Server as Express & Socket Server
    participant Redis as Redis Distributed Engine
    participant DB as MongoDB Document Store

    UserA->>Server: Select Seat (Show: #101, Seat: #A1)
    Server->>Redis: SET seat_lock:101:A1 userId_A NX EX 300
    Redis-->>Server: 1 (Lock Acquired Successfully)
    Server-->>UserA: 200 OK (5-min Countdown Started)
    Server->>UserB: Socket Broadcast: Seat A1 LOCKED (Yellow)

    Note over UserB: User B attempts same seat within 5 min
    UserB->>Server: Select Seat (Show: #101, Seat: #A1)
    Server->>Redis: SET seat_lock:101:A1 userId_B NX EX 300
    Redis-->>Server: 0 (Key Already Exists - Failed)
    Server-->>UserB: 409 Conflict: Seat Held by Another User

    alt User A Completes Payment
        UserA->>Server: Confirm Payment (HMAC Verified)
        Server->>DB: Update Show: Mark Seat A1 as BOOKED
        Server->>Redis: DEL seat_lock:101:A1
        Server->>UserA: Issue Cryptographic QR Ticket
        Server->>UserB: Socket Broadcast: Seat A1 BOOKED (Red)
    else User A Abandons Session (>300s TTL Expiry)
        Redis-->>Server: Key Expired Automatically
        Server->>UserB: Socket Broadcast: Seat A1 AVAILABLE (Green)
    end
```

---

## 🌟 Key Technical Highlights

### 1. 👥 Multi-Role Architecture & Staging Lifecycle
- **Customer**: Categorized catalog discovery, budget filtering, live seat reservations, and wallet management.
- **Event Organizer**: Event creation lifecycle (`DRAFT` &rarr; `PENDING_APPROVAL` &rarr; `PUBLISHED`), show scheduling, sales dashboards, and gate QR admission scanning.
- **Platform Admin**: Platform GMV analytics, approval queues, event moderation, and system telemetry.

### 2. 💺 Concurrency & Double-Booking Prevention
- **Atomic Operations**: Redis `SET NX EX 300` guarantees that only one request can acquire a seat lock, even under race conditions.
- **Real-Time Synchronization**: Socket.IO broadcasts updates to all active sessions in the same show room.
- **Heartbeat & TTL**: Abandoned checkout sessions automatically expire after 300 seconds, returning seats to the available pool.

### 3. 🤖 AI Discovery Assistant & Vector Search
- **Conversational Booking Copilot**: Powered by **Google Gemini 1.5 Flash** for natural language recommendations, cast searches, and venue inquiries.
- **Semantic RAG Engine**: Vector cosine similarity search calculates matching scores across platform knowledge base documents (venue accessibility, parking, refund policies).

### 4. 💳 Cryptographic Passes & Automated Refunds
- **HMAC-SHA256 QR Passes**: Digital tickets contain cryptographically signed payloads that prevent forged passes and enable fast offline verification.
- **Tiered Refund Automation**:
  - `> 24 hours` before showtime: **100% full refund**
  - `4 - 24 hours` before showtime: **70% partial refund**
  - `< 4 hours` before showtime: Non-refundable policy
  - Instant automated deposits directly to the user's **Venuro Wallet**.

---

## 🚀 Deployment & Local Setup

### Prerequisites
- **Node.js**: v18.0 or higher
- **npm**: v9.0 or higher

### Option A: Local Development

```bash
# 1. Clone the repository
git clone https://github.com/vishwambhar-kinage/venuro.git
cd venuro

# 2. Start Backend Server (Port 5000)
cd server
npm install
npm start

# 3. Start Frontend Client (Port 3000)
cd ../client
npm install
npm run dev
```

### Option B: Docker Compose Multi-Container Stack

```bash
docker-compose up --build
```
- **Web Application**: `http://localhost:3000`
- **Backend API Gateway**: `http://localhost:5000/api`
- **Health Telemetry**: `http://localhost:5000/api/health`

---

## 🧪 Automated Testing Suite

Run the end-to-end integration and unit test suite (Auth RBAC, Redis Locking, QR Signatures, and RAG):
```bash
cd server
npm test
```

---

## 🔐 Role Access Endpoints

| Portal Role | Route | Access Level |
| :--- | :--- | :--- |
| **Customer** | `/auth` | Public catalog browsing, seat reservation, wallet & QR passes |
| **Organizer** | `/organizer/login` | Event submission, showtime scheduling, gate admission scanner |
| **Admin** | `/admin/login` | Platform analytics, approval workflows, user governance |

---

## 📡 REST API Gateway Reference

### Authentication & RBAC
- `POST /api/auth/register` — Register customer account
- `POST /api/auth/login` — Authenticate and receive JWT token
- `GET /api/auth/me` — Retrieve active user session profile

### Events & Shows
- `GET /api/events` — Query published events with category & city filters
- `GET /api/events/:id` — Event details, cast, crew, and scheduled showtimes
- `POST /api/events` — Create new event (Organizer/Admin)
- `GET /api/shows/:showId/seat-map` — Real-time seat availability matrix

### Concurrency & Bookings
- `POST /api/shows/:showId/lock` — Acquire Redis lock for selected seats (`NX EX 300`)
- `POST /api/shows/:showId/unlock` — Release held seat locks
- `POST /api/payment/verify` — Verify HMAC payment signature and confirm booking
- `POST /api/bookings/:id/cancel` — Trigger automated refund workflow

### AI Discovery & Search
- `POST /api/ai/chat` — Gemini 1.5 Flash conversational discovery copilot
- `GET /api/ai/semantic-search` — Vector cosine similarity search query
