# Verified Constraints: CAS Parsing

**Investigated:** 2026-02-18
**Source:** [npm cas-parser](https://www.npmjs.com/package/cas-parser), [casparser (Python)](https://pypi.org/project/casparser/)

## Ground Truth

| Dimension | Verified Fact | Source |
|---|---|---|
| Data Source | Consolidated Account Statement (CAS) PDF | NSDL/CDSL/CAMS/KFintech |
| Auth | PDFs are password protected (PAN/DOB) | Cams/KFintech standard |
| Parsing Logic | **Python** library `casparser` is the robust, open-source local parser. | [GitHub: codereverser/casparser](https://github.com/codereverser/casparser) |
| JS Support | `cas-parser` npm package appears to be a wrapper for a REST API or paid service. | [npm packaging](https://www.npmjs.com/package/cas-parser) |
| Offline | Python library works 100% offline. JS library requires API key/internet. | Docs analysis |

## Assumption Diff

| # | What Was Assumed | What Is Actually True | Impact | Severity |
|---|---|---|---|---|
| 1 | `npm install cas-parser` (JS/Node) | JS version connects to API (Privacy risk) or is less mature | Backend must be Python-based | 🔴 High |
| 2 | Pure Client-Side Parsing | PDF parsing of encrypted files is complex in browser | Docker container needs Backend (Python) | 🟠 Medium |
| 3 | Single User | "Household CFO" implies multi-portfolio support | Need "Profile/Group" concept in DB | 🟡 Low |

## Scope Impact Summary
To maintain the "Offline/Privacy-Conscious" requirement, we **cannot** use the `npm cas-parser` directly in a Node.js backend if it relies on an external API.
**Decision:** We must build the backend using **Python (FastAPI/Flask)** to utilize the native `casparser` library. The Frontend can still be React/Next.js. The Docker container will manage both.

## Open Questions
- Does `casparser` (Python) extract *all* transactions or just the summary? (Usually summary + current holdings).
- Need to verify if XIRR calculation logic is included or needs to be custom-built.
