# BroVerse Organize → Merge → Deploy Plan

**Generated:** January 29, 2026  
**Status:** Auto-approved execution plan with milestones  
**Goal:** Organize repo and related folders, fix disarray from prior AI assistance, pull/merge correctly, then deploy.

### Execution log

| Milestone | Status | Notes |
|-----------|--------|--------|
| **O1** Restore corrupted docs | Done | `EXECUTION_STATUS.md` and `MILESTONE_4_PHASE_PROGRESS.md` rewritten cleanly. |
| **O2** Workflow cleanup | Done | Kept `azure-static-web-apps-proud-flower-03eff4810.yml` only; removed `azure-static-web-apps-broverse.yml`. |
| **O3** Repo hygiene | Partial | Root `settings.json` ignored via `.gitignore`. `.github/extensions.json` left untracked (add + commit if you use it). |
| **O4** Git pull & merge | Blocked | SSH fetch failed; fix SSH then run fetch/pull. |
| **O5** Deploy | Pending | After O4. |
| **O6** Worktree / Bro-Verse-building | Optional | When convenient. |

---

## 1. What I See

### 1.1 Primary Repo: `Bro-Verse-BuildSoul`

**Location:** `/Users/house/Documents/GitHub/Bro-Verse-BuildSoul`  
**Git:** `origin` → `git@github.com:Sentinel-Stratos-Strategies/Bro-Verse-BuildSoul.git`  
**Branch:** `main` @ `c6d4457` (Trigger frontend rebuild and deploy)

**Plans & docs present:**
- `MILESTONE_PLAN.md` — Canonical 5-phase plan (M4–M8). M4 = Storage + Cosmos + AI profiles infra; M5 = Bot containerization; M6 = PersonaManager UI; M7 = Testing; M8 = Launch prep.
- `PROJECT_EXECUTION_GUIDE.md` — Terminal ref, structure, quick start.
- `RECONNECTION_SUMMARY.md` — Health check, auth, what’s next.
- `QUICK_REFERENCE.md` — Status at a glance, “go” signal.
- `MILESTONE_4_APPROVAL.md` — M4 gate signed off.
- `MILESTONE_5_PHASES_1_2_APPROVAL.md` — M5.1–5.2 signed off; M5.3 (deploy bots) awaiting OpenAI API key.
- `DEPLOYMENT.md` — Azure SWA + alternatives.
- `TECH_SPEC.md`, `README.md`, `SECURITY.md`, etc.

**Progress vs plan:**
- **M3:** ✅ Done — Board, auth, challenges, notifications, SSE, custom domain.
- **M4:** ✅ Done — Storage account, Cosmos DB, upload service, upload routes, media migration, `ai-profiles` routes, `cosmosService`, `storageService`. All in git history (e.g. `45bd5de`, `b96b7cd`, …).
- **M5.1–5.2:** ✅ Done — 20 persona prompts in `backend/ai-personas/`, `bot-service.js`, `Dockerfile.bot`, `deploy-bots.sh`, `BOT_DEPLOYMENT.md`, chat routing to bots.
- **M5.3:** ⏸️ Not done — Bot containers not deployed to Azure Container Apps (blocked on OpenAI key + running `deploy-bots.sh`).
- **M6–M8:** 🔴 Not started.

**Backend:** Express API, Prisma + PostgreSQL, `/uploads`, `/ai-profiles`, `/posts`, `/auth`, `/challenges`, `/notifications`. Media fields on `Post`.  
**Frontend:** React + Vite, Board, BroCalls, CharacterChat, UserProfile, etc.  
**Workflows:**  
- `azure-static-web-apps-proud-flower-03eff4810.yml` — Canonical SWA deploy (Azure-generated; matches remote).  
- `azure-webapp-api.yml` — API deploy on `backend/**`.  
- ~~`azure-static-web-apps-broverse.yml`~~ — Removed in O2; file deleted, no longer on disk.

### 1.2 Related Folders

| Folder | Purpose | Relationship to main |
|--------|---------|----------------------|
| `Bro-Verse-BuildSoul.worktrees/copilot-worktree-2026-01-28T05-32-12` | Git worktree | Older `main` @ `d713bb8`. No M4/M5 code (no uploads, ai-profiles, cosmos, storage). Has staged `ai profiles/` etc. from old session. |
| `Bro-Verse-building` | Misc assets | `.gitattributes` + “Attached HTML and CSS Context” (Azure 404 + Bootstrap CSS). **Not** the main app. |

