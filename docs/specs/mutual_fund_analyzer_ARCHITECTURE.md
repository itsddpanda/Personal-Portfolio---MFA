# Architecture: Privacy-First Mutual Fund Analyzer

**Date:** 2026-02-18
**Status:** Draft

## 1. Stack Strategy
- **Containerization:** Docker Compose (Single entry point `docker-compose up`).
- **Frontend:** Next.js 14 (App Router) - "Premium" UI, responsive, TypeScript.
- **Backend:** Python (FastAPI) - Required for `casparser` ecosystem.
- **Database:** SQLite (WAL mode) - Zero-config, single-file persistence, suitable for local/single-machine use.
- **ORM:** SQLModel (Pydantic + SQLAlchemy) - Ideal for FastAPI.

## 2. Component Diagram

```mermaid
graph TD
    User[User (Browser)] -->|HTTP/3000| FE[Frontend (Next.js)]
    FE -->|HTTP/8000| API[Backend (FastAPI)]
    
    subgraph "Docker Container"
        FE
        API
        DB[(SQLite File)]
        
        API -->|Read/Write| DB
        API -->|Parse| Lib[casparser (Python)]
    end
    
    subgraph "External Internet"
        API -->|GET JSON| MFAPI[mfapi.in (NAV Data)]
    end
```

## 3. Data Model (Relational)

### Core User Data (Private)
- **User**: `id` (UUID), `pan` (Encrypted/Hashed?), `name`, `created_at`
- **Portfolio**: `id`, `user_id`, `name` (e.g. "Main Portfolio")
- **Folio**: `id`, `portfolio_id`, `amc_id`, `folio_number`
- **Transaction**: 
    - `id` (Composite Hash: PAN+ISIN+Date+Amount+Type+Units)
    - `folio_id`
    - `scheme_id`
    - `date`, `type`, `amount`, `units`, `nav`
    - `trade_date` (for XIRR)

### Shared Data (Global Reference)
- **AMC**: `id`, `name` (e.g. "HDFC Mutual Fund")
- **Scheme**: 
    - `id`, `amc_id` (Foreign Key to AMC)
    - `isin` (Unique Key)
    - `amfi_code` (Link to mfapi.in)
    - `name`, `type` (Equity/Debt)
- **NavHistory**:
    - `scheme_id`, `date`, `nav`
    - *Source:* Imported from CAS (sparse) + Fetched from mfapi.in (dense).

## 4. API Interface (High Level)

### Portfolio Management
- `POST /api/upload-cas` 
    - Input: PDF File, Password
    - Logic: Parse -> Deduplicate -> Upsert schemes -> Upsert transactions.
    - Output: Import Summary (New Transactions, New Schemes).
- `GET /api/portfolios` -> List users/portfolios.
- `GET /api/portfolio/{id}/summary` -> Current Value, XIRR, Invested.

### Analysis
- `GET /api/portfolio/{id}/holdings` -> List of schemes with calculated returns.
- `GET /api/portfolio/{id}/analytics` -> XIRR, Asset Allocation.

### System
- `POST /api/sync-nav` -> Trigger fetch from mfapi.in for all active ISINs.
- `GET /api/health` -> System status.

## 5. Security & Privacy
- **PAN Storage:** Stored plain text? (Needed for CAS matching). *Decision:* Store as-is since DB is local and user-owned. No sophisticated encryption at rest required for V1 unless requested.
- **Network:** Container has no inbound access from internet (only outbound).

## 6. Key Workflows
1.  **Import:** 
    - Backend parses CAS.
    - If PAN not in DB -> Create User.
    - For each Txn -> Hash -> Check DB -> Insert if new.
    - **Synthetic Transaction:** If parsed scheme has `open > 0` units, generate an `OPENING_BALANCE` transaction with `amount=0`.
    - Updates `Scheme` table if ISIN is new.
2.  **Dashboard Load:**
    - Query DB for latest units.
    - Query `NavHistory` for latest NAV (or `mfapi.in` live fetch).
    - Calculate Current Value = `Units * Latest_NAV`.
    - Calculate XIRR using `py-xirr` (on full txn history).
