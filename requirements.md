# Party Olympiade — Requirements Document

> Version 1.0 · April 2026

---

## 1. Project Overview

**Party Olympiade** is a web application for hosting a structured gaming-olympics event with friends. A designated **host** creates the event, builds the game programme, manages the participant roster, controls the flow between games and enters scores after each one. **Participants** join via a shared room code and follow the event live on their own devices — seeing the current game details and a real-time leaderboard — without needing accounts.

The website does **not** host or run the games themselves; it is a **score tracker and event presenter**.

---

## 2. Vision & Goals

| Goal            | Description                                                             |
| --------------- | ----------------------------------------------------------------------- |
| Fun-first       | Dark, vibrant, party-ready UI that feels exciting on a TV and on mobile |
| Low friction    | No accounts, no installs; join with a code in seconds                   |
| Host in control | One person drives the whole event — games, scores, pace                 |
| Real-time       | Every participant's device updates the moment the host acts             |
| Extensible      | Clean data model that can grow (profiles, history, CDN images, etc.)    |

---

## 3. Tech Stack

| Layer              | Technology                     | Rationale                                               |
| ------------------ | ------------------------------ | ------------------------------------------------------- |
| Frontend           | **React 18** + **Vite**        | Fast dev experience, component model                    |
| Styling            | **Tailwind CSS v3**            | Utility-first, no stylesheet bloat                      |
| Routing            | **React Router v6**            | Standard React routing                                  |
| State              | **Zustand**                    | Minimal, no boilerplate                                 |
| Real-time (client) | **Socket.IO-client**           | Bi-directional real-time updates                        |
| HTTP               | **Axios**                      | Promise-based, interceptor support                      |
| Backend            | **Node.js** + **Express**      | Lightweight, well-known                                 |
| Real-time (server) | **Socket.IO**                  | Pairs perfectly with the client                         |
| Database           | **MongoDB** + **Mongoose**     | Flexible document model, embedded sub-docs              |
| Images             | **Base64 in MongoDB**          | Zero extra services for v1; swap to S3/Cloudinary later |
| Dev tooling        | **Nodemon** + **Concurrently** | Hot reload on both sides in one terminal                |

---

## 4. User Roles

| Role                 | Description                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Host**             | Creates the Olympic. Controls game flow, submits scores, ends the event. Identified by a UUID `hostToken` stored in `localStorage` and verified server-side. |
| **Participant**      | Joins via room code + name. Read-only view: sees current game & live leaderboard.                                                                            |
| **Spectator** _(v2)_ | Like Participant but without a registered name; just watches.                                                                                                |

---

## 5. Functional Requirements

### 5.1 Olympic Builder (Multi-Step Wizard)

#### Step 1 — Event Setup

- [ ] Olympic name (required, max 60 chars)
- [ ] Tie-breaking rule:
  - _Tiebreaker question_ — ties shown as-is; host resolves manually
  - _Shared points_ — tied players split the combined point value of their places
- [ ] Optional bonus/penalty rules (toggles):
  - **Comeback Penalty** — Previous leader not in top 1 → −2 pts
  - **Last Place Bonus** — Previous last-place in top 1 → +1 pt
  - **Win Streak Bonus** — FFA winner of previous FFA game wins again → +1 pt
  - **Final Double Points** — Last game awards 2× base points

#### Step 2 — Participants

- [ ] Add participant: **name** (required, max 30 chars, unique), **avatar** (image upload → base64, max 2 MB), **stats** (all 1–10 sliders)
  - 🧠 IQ — Trivia & puzzle skill
  - 🎯 Shooter — FPS / aiming skill
  - 🎉 Party Animal — Enthusiasm & social energy
  - 🏎 Driver — Racing game skill
  - ♟ Strategist — Strategy & planning skill
- [ ] Remove participants
- [ ] Minimum 2 participants to proceed

#### Step 3 — Games

- [ ] Add game: **title** (required, max 60 chars), **mode** (FFA / Teams), **emoji icon**, **rules** (textarea, max 1 000 chars), **cover image** (base64, max 2 MB)
- [ ] Optional add-ons per game:
  - 🍺 **Drinking game mode** — toggle + custom drinking rules text
  - ⏱ **Time limit** — minutes (0 = unlimited)
  - 🛠 **Equipment needed** — free text
  - ⚖ **Handicap rules** — free text
  - 👥 **Team size** — players per team (shown only for team mode)
- [ ] Reorder games (up/down buttons)
- [ ] Remove games
- [ ] Minimum 1 game to proceed

#### Step 4 — Preview & Launch

- [ ] Summary: event name, participant count, game list
- [ ] **"Launch Olympic"** — POSTs to API, stores `hostToken` in `localStorage`, redirects to Host Room

