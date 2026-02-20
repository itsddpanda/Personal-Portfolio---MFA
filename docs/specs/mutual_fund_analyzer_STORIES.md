# Epics & User Stories: Mutual Fund Analyzer

## Epic 1: Core Infrastructure
**Goal:** Initialize the secure, local-first stack.
- **Story 1.1:** As a Developer, I want to set up a Docker Compose stack with FastAPI (Backend), Next.js (Frontend), and SQLite (Volume), so that the app runs with a single command.
    - AC1: `docker-compose up` starts both services.
    - AC2: Backend can read/write to the SQLite file in the volume.
    - AC3: Frontend can call Backend APIs via internal network (or proxy).
    - **Size:** M, **Priority:** Must Have

## Epic 2: CAS Processing
**Goal:** Ingest data from PDFs reliably.
- **Story 2.1:** As a User, I want to upload a password-protected CAS PDF, so that my data can be imported.
    - AC1: API endpoint accepts file + password.
    - AC2: Uses `casparser` to extract data.
    - AC3: Returns error if password is incorrect.
    - **Size:** M, **Priority:** Must Have
- **Story 2.2:** As a System, I want to deduplicate transactions using a composite key, so that re-uploading the same file doesn't create duplicates.
    - AC1: Generates hash (PAN+ISIN+Date+Amount+Type+Units) for each txn.
    - AC2: Skips insertion if hash exists in DB.
    - AC3: Returns count of "New Transactions" vs "Skipped".
    - **Size:** L, **Priority:** Must Have
- **Story 2.3:** As a System, I want to create synthetic opening balance transactions, so that schemes with no transaction history are still tracked.
    - AC1: Detects if `units.open > 0` in CAS.
    - AC2: Creates a transaction with type `OPENING_BALANCE` and `amount=0`.
    - AC3: Ensures scheme units sum up correctly in dashboards.
    - **Size:** M, **Priority:** Must Have

## Epic 3: Portfolio Management
**Goal:** Handle multi-user privacy and profiles.
- **Story 3.1:** As a "Household CFO", I want the system to auto-create a profile based on the PAN in the CAS, so that I don't have to manually register users.
    - AC1: If PAN is new -> Create User (Name from CAS).
    - AC2: If PAN exists -> Append transactions to existing user.
    - **Size:** S, **Priority:** Must Have
- **Story 3.2:** As a User, I want to receive a warning if I upload a CAS for a different person, so that I don't mix up portfolios.
    - AC1: Detects if CAS PAN != Current Active User PAN.
    - AC2: Prompts to switch profile or cancel.
    - **Size:** M, **Priority:** Should Have

## Epic 4: Market Data Sync
**Goal:** Get live values for the portfolio.
- **Story 4.1:** As a System, I want to fetch the latest NAVs from `mfapi.in` for my holdings, so that I can see current value.
    - AC1: Identifies unique ISINs in DB.
    - AC2: Fetches latest NAV from `mfapi.in`.
    - AC3: Updates `NavHistory` table.
    - AC4: Handles API failures gracefully (logs error, keeps old NAV).
    - **Size:** M, **Priority:** Must Have

## Epic 5: Analytics & Dashboard
**Goal:** Visualize performance.
- **Story 5.1:** As a User, I want to see my Total Portfolio Value and XIRR, so that I know how I'm performing.
    - AC1: Calculates Current Value (Units * Last NAV).
    - AC2: Calculates XIRR using full transaction history.
    - AC3: Displays "Total Invested", "Current Value", "Absolute Gain", "XIRR".
    - **Size:** L, **Priority:** Must Have
- **Story 5.2:** As a User, I want to see a list of all my holdings, so that I can drill down.
    - AC1: Table showing Scheme Name, Units, Avg NAV, Current NAV, P&L.
    - **Size:** M, **Priority:** Must Have

## Epic 6: Offline Capability
**Goal:** Graceful degradation.
- **Story 6.1:** As a User, I want to be notified if NAV Sync fails due to no internet, rather than seeing a crash.
    - AC1: UI shows "Offline Mode" or "Sync Failed" toast.
    - AC2: Dashboard continues to show values based on last known NAV.
    - **Size:** S, **Priority:** Should Have
