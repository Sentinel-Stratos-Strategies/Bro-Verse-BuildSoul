# BroVerse Milestone Plan - Final Push to MVP

## Status Summary (as of Jan 28, 2026)

### ✅ Completed (Milestone 3 - Board + Realtime Notifications)
- Board CRUD (posts, comments, reactions, challenges)
- User authentication (register, login, JWT tokens, session persistence)
- Database (PostgreSQL, Prisma migrations, notifications table)
- Realtime notifications (polling + SSE stream endpoint)
- Custom domain (https://broverse.sentinelstratosstrategies.com live)
- SPA routing fixed; artifact size optimized
- Demo content for unauthenticated users
- Auth expiry detection + session cleanup

### 🔧 Infrastructure Status
| Component | Status | Notes |
|-----------|--------|-------|
| Azure Subscription | ✅ Active | ID: 4f2c922f-7d01-412b-afbf-44a19d395230 |
| SWA Frontend | ✅ Running | https://broverse.sentinelstratosstrategies.com (200 OK) |
| App Service API | ✅ Running | https://broverse-api-20260127.azurewebsites.net (Health OK) |
| PostgreSQL DB | ✅ Running | broverse-pg (Central US) |
| GitHub Auth | ✅ Connected | joeathan account, SSH configured |
| Azure CLI | ✅ Installed | Authenticated, provider registration active |
| **Storage Provider** | ✅ **Registered** | Microsoft.Storage ready (was blocking, now UNBLOCKED) |
| **Cosmos Provider** | ✅ **Registered** | Microsoft.DocumentDB ready (was blocking, now UNBLOCKED) |

### 📊 Resource Group: broverse-rg
```
broverse-pg                (PostgreSQL Server)
broverse-plan              (App Service Plan)
broverse-api-20260127      (App Service)
broverse-ai                (Application Insights)
```

### 🚀 Recent Deployments
| Workflow | Latest Run | Status | Time |
|----------|-----------|--------|------|
| azure-static-web-apps-broverse.yml | Jan 28 05:50 | ✅ Success | Realtime notifications |
| azure-webapp-api.yml | Jan 28 05:50 | ✅ Success | API deployment |

---

## 📋 Milestone Plan: 5-Phase Execution

### **Milestone 4: AI Profiles Infrastructure** (Current Phase)
**Goal**: Set up data storage + persistence layer for AI bot personalities
**Estimated Duration**: 3-4 hours
**Cost Impact**: ~$50-75 Azure (Storage account setup, Cosmos DB throughput)
**Auto-Approval Gate**: Cosmos DB container created + schema validated

#### Phase 4.1: Azure Storage Account Setup (30 min)
**Description**: Create blob storage for user uploads + media
**Tasks**:
- [ ] Create Storage account (Standard_LRS, StorageV2) in broverse-rg
  - Name: `broversteu<timestamp>` (e.g., brovverseu20260128)
  - Region: Central US
  - Performance: Standard
  - Redundancy: Locally Redundant (LRS)
- [ ] Create "uploads" blob container (private access)
- [ ] Enable CORS for API domain
- [ ] Get connection string → set as App Service env var `AZURE_STORAGE_CONNECTION_STRING`
- [ ] Set container name env var `AZURE_STORAGE_CONTAINER=uploads`

**Command Reference**:
```bash
# Create storage account
az storage account create \
  -g broverse-rg \
  -n brovverseu$(date +%s) \
  --sku Standard_LRS \
  --kind StorageV2 \
  -l centralus

# Create container
az storage container create \
  -n uploads \
  --account-name <STORAGE_NAME> \
  --auth-mode key

# Get connection string
az storage account show-connection-string \
  -g broverse-rg \
  -n <STORAGE_NAME>

# Set in App Service
az webapp config appsettings set \
  -g broverse-rg \
  -n broverse-api-20260127 \
  --settings AZURE_STORAGE_CONNECTION_STRING="<CONNECTION_STRING>" \
  AZURE_STORAGE_CONTAINER="uploads"
```

**Auto-Approve When**: Connection string successfully stored in App Service settings

---

#### Phase 4.2: Upload Endpoints Implementation (1 hour)
**Description**: Add file upload routes with quota enforcement
**Tasks**:
- [ ] Install Azure Storage SDK: `npm install @azure/storage-blob`
- [ ] Create `backend/src/services/storageService.js` with:
  - `uploadBlob(userId, file)` → returns signed URL + metadata
  - `deleteBlob(blobName)` → cleanup
  - `getQuotaUsage(userId)` → fetch from Cosmos AI profile
- [ ] Add POST `/posts/upload` endpoint:
  - Accepts multipart/form-data (file + postId)
  - Validates file size (max 50MB per file, max 5GB per user)
  - Uploads to storage
  - Links to post via postId
  - Returns signed URL (7-day expiry)
- [ ] Add POST `/ai-profiles/:userId/upload` endpoint:
  - Uploads avatar/persona images
  - 10MB max per file
- [ ] Add middleware to track storage usage against quota

**File Changes**:
- `backend/src/services/storageService.js` (new)
- `backend/src/routes/posts.js` (add upload endpoint)
- `backend/src/utils/constants.js` (add quota limits)

**Auto-Approve When**: Upload endpoint tested and returns signed URL for test file

---

#### Phase 4.3: Cosmos DB AI Profiles Schema (1.5 hours)
**Description**: Design and deploy Cosmos DB container for AI bot personalities
**Tasks**:
- [ ] Create Cosmos DB account in broverse-rg
  - API: Core (SQL)
  - Capacity Mode: Provisioned (400 RU/s for MVP)
  - Region: Central US
- [ ] Create database "broverse"
- [ ] Create container "ai-profiles" with partition key `/userId`
- [ ] Index strategy:
  - Composite index on userId + personas[*].id for query efficiency
  - TTL disabled (permanent storage)
  - Max RU/s: 400 for MVP (scales later)

**Schema Design** (Sample document):
```json
{
  "id": "<UUID>",
  "userId": "<USER_ID>",
  "createdAt": "2026-01-28T12:00:00Z",
  "updatedAt": "2026-01-28T12:00:00Z",
  "storageQuota": 5000000000,           // 5GB per user
  "storageUsed": 125000000,             // Current usage
  "personas": [
    {
      "id": "<UUID>",
      "name": "dickdiggs",
      "systemPrompt": "<AI_SYSTEM_PROMPT>",
      "model": "gpt-4",
      "status": "active|inactive",
      "conversationHistory": [
        {
          "role": "user",
          "content": "...",
          "timestamp": "2026-01-28T12:05:00Z"
        },
        {
          "role": "assistant",
          "content": "...",
          "timestamp": "2026-01-28T12:05:15Z"
        }
      ],
      "metadata": {
        "createdAt": "2026-01-28T12:00:00Z",
        "lastInteraction": "2026-01-28T12:05:15Z",
        "messageCount": 1,
        "interactions": 1
      }
    }
    // ... up to 20 personas per user
  ]
}
```

**Commands**:
```bash
# Create Cosmos DB account
az cosmosdb create \
  -g broverse-rg \
  -n broverse-cosmos-$(date +%s) \
  --default-consistency-level Eventual \
  -l centralus

# Get connection string
az cosmosdb keys list \
  -g broverse-rg \
  -n <COSMOS_NAME> \
  --type connection-strings \
  --query "connectionStrings[0].connectionString"

# Store in App Service
az webapp config appsettings set \
  -g broverse-rg \
  -n broverse-api-20260127 \
  --settings COSMOS_CONNECTION_STRING="<CONNECTION_STRING>"
```

**Auto-Approve When**: Container created + sample document inserted successfully

---

#### Phase 4.4: Cosmos DB API Routes (1 hour)
**Description**: Implement backend routes for AI profile CRUD
**Location**: `backend/src/routes/ai-profiles.js` (new)

**Endpoints**:
1. **POST** `/ai-profiles` → Create user AI profile (auto-called on first signup)
2. **GET** `/ai-profiles/:userId` → Fetch user's full AI profile + all personas
3. **POST** `/ai-profiles/:userId/personas` → Add new persona (1 of 20)
4. **PUT** `/ai-profiles/:userId/personas/:personaId` → Update persona (memory, status)
5. **DELETE** `/ai-profiles/:userId/personas/:personaId` → Remove persona
6. **POST** `/ai-profiles/:userId/personas/:personaId/chat` → Send message to bot
7. **GET** `/ai-profiles/:userId/quota` → Check storage usage vs quota

**Key Implementation Details**:
- Use `@azure/cosmos` SDK for queries
- Validate persona count (max 20)
- Enforce storage quota before uploads
- TTL purging: Keep last 100 messages per persona (auto-cleanup old messages)
- Add retry logic for Cosmos transient errors (429)

**Auto-Approve When**: POST /ai-profiles/:userId/personas returns 201 + document stored

---

#### 🚦 Milestone 4 Auto-Approval Gate
**Condition**: All of the following must be true:
1. ✅ Storage account created + connection string in App Service
2. ✅ Upload endpoint tested + returns signed blob URL
3. ✅ Cosmos DB account + "broverse" database + "ai-profiles" container created
4. ✅ Sample AI profile document inserted and retrievable
5. ✅ All 7 API routes returning correct status codes

**Next Action**: When conditions met, reply with `@approval-milestone-4` and I will auto-advance to Milestone 5

---

### **Milestone 5: Bot Personality Containerization** (Phase 2)
**Goal**: Deploy 20 containerized AI bot instances with persistent personalities
**Estimated Duration**: 2-3 hours
**Cost Impact**: ~$100-150/month (Container Apps, auto-scaling)
**Auto-Approval Gate**: 5 sample bot instances deployed + responding to test messages

#### Phase 5.1: System Prompts Organization (15 min)
**Location**: Create `backend/ai-profiles/prompts/` directory structure
**Current Personalities** (from conversation history):
1. `dickdiggs.txt` - Cheerful, irreverent
2. `harbor.txt` - Thoughtful, introspective
3. `marvin.txt` - Philosophical, witty
4. `rocky-top.txt` - Energetic, motivational
5. `tim-buckley.txt` - Creative, artistic
6. `lacey.txt` - Empathetic, supportive
7. `rgan-stone.txt` - Technical, analytical
8-20. (Define remaining 13 personas based on character diversity)

**Tasks**:
- [ ] Review + finalize 20 system prompts
- [ ] Store in `backend/ai-profiles/prompts/` as `.txt` files
- [ ] Version control prompts (allow updates without redeployment)

---

#### Phase 5.2: Container Image Build (45 min)
**Description**: Create Dockerfile for bot service
**Location**: `backend/Dockerfile.bot`

**Design**:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Bot service that handles chat with specific personality
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/src ./src
COPY backend/ai-profiles ./ai-profiles

# Environment variables:
# - PERSONA_NAME (passed by orchestrator)
# - COSMOS_CONNECTION_STRING (from App Service)
# - OPENAI_API_KEY (from secrets)
# - BOT_PORT (default 3001)

EXPOSE 3001

CMD ["node", "src/bot-service.js"]
```

**Bot Service** (`backend/src/bot-service.js`):
- Reads `PERSONA_NAME` env var
- Loads corresponding system prompt from `ai-profiles/prompts/`
- Exposes POST `/chat` endpoint (receives message + userId + personaId)
- Calls OpenAI API with personality prompt
- Stores response in Cosmos DB (updates conversation history)
- Returns JSON response

---

#### Phase 5.3: Container Apps Deployment (1 hour)
**Description**: Deploy 5 sample bots to Container Apps (scalable to 20)
**Tasks**:
- [ ] Create Azure Container Registry (ACR) in broverse-rg
- [ ] Build + push Dockerfile to ACR (5 tagged images: bot-dickdiggs, bot-harbor, etc.)
- [ ] Create Container Apps environment in broverse-rg
- [ ] Deploy 5 container app instances:
  - Each with unique PERSONA_NAME
  - Ingress enabled (internal networking)
  - 0.5 CPU / 1 GB memory
  - Auto-scaling: min 1, max 3 (scales on CPU/memory)
  - Liveness probe: GET `/health`
  - Startup probe: Cosmos connection validation

**Commands**:
```bash
# Create ACR
az acr create -g broverse-rg -n brovverseacr$(date +%s) --sku Basic

# Build image
az acr build \
  -r <ACR_NAME> \
  -t bot:dickdiggs \
  -f backend/Dockerfile.bot \
  .

# Create Container Apps environment
az containerapp env create \
  -g broverse-rg \
  -n broverse-env \
  -l centralus

# Deploy bot instance
az containerapp create \
  -g broverse-rg \
  -n bot-dickdiggs \
  --environment broverse-env \
  --image <ACR_NAME>.azurecr.io/bot:dickdiggs \
  --env-vars PERSONA_NAME=dickdiggs COSMOS_CONNECTION_STRING="..." \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 1 \
  --max-replicas 3 \
  --ingress internal \
  --target-port 3001
```

---

#### 🚦 Milestone 5 Auto-Approval Gate
**Condition**: All of the following must be true:
1. ✅ 5 bot container instances deployed and healthy
2. ✅ POST `/chat` endpoint responds to test message from each bot
3. ✅ Conversation history stored in Cosmos DB
4. ✅ Bots can be scaled independently (scale to 2 replicas, verify traffic distribution)

---

### **Milestone 6: Frontend AI Profile UI** (Phase 3)
**Goal**: Build user interface for AI profile management
**Estimated Duration**: 2-3 hours
**Cost Impact**: None (frontend only)
**Auto-Approval Gate**: PersonaManager component renders + CRUD operations work

#### Phase 6.1: PersonaManager Component (1.5 hours)
**Location**: `frontend/src/components/PersonaManager/`

**Structure**:
```
PersonaManager/
├── PersonaManager.jsx          (main container)
├── PersonaList.jsx             (list view with persona cards)
├── PersonaChat.jsx             (chat interface for selected persona)
├── PersonaCreator.jsx          (modal to create new bot)
├── StorageQuotaMeter.jsx       (visual quota usage)
├── PersonaSettings.jsx         (edit/delete persona)
└── styles.css                  (TailwindCSS)
```

**Features**:
1. **Persona List**:
   - Show 20 persona slots (filled + empty)
   - Cards display: Avatar, name, last interaction, message count
   - Click to open chat or settings
2. **Chat Interface**:
   - Message history (scrollable)
   - Input field + send button
   - Real-time response (loading state)
   - Copy messages button
3. **Create Persona**:
   - Modal to select from 20 templates
   - Or upload custom system prompt
   - Confirm: POST `/ai-profiles/:userId/personas`
4. **Settings**:
   - Rename persona
   - Delete persona (with confirmation)
   - View metadata (created, last interaction, message count)
5. **Storage Meter**:
   - Circular progress bar: used / quota
   - Upgrade quota button (links to billing)
   - Show largest personas (by storage)

---

#### Phase 6.2: Integration with Board Sidebar (30 min)
**Location**: `frontend/src/components/Board/SocialBoard.jsx`

**Changes**:
- Add PersonaManager tab in sidebar (alongside Notifications + Challenges)
- Tab navigation at top of sidebar
- Active tab persists in localStorage
- Resize sidebar for persona chat (adjust grid layout)

---

#### Phase 6.3: Persona Avatar + Media Uploads (30 min)
**Location**: New `frontend/src/components/PersonaManager/PersonaUploadModal.jsx`

**Features**:
- Drag-drop zone for avatar image
- File type validation (PNG, JPG, WebP)
- Max size 10MB (enforced by upload endpoint)
- Crop tool (optional, use simple library)
- Upload → display signed blob URL as avatar

---

#### 🚦 Milestone 6 Auto-Approval Gate
**Condition**: All of the following must be true:
1. ✅ PersonaManager component renders without errors
2. ✅ Can create new persona via modal (POST returns 201)
3. ✅ Can chat with persona (message stored in Cosmos DB)
4. ✅ Can delete persona (DELETE returns 204)
5. ✅ Storage meter displays correctly

---

### **Milestone 7: Integration Testing + Hardening** (Phase 4)
**Goal**: E2E testing, performance tuning, security audit
**Estimated Duration**: 2-3 hours
**Cost Impact**: None
**Auto-Approval Gate**: All test suites pass + 99.5% uptime over 1 hour

#### Phase 7.1: API Integration Tests (1 hour)
**Location**: `backend/tests/e2e/`

**Test Suites**:
1. **Auth Flow**:
   - Register user → login → access protected routes
   - Token expiry + refresh
   - Session cleanup on 401
2. **Notifications**:
   - Post created → notification sent
   - Reaction → notification to post author
   - Comment → notification to post author
   - SSE stream broadcasts in real-time
3. **AI Profiles**:
   - Create profile → 20 empty persona slots
   - Add persona → conversation history initialized
   - Chat → message stored in Cosmos
   - Storage quota enforced
4. **Uploads**:
   - Upload file → signed URL returned
   - Access signed URL → file retrieved
   - Quota exceeded → upload rejected
5. **Bot Orchestration**:
   - Route chat to correct persona container
   - Failover if container unhealthy
   - Load balancing across replicas

**Tools**: Jest + Supertest

---

#### Phase 7.2: Frontend E2E Tests (45 min)
**Location**: `frontend/tests/e2e/`

**Test Suites**:
1. **Board Rendering**:
   - Posts load correctly
   - Comments/reactions update in real-time
   - SSE stream connects + receives notifications
2. **Auth Flow**:
   - Login → Board renders
   - Token expiry → redirect to login
   - Logout → session cleanup
3. **PersonaManager**:
   - Create persona → appears in list
   - Send chat message → response appears
   - Delete persona → removed from list
4. **Performance**:
   - Board loads in < 2s
   - Chat response latency < 3s
   - Notification update < 500ms

**Tools**: Playwright or Cypress

---

#### Phase 7.3: Load Testing (30 min)
**Tools**: K6 or Artillery

**Scenarios**:
1. Simulate 100 concurrent users posting + commenting
2. Simulate 50 users chatting with bots simultaneously
3. Simulate 10k notifications/hour broadcast rate
4. Measure API response times + error rates

**Success Criteria**:
- P95 latency < 500ms
- Error rate < 1%
- No 429 (rate limit) responses

---

#### Phase 7.4: Security Audit (30 min)
**Checklist**:
- [ ] JWT tokens have short expiry (15-30 min)
- [ ] Refresh tokens stored securely
- [ ] CORS allows only SWA domain
- [ ] All endpoints require auth (except /health + /auth/*)
- [ ] User can only access own data (userId validation)
- [ ] File uploads validated (MIME type, size)
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (React sanitizes by default)
- [ ] Secrets not hardcoded (env vars only)
- [ ] Azure Key Vault for sensitive data (optional, future)

---

#### 🚦 Milestone 7 Auto-Approval Gate
**Condition**: All of the following must be true:
1. ✅ All test suites pass (>95% coverage)
2. ✅ Load test: P95 latency < 500ms, error rate < 1%
3. ✅ Security checklist signed off
4. ✅ 99.5% uptime over 1-hour stress test

---

### **Milestone 8: Launch Preparation** (Phase 5)
**Goal**: Final cleanup, documentation, monitoring setup
**Estimated Duration**: 1-2 hours
**Cost Impact**: None
**Auto-Approval Gate**: Monitoring dashboard live + runbook complete

#### Phase 8.1: Monitoring + Alerting (45 min)
**Tools**: Azure Application Insights (already deployed)

**Metrics to Track**:
- API response time (P50, P95, P99)
- Error rate by endpoint
- Cosmos DB request units (RU/s usage)
- Storage blob size (quota tracking)
- Bot container health (replica count, CPU, memory)
- SSE connection count (concurrent users)

**Alerts** (notify via email):
- API error rate > 5%
- Response time P95 > 1000ms
- Storage quota approaching limit (>90%)
- Bot container unhealthy
- Cosmos DB throttled (429 responses)

---

#### Phase 8.2: Documentation (30 min)
**Files to Create**:
- `ARCHITECTURE.md` - System design overview
- `DEPLOYMENT.md` - How to deploy + rollback
- `RUNBOOK.md` - Troubleshooting + common tasks
- `API.md` - Full API reference (auto-generated from OpenAPI spec)
- `AI_PROMPTS.md` - Persona prompt documentation

---

#### Phase 8.3: Cost Optimization Review (15 min)
**Review**:
- [ ] Storage account: Lifecycle policy to archive old uploads after 90 days
- [ ] Cosmos DB: Review RU/s usage, adjust to actual demand
- [ ] Container Apps: Verify auto-scaling is working (not over-provisioned)
- [ ] App Service: Consider scale-down during off-peak hours (if needed)

---

#### 🚦 Milestone 8 Auto-Approval Gate
**Condition**: All of the following must be true:
1. ✅ Monitoring dashboard configured + metrics visible
2. ✅ Alerts tested (send test alert → verify email)
3. ✅ Runbook completed + shared
4. ✅ Team has access to all dashboards + runbooks

---

## 📊 High-Level Timeline

| Milestone | Phase | Duration | Status | Cost |
|-----------|-------|----------|--------|------|
| **4** | Infrastructure (Storage + Cosmos) | 3-4h | 🔴 Not Started | $50-75 |
| **5** | Bot Containerization | 2-3h | 🔴 Not Started | $100-150/mo |
| **6** | Frontend UI | 2-3h | 🔴 Not Started | $0 |
| **7** | Testing + Hardening | 2-3h | 🔴 Not Started | $0 |
| **8** | Launch Prep | 1-2h | 🔴 Not Started | $0 |
| **MVP Total** | | **10-15h** | 🟡 Ready to execute | **$150-225** |

---

## 🎯 Execution Strategy

### Phase 1: I'll Execute (You Approve at Gates)
1. **Phase 4.1-4.2**: Storage account + upload endpoints
   - I execute → test upload → request approval
2. **Phase 4.3-4.4**: Cosmos DB + AI profile routes
   - I execute → test CRUD → request approval

### Phase 2: You Signal Readiness, I Execute
3. **Phase 5.1-5.3**: Bot containerization
   - Requires you to review system prompts (5 min)
   - I build Dockerfile + deploy → test → request approval

### Phase 3: Parallel Execution
4. **Phase 6.1-6.3**: Frontend UI (I execute in parallel with your review)
5. **Phase 7.1-7.4**: Testing (I execute automatically)
6. **Phase 8.1-8.3**: Launch prep (I execute automatically)

---

## ⚠️ Cost Management

**To Avoid Spinning/Waiting**:
- All execution is async (no polling)
- I'll commit code and push to branch
- GitHub Actions automatically deploy
- You review + approve at gates (email notification)
- No manual polling = no wasted credits

**Cost Breakdown**:
- Storage account: $0.023/GB (uploads)
- Cosmos DB: $0.25/hour for 400 RU/s (can scale down to 100 RU/s after MVP)
- Container Apps: ~$0.05/vCPU-hour (20 bots × 0.5 CPU × variable load)
- **Estimated MVP Cost**: $2-3/day

**How to Reduce Costs**:
- Keep Container Apps at 0 replicas when not testing (manual scale)
- Use Cosmos DB on-demand mode instead of provisioned (after MVP)
- Delete test bot instances; keep only 3-5 active for demo

---

## 🚀 Let's Go!

**I'm ready to execute Milestone 4 immediately:**

1. Create Storage account + upload endpoints ✅
2. Create Cosmos DB + AI profile routes ✅
3. Deploy + test ✅
4. Request approval at gates ✅

**What I need from you**:
1. **Confirm you're ready** to start (just say "go")
2. **Review system prompts** when I request (5 min task)
3. **Approve at gates** (review test results + approve/reject)

**Estimated time until MVP**: 10-15 hours of execution (spread over 2-3 days with approvals)

**Your cost**: $150-225 total (spread over execution time)

---

## 📞 Communication Protocol

- **Status updates**: I'll post in terminal with clear markers:
  - 🟢 Complete
  - 🟡 In Progress
  - 🔴 Blocked (notify you immediately)
- **Approvals**: I'll create a clear `[REQUEST APPROVAL: Milestone X, Phase Y]` message
- **Notifications**: You requested no spinning; I'll notify you via comment if I'm blocked
- **Rollback**: Any failed deployment will auto-revert to last successful commit