---

### 5.2 Room System

- [ ] Unique 4-character uppercase alphanumeric code per Olympic (e.g. `A3XK`)
- [ ] Host receives a UUID `hostToken` on creation; stored in `localStorage` under key `hostToken_<code>`
- [ ] Participants navigate to `/join`, enter room code + their name
- [ ] Multiple devices in the same room are fully supported
- [ ] All state changes broadcast in real-time via Socket.IO

---

### 5.3 Host Control Panel (`/room/:code/host`)

- [ ] Current game card (cover image, title, rules, active add-ons)
- [ ] **Prev / Next** navigation between games (broadcasts to all)
- [ ] **Score Entry panel** — opens inline:
  - FFA: assign 1st … Nth place to each participant (dropdown or drag-order)
  - Teams: define teams for this game, select winning team
- [ ] **Submit Score** → leaderboard updates in real-time for all devices
- [ ] Re-enter / override score for any previously scored game
- [ ] **"End Olympic"** button → triggers winner screen for all connected devices
- [ ] Mini-leaderboard always visible

---

### 5.4 Score Calculation

**FFA (Free-for-All):**

```
Place 1 → N points
Place 2 → N−1 points
…
Place N → 1 point
```

If _Final Double Points_ is active and this is the last game: all base points × 2.

**Teams:**

```
Winning team member → ⌈N/2⌉ points
Losing  team member → ⌊N/4⌋ points
(N = total participant count)
```

**Bonus / Penalty (FFA only, applied after base scoring):**
| Rule | Trigger | Delta |
|------|---------|-------|
| Comeback Penalty | Prev game leader not in top 3 this game | −2 |
| Last Place Bonus | Prev game last-place in top 3 this game | +1 |
| Win Streak | FFA winner also won previous FFA game | +1 |

---

### 5.5 Participant View (`/room/:code`)

- [ ] Join form: room code + name
- [ ] Current game card (same visuals as host view, no controls)
- [ ] Live leaderboard (auto-updates via socket)
- [ ] Own row highlighted
- [ ] Mobile-first layout

---

### 5.6 Live Scoreboard

- [ ] Columns: Rank · Name · Total · Base Pts · Bonus/Penalty · Wins
- [ ] Progress bar: X of Y games completed
- [ ] Rank-change flash animation on update
- [ ] Accessible to all roles at all times

---

### 5.7 Winner Screen (`/room/:code/winner`)

- [ ] Podium (top 3, animated reveal, confetti)
- [ ] Full final leaderboard table
- [ ] Per-player bonus/penalty log
- [ ] "Copy Results" → clipboard text summary
- [ ] "Start New Olympic" → `/create`

---

## 6. Non-Functional Requirements

| Requirement       | Target                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------ |
| Real-time latency | < 1 s from host action to all client updates                                                           |
| Mobile-ready      | Participant view fully usable on 375 px screen                                                         |
| No accounts       | Zero sign-up friction                                                                                  |
| Image limit       | 2 MB per image, validated client-side                                                                  |
| Data persistence  | All Olympic data stored in MongoDB; no TTL in v1                                                       |
| Security          | `hostToken` verified server-side on every mutating socket event; room codes are random, not sequential |

---

## 7. Data Models

### Olympic (top-level document)

```jsonc
{
  "_id": "ObjectId",
  "code": "A3XK", // unique 4-char room code
  "name": "Summer Gaming Olympics 2025",
  "hostToken": "uuid-v4", // secret; never sent to participants
  "status": "setup | active | finished",
  "currentGameIndex": 0,
  "tieRule": "tiebreaker | shared_points",
  "extraRules": {
    "comebackPenalty": false,
    "lastPlaceBonus": false,
    "winStreakBonus": false,
    "finalDoublePoints": false,
  },
  "participants": [
    /* ParticipantSchema[] */
  ],
  "games": [
    /* GameSchema[] */
  ],
  "results": [
    /* ResultSchema[] */
  ],
  "createdAt": "ISODate",
}
```

### Participant (embedded)

```jsonc
{
  "_id": "ObjectId",
  "name": "Alice",
  "avatarBase64": "data:image/jpeg;base64,...",
  "stats": {
    "iq": 7,
    "shooter": 5,
    "partyAnimal": 9,
    "driver": 6,
    "strategist": 8,
  },
}
```

### Game (embedded)

```jsonc
{
  "_id": "ObjectId",
  "title": "Mario Kart",
  "mode": "ffa | team",
  "icon": "🏎",
  "rules": "First to finish 3 races wins overall.",
  "imageBase64": "data:image/jpeg;base64,...",
  "order": 0,
  "addons": {
    "drinkingGame": { "enabled": false, "rules": "" },
    "timeLimit": 0,
    "equipment": "",
    "handicap": "",
    "teamSize": 2,
  },
}
```

