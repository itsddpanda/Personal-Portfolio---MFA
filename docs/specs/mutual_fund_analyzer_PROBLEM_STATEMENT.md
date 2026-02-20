# Problem Statement: Privacy-First Mutual Fund Analyzer

**Date:** 2026-02-18

## Problem Summary
Indian mutual fund investors struggle to track their consolidated portfolio performance (XIRR/CAGR) across different brokers and fund houses. Existing solutions either fragment data (broker apps) or compromise privacy (aggregators reading email/SMS). Parsing Consolidated Account Statements (CAS) centrally is the only standard way to get a unified view, but no privacy-focused, lightweight web tool exists for this.

## Personas Affected
- **The Privacy-Conscious Investor:** Manages their own portfolio. Refuses to upload financial PDFs to any server. Demands a tool that works entirely offline/locally after loading.
- **The Household CFO:** Tracks portfolios for multiple family members (Self, Spouse, Parents) on a single laptop. Needs separate totals for each person while maintaining a unified dashboard access.

## Current State
- **Broker Apps (Zerodha, Groww):** Only show data for funds bought through them.
- **Aggregators (INDmoney, styling):** Require email read access or SMS parsing, creating privacy risks.
- **Spreadsheets:** Manual, error-prone, and hard to update with live NAVs.

## Success Criteria
1.  **Strict Privacy:** No data leaves the user's machine (except strictly for fetching NAVs). The app must be self-hostable via Docker.
2.  **Universal Import:** Parses standard CAMS/KFintech CAS PDFs.
3.  **Deep Analysis:** Calculates XIRR and CAGR based on full transaction history, not just current holdings.
4.  **Multi-User Workflow:** seamlessly manages distinct portfolios (PAN-based isolation) in a local database.
5.  **Offline Capability:** Works without internet, except for optional "Sync NAV" actions.

## Verified Constraints (from Technical Discovery)
- **Backend:** Must be **Python** (FastAPI/Flask) to use the robust `casparser` library (JS alternatives are API-wrappers or immature).
- **Frontend:** React/Next.js for the "premium" UI experience.
- **Data Source (NAV):** `mfapi.in` (Open, free JSON API) for fetching current asset values.
- **Persistence:** Local SQLite database mounted via Docker volume.

## Research Findings
- **CAS Parsing:** `casparser` (Python) is the industry standard for local parsing.
- **Offline/Local:** Fully feasible with a Docker container stack (Python API + SQLite + React Static/SSR).

## Edge Case Strategy: PAN Mismatch
**Scenario:** User logs in/selects "User A", but uploads a CAS belonging to "User B".
**Handling:**
1.  Parser extracts PAN from PDF.
2.  App checks DB for extracted PAN.
3.  **If PAN matches current user:** Proceed with import.
4.  **If PAN matches another existing user:** Prompt: *"This CAS belongs to [User B]. Switch to their profile to import?"*
5.  **If PAN is new:** Prompt: *"New portfolio detected for [Name in CAS]. Create a new profile?"*
    - **Outcome:** Prevents accidental data merging.

## Deduplication Strategy
**Problem:** User imports overlapping CAS files (e.g., Monthly CAS then Quarterly CAS, or re-uploads same file).
**Solution:** Transaction-Level Deduplication using a Composite Key.
- **Composite Key:** `PAN` + `Scheme ISIN` + `Date` + `Amount` + `Transaction Type` + `Units`
- **Logic:**
    1.  Parse incoming CAS -> Extract all transactions.
    2.  Generate Composite Key hash for each transaction.
    3.  Compare with existing DB records.
    4.  **Insert:** Only if Key does not exist.
    5.  **Ignore:** If Key exists (Duplicate).
    - **Outcome:** Safe to re-upload any file any number of times. System is idempotent.

## Recommended Next Step
[ ] Proceed to `/1-design-new-feature` to design the Dockerized Python-React Stack.