**Conclusion:** Main repo is source of truth. Worktree is stale. `Bro-Verse-building` is unrelated.

### 1.3 Git State (main repo)

*Reflects state after O1–O3. `azure-static-web-apps-broverse.yml` was removed in O2 and no longer exists on disk.*

- **Remotes:** `origin` (GitHub), `azure` (Azure DevOps).
- **Uncommitted:**
  - Modified: none (workflow reverted to match remote).
  - Untracked: `.github/extensions.json` only. `settings.json` (root) is gitignored.
- **Fetch:** `git fetch origin` failed with “Permission denied (publickey)” — SSH key not available in environment used for fetch.

---

## 2. What’s Out of Place / Corrupted

### 2.1 Corrupted docs (bad AI assistance)

- **`EXECUTION_STATUS.md`** — Heavy duplication, garbled fragments (“Fe**Fe**Fe…”, “Phase 4.2#### Phase 4.2…”, repeated blocks). Unusable as-is.
- **`MILESTONE_4_PHASE_PROGRESS.md`** — Similar corruption (repeated “#### Phase…”, “### Next Steps…”, “``````V d`” etc.). Unusable as-is.

### 2.2 Workflow disarray (resolved in O2)

- **Before O2:** Two SWA workflows existed — `proud-flower` (Azure-generated) and `broverse` (custom, untracked). `broverse` reused the same workflow `name` as `proud-flower`, which could cause duplicate/conflicting runs.
- **After O2:** `azure-static-web-apps-broverse.yml` was **deleted**; it no longer exists on disk. Only `azure-static-web-apps-proud-flower-03eff4810.yml` remains as the canonical SWA workflow.

### 2.3 Other

- **`settings.json`** in repo root — Editor/format/git settings. Usually belong in `.vscode/settings.json` or user settings, not repo root. Risk of overwriting others’ settings.
- **`Bro-Verse-BuildSoul.code-workspace`** vs **`Bro-Verse-BuildSoull.code-workspace`** (typo) in parent `GitHub/` — Minor; worth fixing if you use workspaces.

---

## 3. Auto-Approved Milestones (Execution Order)

Execute in this order. Each milestone is auto-approved upon completion of its checklist.

---

### Milestone O1: Restore Corrupted Docs

**Goal:** Replace corrupted content with clean, accurate summaries.

**Tasks:**
1. Rewrite **`EXECUTION_STATUS.md`** from scratch:
   - Current status: M3 done, M4 done, M5.1–5.2 done, M5.3 pending.
   - Key commits (e.g. `45bd5de`, `6b250b5`, `c6d4457`).
   - Infrastructure table (SWA, API, PG, Storage, Cosmos, etc.).
   - Next steps: M5.3 (deploy bots) then M6–M8.
2. Rewrite **`MILESTONE_4_PHASE_PROGRESS.md`**:
   - Phase 4.1–4.4 complete; pointer to `MILESTONE_4_APPROVAL.md` for gate details.
   - Short “Next: M5.3” section.

**Gate:** Both files readable, no duplicated/garbled blocks.

---

### Milestone O2: Workflow Cleanup

**Goal:** Single clear SWA workflow, no duplicate names or redundant files.

**Tasks:**
1. Decide canonical SWA workflow:
   - **Option A:** Keep **`azure-static-web-apps-proud-flower-03eff4810.yml`** only (matches Azure SWA resource). Delete `azure-static-web-apps-broverse.yml`. Apply any desired path filters or App Insights config from `broverse` into `proud-flower`, then commit.
   - **Option B:** Keep **`azure-static-web-apps-broverse.yml`** only. Rename workflow `name` to something unique (e.g. `BroVerse SWA Frontend`). Configure it for your SWA (token, app/output locations). Remove or rename the `proud-flower` file so only one SWA workflow runs on `main`.
2. Ensure **`azure-webapp-api.yml`** unchanged for API deploys.
3. Commit workflow changes.

**Gate:** One SWA workflow runs on push to `main`; no duplicate `name`; API workflow still deploys `backend/**`.

---

### Milestone O3: Repo Hygiene

**Goal:** No stray or misleading files in the repo.

**Tasks:**
1. **`settings.json`** (root):  
   - Either move project-specific bits into `.vscode/settings.json` and drop root `settings.json`,  
   - Or add `settings.json` to `.gitignore` if it’s user-local.  
   Do **not** commit editor-specific settings as project default unless intended.
2. **`.github/extensions.json`**:  
   - If you use it for recommended VS Code extensions, add and commit.  
   - If not, remove or ignore.
3. **Workspace typo:** Rename `Bro-Verse-BuildSoull.code-workspace` → `Bro-Verse-BuildSoul.code-workspace` in `GitHub/` if that duplicate exists and you care.

**Gate:** No orphan root `settings.json` committed as project config (unless you explicitly want it); extensions.json intentional or removed.

---

### Milestone O4: Git Pull & Merge

**Goal:** Main repo up to date with remote, local changes merged correctly.

**Prerequisites:**
- SSH access to GitHub working (`git fetch origin` succeeds). Fix SSH key / agent if needed.

**Tasks:**
1. `git fetch origin` (and `azure` if you use it).
2. `git status` — resolve any uncommitted changes (either commit O1–O3 first or stash).
3. `git pull origin main` (or `git pull --rebase origin main` if you prefer). Resolve conflicts if any.
4. Ensure `main` is clean and matches your intended layout (workflows, docs, no stray files).

**Gate:** `main` up to date with remote, no conflict markers, history consistent.

---

### Milestone O5: Deploy

**Goal:** Frontend and API deployed and verified.

**Tasks:**
1. Push `main` to `origin` (if not already). Ensure GitHub Actions run for SWA and API workflows.
2. Verify SWA deploy: site at custom domain (e.g. `https://broverse.sentinelstratosstrategies.com`) loads.
3. Verify API deploy: `GET /health` on `https://broverse-api-20260127.azurewebsites.net` returns OK.
4. Optional: run a minimal smoke test (e.g. fetch posts or auth) if you have tokens/creds.

**Gate:** Frontend and API live; no broken workflows.

---

### Milestone O6: Worktree & “Bro-Verse-building” (Optional)

**Goal:** Avoid confusion from stale or unrelated folders.

**Tasks:**
1. **Worktree** `copilot-worktree-2026-01-28T05-32-12`:  
   - Either update it to current `main` (e.g. `git pull` in worktree, reset to `main`), or  
   - Remove it (`git worktree remove ...`) if no longer needed.
2. **`Bro-Verse-building`**:  
   - Leave as-is if you use it for reference.  
   - Otherwise archive or delete so it’s clear it’s not part of the main app.

**Gate:** No confusion between main app and worktree / building folder.

---

## 4. Summary Table

| Milestone | Purpose | Gate |
|-----------|---------|------|
| **O1** | Fix corrupted `EXECUTION_STATUS.md`, `MILESTONE_4_PHASE_PROGRESS.md` | Clean, readable docs |
| **O2** | Single canonical SWA workflow, no duplicate names | One SWA workflow, API workflow OK |
| **O3** | Repo hygiene (`settings.json`, `extensions.json`, workspace typo) | No stray/misleading commits |
| **O4** | Pull & merge with `origin` (after SSH fixed) | `main` up to date, no conflicts |
| **O5** | Deploy frontend + API via Actions | SWA + API live |
| **O6** | Worktree + `Bro-Verse-building` (optional) | Clear separation of main vs rest |

---

## 5. Suggested Order of Execution

1. **O1** — Restore corrupted docs (no git fetch required).  
2. **O2** — Workflow cleanup; commit.  
3. **O3** — Repo hygiene; commit.  
4. **O4** — Fix SSH, then fetch, pull, merge.  
5. **O5** — Push, run Actions, verify deploy.  
6. **O6** — Adjust worktree / Bro-Verse-building as needed.

---

## 6. Pre-requisites Before O4 & O5

- **SSH:** Ensure `git fetch origin` works. Configure SSH key for `git@github.com` (or use HTTPS with credential helper).  
- **GitHub Actions:** Secrets present for SWA (`AZURE_STATIC_WEB_APPS_API_TOKEN`, etc.) and API (`AZURE_WEBAPP_PUBLISH_PROFILE`).  
- **Azure:** SWA and App Service resources exist and match workflow config (names, regions).

---

## 7. After This Plan

- **M5.3:** When ready, add OpenAI API key, run `deploy-bots.sh`, wire env vars, then deploy bot containers.  
- **M6–M8:** Follow `MILESTONE_PLAN.md` (PersonaManager UI → testing → launch prep).

---

**You can run O1–O3 immediately.** O4–O5 depend on SSH and secrets. O6 is optional cleanup.  
Once you confirm SSH and remotes are good, we can proceed through O4 → O5 step by step.
