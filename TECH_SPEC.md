# BroVerse Technical Specification (Production-Ready)

**Scope:** Multi-user social + challenge platform with AI memory, real-time messaging, and strong security. Target deployment: Azure (same app).

---

## I. Core Architecture

### Recommended Stack
- **Frontend:** React (current)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Cache/Queue:** Redis
- **Realtime:** WebSockets (Socket.IO)
- **Search (optional v2):** Postgres FTS or Elastic
- **Object Storage:** Azure Blob Storage
- **Hosting:** Azure App Service (API) + Azure Static Web Apps (frontend)

### High-Level Services
- **API Gateway** (Express app)
- **Auth Service** (JWT + refresh tokens)
- **Board Service** (posts/comments/reactions)
- **Challenge Service** (streaks, check-ins, leaderboards)
- **Messaging Service** (WebSockets + inbox)
- **Notification Service** (in-app + push/email/SMS)
- **Moderation Service** (flags + review)
- **AI Memory Service** (store & retrieve user memories)

### Deployment Topology (Azure)
- **Frontend:** Azure Static Web Apps
- **Backend:** Azure App Service (Node)
- **Postgres:** Azure Database for PostgreSQL
- **Redis:** Azure Cache for Redis
- **Storage:** Azure Blob Storage
- **Monitoring:** Application Insights

---

## II. Data Model (PostgreSQL)

> **Note:** `id` is UUID, `created_at`/`updated_at` are timestamps. All tables include `created_at`.

### 1) users
- `id` (uuid, pk)
- `email` (unique)
- `password_hash`
- `display_name`
- `tagline`
- `avatar_url`
- `bio`
- `role` (user|mod|admin)
- `is_verified` (bool)
- `is_banned` (bool)
- `last_login_at`
- `reputation_score` (int)

### 2) user_profiles
- `user_id` (pk, fk users)
- `location`
- `timezone`
- `birth_year` (optional)
- `preferences` (jsonb)

### 3) relationships
- `id`
- `requester_id` (fk users)
- `addressee_id` (fk users)
- `status` (pending|accepted|blocked)
- `created_at`

### 4) posts
- `id`
- `author_id` (fk users)
- `visibility` (public|friends|private)
- `type` (reflection|challenge|victory|wisdom|confession)
- `content` (text)
- `media_url` (nullable)
- `challenge_id` (nullable)
- `is_deleted` (bool)

### 5) comments
- `id`
- `post_id` (fk posts)
- `author_id` (fk users)
- `parent_id` (nullable fk comments) // threaded
- `content`
- `is_deleted` (bool)

### 6) reactions
- `id`
- `post_id` (fk posts)
- `user_id` (fk users)
- `type` (helpful|challenged|share|bookmark|like)

### 7) challenges
- `id`
- `creator_id` (fk users)
- `title`
- `description`
- `challenge_type` (daily|weekly|30_day|custom)
- `start_date`
- `end_date`
- `rules` (jsonb)

### 8) challenge_participants
- `id`
- `challenge_id` (fk challenges)
- `user_id` (fk users)
- `status` (active|completed|dropped)
- `current_streak`
- `best_streak`

### 9) challenge_checkins
- `id`
- `participant_id` (fk challenge_participants)
- `checkin_date`
- `notes`

### 10) conversations
- `id`
- `is_group` (bool)
- `created_by` (fk users)

### 11) conversation_members
- `id`
- `conversation_id` (fk conversations)
- `user_id` (fk users)
- `role` (member|admin)

### 12) messages
- `id`
- `conversation_id` (fk conversations)
- `sender_id` (fk users)
- `content`
- `media_url` (nullable)
- `is_read` (bool)

### 13) notifications
- `id`
- `user_id` (fk users)
- `type` (comment|reaction|follow|challenge|message|system)
- `payload` (jsonb)
- `is_read` (bool)

### 14) badges
- `id`
- `name`
- `description`
- `criteria` (jsonb)