### Result (embedded)

```jsonc
{
  "gameId": "ObjectId",
  "placements": [
    { "participantName": "Alice", "place": 1 },
    { "participantName": "Bob", "place": 2 },
  ],
  "teams": [
    { "name": "Team A", "members": ["Alice", "Charlie"], "won": true },
    { "name": "Team B", "members": ["Bob", "Dave"], "won": false },
  ],
}
```

---

## 8. REST API

| Method   | Path                                  | Auth      | Description                           |
| -------- | ------------------------------------- | --------- | ------------------------------------- |
| `POST`   | `/api/olympics`                       | —         | Create new Olympic                    |
| `GET`    | `/api/olympics/:code`                 | —         | Get full Olympic state (no hostToken) |
| `POST`   | `/api/olympics/:code/results`         | hostToken | Submit / upsert game result           |
| `DELETE` | `/api/olympics/:code/results/:gameId` | hostToken | Remove a game result                  |
| `PATCH`  | `/api/olympics/:code/navigate`        | hostToken | Move `currentGameIndex` ±1            |
| `PATCH`  | `/api/olympics/:code/status`          | hostToken | Update status (active / finished)     |
| `GET`    | `/api/olympics/:code/leaderboard`     | —         | Computed leaderboard                  |

> `hostToken` is sent in the `x-host-token` request header.

---

## 9. Socket.IO Events

| Event            | Direction | Payload                              | Description                 |
| ---------------- | --------- | ------------------------------------ | --------------------------- |
| `join-room`      | C → S     | `{ code, name, isHost, hostToken? }` | Join a room by code         |
| `room-update`    | S → C     | `{ olympic, leaderboard }`           | Full state broadcast        |
| `navigate`       | Host → S  | `{ code, direction, hostToken }`     | Navigate games              |
| `submit-score`   | Host → S  | `{ code, result, hostToken }`        | Submit / update game result |
| `finish-olympic` | Host → S  | `{ code, hostToken }`                | End the event               |
| `error`          | S → C     | `{ message }`                        | Server-side error           |

---

## 10. Page Inventory

| Path                 | Component         | Access             |
| -------------------- | ----------------- | ------------------ |
| `/`                  | `HomePage`        | Public             |
| `/create`            | `CreatePage`      | Public             |
| `/join`              | `JoinPage`        | Public             |
| `/room/:code`        | `ParticipantView` | Participant        |
| `/room/:code/host`   | `HostRoomPage`    | Host (token check) |
| `/room/:code/winner` | `WinnerPage`      | Public             |

---

## 11. UI / UX Design Language

- **Theme**: Deep space (dark navy/black), with purple → pink gradients for primary actions and cyan for highlights
- **Glassmorphism** cards: `backdrop-filter: blur(20px)` + semi-transparent dark background + subtle white border
- **Typography**: Inter (system font stack fallback)
- **Animations**: smooth page fade-in, score-update colour flash, podium staggered reveal, confetti on winner screen
- **Responsive breakpoints**: mobile-first; participant view works at 375 px; host panel works at ≥ 768 px

---

## 12. Project Structure

```
party-olympiade/
├── requirements.md          ← this file
├── package.json             ← root (concurrently scripts)
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── server.js
│   └── src/
│       ├── models/Olympic.js
│       ├── routes/olympics.js
│       ├── socket/index.js
│       └── utils/scoring.js
└── client/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/client.js
        ├── socket/socket.js
        ├── store/useOlympicStore.js
        ├── utils/scoring.js
        ├── pages/
        │   ├── HomePage.jsx
        │   ├── CreatePage.jsx
        │   ├── JoinPage.jsx
        │   ├── HostRoomPage.jsx
        │   ├── ParticipantView.jsx
        │   └── WinnerPage.jsx
        └── components/
            ├── ui/           (GlassCard, Button, Input, StatSlider)
            ├── Scoreboard.jsx
            ├── GameCard.jsx
            ├── ParticipantCard.jsx
            ├── ScoreEntry.jsx
            └── Podium.jsx
```

---

## 13. Out of Scope (v1)

- User accounts / authentication
- Cross-event player profiles or history
- Image CDN / S3 storage
- Spectator mode
- Chat or emoji reactions
- Push notifications
- QR code room entry
- Mobile native app

---

## 14. Future Enhancements (v2+)

- Player profiles with stats history across events
- Image upload to Cloudinary / AWS S3
- Animated game countdown timers
- Team randomiser tool
- Custom point systems per game
- Public / discoverable rooms
- OAuth sign-in (Google, Discord)
- Export results to PDF or image
