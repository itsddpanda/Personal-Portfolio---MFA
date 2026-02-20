# Project Improvement Tasks (Portfolio Analytics MVP)

Based on the code audit, here is the roadmap for hardening and improving the application.

## 🟠 High Priority (Reliability & Performance)

- [x] **Task 1: Fix Sync UX Race Condition** <!-- id: 1 -->
  - Refactor backend sync endpoint to return the updated summary.
  - Update frontend dashboard to `await` this data and remove the 2s `setTimeout`.
- [x] **Task 2: Harden CAS Upload Memory** <!-- id: 2 -->
  - Add file size validation (e.g., 10MB limit) in `backend/app/api/cas.py` to prevent OOM crashes.
- [x] **Task 3: Optimize Analytics Queries** <!-- id: 3 -->
  - Replace full transaction loading with SQL `SUM` and `GROUP BY` for calculating units.
  - Only fetch transactions when required for XIRR calculation.

## 🔵 Quality & UX Improvements

- [x] **Task 4: Implement FIFO Cost Basis** <!-- id: 4 -->
  - Refactor analytics logic to use First-In-First-Out (FIFO) for accurate "Invested Value" after partial redemptions.
- [x] **Task 5: Refactor Persistence Logic** <!-- id: 5 -->
  - Extract database saving logic from `cas.py` into a dedicated service layer (`cas_service.py`).
- [x] **Task 6: Add UI Error Notifications** <!-- id: 6 -->
  - Implement toast/banner notifications for upload failures, incorrect passwords, or sync errors.

## 🟢 Maintenance & Refactoring

- [x] **Task 7: Eliminate Code Duplication** <!-- id: 7 -->
  - `cas_service.py` re-implements `Transaction.generate_id` logic. Refactor to use the static method from `models.py`.
- [x] **Task 8: AMC & Scheme Normalization** <!-- id: 8 -->
  - `cas_service.py` now extracts AMC names and links Schemes to `AMC` records.
- [x] **Task 9: Improve Test Coverage** <!-- id: 9 -->
  - Add unit tests for `analytics.py` (XIRR) and `nav.py` (Sync).
  - Currently only `cas_service` is tested.
- [x] **Task 10: Centralize Configuration** <!-- id: 10 -->
  - Move hardcoded DB path (`/data/mfa.db`) and CORS settings to Environment Variables (`.env`).
  - Ensure backend runs locally without Docker.

---

*Note: N+1 Database Transations are currently out of scope.*
