# Mutual Fund Analyzer — Product Requirements Document

**Version:** 1.0
**Date:** 2026-02-18
**Status:** Approved for Implementation

## 1. Executive Summary
A privacy-first, offline-capable web application for Indian investors to track and analyze their mutual fund portfolios. It parses Consolidated Account Statements (CAS) locally, manages multi-user portfolios using a unique PAN-based identity system, and provides deep insights (XIRR, CAGR) without sending sensitive data to external servers.

### Personas
- **The Privacy-Conscious Investor:** Zero tolerance for uploading financial data to cloud/third-party servers.
- **The Household CFO:** Manages portfolios for self, spouse, and parents on a single device, requiring clean separation of data.

## 2. Verified Constraints & Technical Discovery
| Dimension | Constraint | Source |
|---|---|---|
| **CAS Parsing** | Must use **Python `casparser`** library. JS alternatives are immature or API-dependent. | Technical Discovery |
| **Data Privacy** | No PDF or transaction data leaves the local Docker container. | User Requirement |
| **Market Data** | **`mfapi.in`** (free, open JSON API) used for fetching current NAVs by ISIN. | Technical Discovery |
| **Persistence** | **SQLite** (local file) volume mounted in Docker. No external DB required. | Technical Discovery |
| **Offline** | App must function 100% offline for viewing data. Sync is an optional enhancement. | User Requirement |

## 3. Hardened Requirements & Edge Cases
| Scenario | Handling Strategy |
|---|---|
| **Invalid Password** | immediate error return from parser; no lockout. |
| **PAN Mismatch** | If loaded CAS PAN != Active User PAN -> Prompt to switch profile or create new user. |
| **Gap in Data** | If Transaction Cost is missing -> Use CAS-provided "Total Cost" for summary. |
| **API Failure** | If `mfapi.in` is down/offline -> Show last known NAV + "Stale Data" warning. |
| **Deduplication** | **Strict Composite Key:** Hash(PAN + ISIN + Date + Amount + Type + Units). Ignore duplicates. |
| **Opening Balance** | If a scheme has `units.open > 0` but no transactions, a synthetic **OPENING_BALANCE** transaction is created at the start of the period. |

## 4. Architecture & Stack
**Rationale:** chosen for local-first robustness and Python ecosystem access.
- **Docker Compose:** Orchestrates the stack.
- **Backend:** Python (FastAPI) key for `casparser` integration.
- **Frontend:** Next.js 14 (React) for responsive, rich UI.
- **Database:** SQLite (WAL Mode) for simple, file-based persistence.

### Data Model (ERD Simplified)
- `User` (id, name, pan)
- `Portfolio` (id, user_id)
- `Scheme` (isin, name, amfi_code, amc_id - Shared Reference)
- `Transaction` (id=Hash, date, units, amount, nav, type="OPENING_BALANCE" for synthetic)
- `NavHistory` (isin, date, nav)

## 5. API Reference (Core)
- `POST /api/upload`: Accepts CAS PDF + Password.
- `GET /api/portfolio/{id}`: Returns summary & holdings.
- `POST /api/sync`: Triggers NAV fetch for all ISINs.

## 6. Epics & User Stories
### Epic 1: Core Infrastructure
- **1.1:** [Done] Setup Docker Compose (FastAPI + Next.js + SQLite). `Priority: Must Have`

### Epic 2: CAS Processing
- **2.1:** [Done] Upload & Parse CAS PDF (Password protected). `Priority: Must Have`
- **2.2:** [Done] Transaction Deduplication via Composite Key. `Priority: Must Have`

### Epic 3: Portfolio Management
- **3.1:** [Done] Auto-create User Profile from PAN in CAS. `Priority: Must Have`
- **3.2:** [Done] Profile Warning on PAN Mismatch. `Priority: Should Have`

### Epic 4: Market Data Sync
- **4.1:** [Done] Fetch Live NAVs from `mfapi.in`. `Priority: Must Have`

### Epic 5: Analytics
- **5.1:** [Done] Dashboard with Total Value & XIRR (using `py-xirr`). `Priority: Must Have`
- **5.2:** [Done] Holdings Table with filtering. `Priority: Should Have`

### Epic 6: Offline Capability
- **6.1:** [Done] Local `casparser` processing (Docker container). `Priority: Must Have`
- **6.2:** [Done] Graceful failure when offline (no NAV sync). `Priority: Should Have`

### Epic 7: Frontend Interface (Next.js)
- **7.1:** [Done] Upload Page (Drag & Drop, Password). `Priority: Must Have`
- **7.2:** [Done] Dashboard View (KPI Cards). `Priority: Must Have`

---

## Changelog
| Date | Changed by | What changed | Reason |
|---|---|---|---|
| 2026-02-18 | Agent | Initial V1.0 Creation | Project Kickoff |
