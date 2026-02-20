# External DB Access — Product Requirements Document

## 1. Executive Summary & Personas
**Goal:** Expose the internal SQLite database (`mfa.db`) to the host machine to allow the developer to run SQL queries using local tools (e.g., `sqlite3`, DBeaver) without entering the Docker container.

**Persona:**
- **Developer:** Wants to debug data issues quickly using familiar host-based tools.

## 2. Verified Constraints
- **Database Type:** SQLite (file-based).
- **Docker Environment:** `docker-compose`.
- **Concurrency:** SQLite supports one writer at a time. Accessing the DB from the host while the app is writing may cause `database is locked` errors. This is acceptable for debugging purposes.

## 3. Hardened Edge Cases
- **Scenario A: Concurrent Write Access**
    - *Description:* Developer runs an `UPDATE` query from host while Backend is writing.
    - *Handling Strategy:* Accept risk of `database is locked`. Developer is advised to avoid heavy writes during app operation.
- **Scenario B: File Permissions**
    - *Description:* Docker container runs as root/user, creating files that host user cannot edit.
    - *Handling Strategy:* Bind mount permissions usually map to the user launching docker-compose. If issues arise, user can `chown` the file.

## 4. Architecture & Stack
- **Change:** Switch from Docker Named Volume (`mfa-data`) to **Bind Mount** (`./data`).
- **Path Mapping:**
    - Host: `./data/mfa.db`
    - Container: `/data/mfa.db`
- **Data Persistence:** Data will now reside in the local project directory instead of Docker's internal storage area.

## 5. Epics & User Stories

### Epic 1: Infrastructure Configuration

#### Story 1.1: Configure Docker Bind Mount
**As a** Developer, **I want** the database to be stored in a local `./data` folder, **so that** I can access the `mfa.db` file directly from my terminal or IDE.

**Acceptance Criteria:**
- [ ] `docker-compose.yml` is updated to mount `./data:/data`.
- [ ] `./backend/app/main.py` (or env var) points to `/data/mfa.db` (unchanged, just verifying path).
- [ ] Starting docker-compose creates a `./data` directory on the host.
- [ ] `mfa.db` is visible and queryable from the host using `sqlite3`.

---

## Changelog
| Date | Changed by | What changed | Reason |
|---|---|---|---|
| 2026-02-19 | Antigravity | Initial PRD created | User request for external DB access |