### 15) user_badges
- `id`
- `user_id` (fk users)
- `badge_id` (fk badges)
- `earned_at`

### 16) reports
- `id`
- `reporter_id` (fk users)
- `target_type` (post|comment|user|message)
- `target_id` (uuid)
- `reason`
- `status` (open|reviewed|actioned)

### 17) ai_threads
- `id`
- `user_id` (fk users)
- `persona_id` (string)
- `title`

### 18) ai_messages
- `id`
- `thread_id` (fk ai_threads)
- `role` (user|assistant|system)
- `content`
- `tokens`

### 19) ai_memories
- `id`
- `user_id` (fk users)
- `persona_id` (string)
- `summary`
- `embedding` (vector)
- `source` (conversation|challenge|profile)

### 20) audit_log
- `id`
- `actor_id` (fk users)
- `action`
- `target_type`
- `target_id`
- `metadata` (jsonb)

---

## III. Core Features

### Auth & Authorization
- JWT access tokens + refresh tokens
- Password hashing with bcrypt
- Role-based access (user/mod/admin)

### Feed Algorithm (Weighted)
- Weights: recency, relationship strength, engagement, relevance tag
- Score = (recency * 0.4) + (relationship * 0.25) + (engagement * 0.25) + (topic match * 0.1)

### Posts
- Post types: reflection, challenge, victory, wisdom, confession
- Attach media via Blob Storage
- Visibility: public/friends/private

### Threaded Comments
- Depth-limited nesting
- Soft delete

### Real-Time Messaging
- WebSocket events: typing, delivered, read receipts

### Challenge System
- Daily/Weekly/30-day/Custom
- Accountability partner
- Streaks + check-ins
- Leaderboards + rewards

---

## IV. Engagement & Social

- Reactions: helpful, challenged, share, bookmark, like
- Profiles: badges, reputation score
- Discovery: keyword + tag search
- Notifications: in-app, push, email, SMS
- Moderation: auto-flag + human review

---

## V. Technical Specs

### REST Endpoints (Sample)
- **Auth**: /auth/register, /auth/login, /auth/refresh
- **Posts**: /posts, /posts/:id, /posts/:id/comments
- **Reactions**: /posts/:id/reactions
- **Challenges**: /challenges, /challenges/:id/join
- **Messages**: /conversations, /messages
- **Notifications**: /notifications

### JWT Structure
- `sub`, `role`, `exp`, `iat`, `scopes`

### Rate Limits
- Auth: 10 req/min
- Post creation: 5 req/min
- Messaging: 30 msg/min

### Caching (Redis)
- Feed results per user (60s)
- Notification counts (30s)

### Performance
- DB indexing on `author_id`, `created_at`, `post_id`, `conversation_id`
- Pagination everywhere
- CDN for static assets

### Compliance
- GDPR export/delete endpoints
- Clear privacy policy

---

## VI. Implementation Roadmap (24+ Weeks)

### Phase 1 (Weeks 1–6)
- Auth + user profiles
- Core posts + comments
- Basic feed

### Phase 2 (Weeks 7–12)
- Reactions, notifications
- Messaging (WebSockets)
- Moderation basics

### Phase 3 (Weeks 13–18)
- Challenges + streaks
- Leaderboards
- Badges

### Phase 4 (Weeks 19–24)
- AI memory integration
- Persona isolation
- Performance hardening

---

## AI Memory & Persona Isolation

- **Memory per user** (no cross-contamination)
- **Persona isolation**: each AI persona has its own container or strict persona ID partitioning
- **Retrieval**: search memory by thread, challenge history, and key growth milestones
- **Latency**: cache recent summaries in Redis

---

## Production Readiness Checklist

- ✅ JWT + bcrypt + TLS
- ✅ Rate limiting + WAF
- ✅ Observability (App Insights)
- ✅ Backups + DR
- ✅ Moderation + reporting
- ✅ GDPR + privacy

---

**Next:** I can scaffold the API, DB migrations, and connect the frontend board to these endpoints, then deploy to Azure.