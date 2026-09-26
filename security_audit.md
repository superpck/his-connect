# Security Audit — Fixes Applied

**Date:** 2026-09-26
**Scope:** This file records only the vulnerabilities that were found **and fixed** in this pass. It replaces the previous full audit report.

---

## 1. SQL Injection via unparameterized `db.raw()` (Critical) — Partially Fixed

**Category:** A03:2021 – Injection

`getAdmission(columnName, searchNo)` in several `his_*.ts` model files built SQL by directly interpolating the attacker-controlled `columnName` and `searchNo` (sourced from `req.body.typeSearch`/`req.body.textSearch` via `src/routes/his/index.ts`, `src/routes/refer/v3.ts`) into raw SQL strings, e.g.:
```ts
const sql = `select * from nrefer_admission where ${columnName}="${searchNo}" and hospcode="${hospCode}"`;
await db.raw(sql);
```

**Fixed in:**
- `src/models/his/his_nemo.ts`
- `src/models/his/his_md.ts`
- `src/models/his/his_mkhospital.ts`
- `src/models/his/his_thiades.ts`
- `src/models/his/his_hosxppcu.ts`
- `src/models/his/thairefer.ts`
- `src/models/his/his_emrsoft.ts`

**Fix applied:** Each function now allow-lists `columnName` to the known-safe mapped values (throws `Invalid columnName` otherwise) and uses Knex's `??` (identifier) / `?` (value) bindings instead of string interpolation, e.g.:
```ts
const allowedColumns = ['i.an', 'i.hn', 'q.vn'];
if (allowedColumns.indexOf(columnName) < 0) throw new Error('Invalid columnName');
const sql = `select ... where ?? = ?`;
await db.raw(sql, [columnName, searchNo]);
```
Verified via Knex SQL generation that identifiers are backtick-quoted and values are parameterized, neutralizing injection payloads.

**Not yet fixed (remaining scope for a follow-up pass):** other raw-SQL functions (`getDiagnosisIpd`, `getPerson`, `getService`, etc.) across `his_haos.ts`, `his_hosxpv3.ts` (dead code only), `his_ihospital.ts` (already safe via query builder), `his_mypcu.ts`, `his_pmk.ts`, `pcc-model.ts`, and others still interpolate raw values in some functions — see git history/commit for the prior full audit if a complete file list is needed.

---

## 2. OS Command Injection via `PM2_NAME` (Critical) — Fixed

**Category:** A03:2021 – Injection (OS Command Injection)

`POST /save-config/:requestKey` forwarded `body.api.PM2_NAME` unsanitized into a shell command string executed via `shelljs.exec()`:
```ts
const shellExecute1 = `pm2 scale ${pm2Name} ${pm2Instance}`;
await shell.exec(shellExecute1, ...);
```

**Fixed in:**
- `src/routes/index.ts` (`reloadPM2()`)
- `src/routes/setup.ts` — **file removed entirely** (see item 3)

**Fix applied:**
1. Added strict allow-list validation: `pm2Name` must match `^[\w-]{1,64}$` or be empty, otherwise the request is rejected.
2. Replaced shell-string execution with `child_process.execFile('pm2', [...])`, which passes arguments as an array with no shell interpretation, eliminating the injection vector entirely.

---

## 3. Dead code removed

- **`src/routes/setup.ts`** — deleted. This route was already unregistered (commented out in `src/route.ts`) and contained multiple unrelated issues (global unkeyed session, credentials via `GET` query string, no CSRF protection) that are now moot since the code is unreachable and removed.
- **`templates/pages/{index,about,login,setup}.ejs`** and **`templates/includes/{header,footer,head}.ejs`** — deleted; these were only rendered by the removed `setup.ts` route.
- **`app/routes/qdrugstore/`** (compiled build artifact) — deleted; the corresponding `src/routes/qdrugstore` was already absent and its route registration was commented out in `src/route.ts`.

---

## Verification

- `npx tsc --noEmit` — passes with no errors after all changes.
- `npm run test:security` — all SQL-injection- and auth-related regression tests pass. (3 unrelated pre-existing failures reference a missing `src/routes/isonline/user` module from separate, unrelated work in progress and are not caused by these changes.)
- Manually verified Knex `??`/`?` binding correctly escapes injection payloads (e.g. `1' OR '1'='1`) in both the identifier and value positions.

---

## 4. Reliability/correctness fixes (2026-09-26, second pass)

Not security vulnerabilities per se, but real bugs found during a follow-up review, all fixed:

- **`src/nodecron.ts` — PM2 leader-election fail-open bug.** If `pm2 jlist` failed, every PM2 cluster worker defaulted to treating itself as the "first process" (leader), causing scheduled jobs (nRefer/IS-Online auto-send, alive/alert, ward/bed updates) to run redundantly on every worker. Fixed: `getPM2Processes()` now returns `null` on failure (distinct from an empty list), and `updateProcessState()` fails **closed** (`isFirstProcess = false`) when running under real PM2 (`process.env.pm_id` set) but discovery fails, while still safely defaulting to "first process" for non-PM2 dev runs (`nodemon`/`ts-node` directly).
- **`src/nodecron.ts` — fire-and-forget cron tasks.** `mophAppointment.process()`/`mophIot.processIoT()` were called with `.then()` only; a rejection would be an unhandled rejection and permanently leave the job's `onProcess.*` flag `true` (job silently disabled forever). Fixed with `.catch()` + `.finally()`.
- **`src/nodecron.ts` — `NaN` schedule minutes silently disabled jobs.** `parseInt(process.env[...])` could return `NaN`, which isn't caught by the `<= 0` disable check, so `autosend` stayed `true` while the modulo-based schedule check (`x % NaN`) never fired. Fixed: `Number.isNaN()` guard defaults to `0`.
- **`src/nodecron.ts` — no shutdown cleanup for cron timers.** The startup `setTimeout` and `cron.schedule()` task weren't retained/cleared, risking duplicate timers on hot-reload/re-registration. Fixed: handles are retained and cleared/stopped via `fastify.addHook('onClose', ...)`.
- **`src/app.ts` — DB connection not awaited before `listen()`.** `connectDB()` was fire-and-forget while `app.listen()` started immediately after, so the server could start accepting traffic before DB connectivity was verified. Fixed: server startup now `await`s `connectDB()` first. Also split into independent `connectHIS()`/`connectISOnline()` so a misconfigured/unused ISONLINE DB doesn't prevent the (usually required) HIS DB from being checked.
- **`src/plugins/db.ts` — Oracle port bitwise-OR bug.** `` connection.port | 1521 `` used the bitwise OR operator instead of a fallback, silently corrupting any configured port (e.g. `1520` → `2045`). Fixed to `connection.port || 1521`, and default ports are now client-aware (`defaultPortFor()`) instead of always defaulting to MySQL's `3306`.
- **`src/plugins/db.ts` — no startup validation of required DB fields.** Missing `host`/`user`/`database` env vars previously only surfaced as a cryptic connection error on first query. Fixed: `dbConnection()` now validates and throws a clear, actionable error immediately.
- **`src/routes/index.ts` — blocking `fs.readFileSync()` in `/autosent-result` route handler.** Blocked the Node.js event loop for all concurrent requests while reading the result file. Fixed: switched to `fs.promises.readFile()`.
- **`src/app.ts` — no centralized error handler.** Added `app.setErrorHandler(...)` as defense-in-depth for any error that propagates as a thrown exception without being caught locally by a route. Note: this does **not** change the many routes that already catch errors themselves and return `error.message` directly (a separate, broader information-disclosure cleanup spanning 100+ call sites, tracked as a follow-up, not done in this pass).
- **`src/nodecron.ts` — misleading `req`/`res` parameter names in the cron callback.** `node-cron` never invokes the scheduled callback with real request/response objects; clarified via renamed types and a comment to avoid future confusion (no functional change — downstream code already guarded against `undefined`).

**Verification:** `npx tsc --noEmit` passes; `npm run test:security` shows no new regressions (same 3 pre-existing unrelated failures); the app was booted locally end-to-end and confirmed: HIS DB connects and is verified before the server starts listening, an intentionally-unconfigured ISONLINE DB fails gracefully with a clear message without blocking startup, and non-PM2 execution correctly falls back to "first process" behavior.

**Not fixed in this pass (acknowledged, larger scope):**
- Global mutable state (`global.dbHIS`, `global.appDetail`, etc.) shared across routes/cron — real architectural coupling risk, but removing it touches dozens of files and needs dedicated, carefully-tested refactor work.
- The ~100+ call sites across `src/routes/**` that return raw `error.message` to API clients — same information-disclosure issue as the original SEC-07 finding; only a centralized fallback handler was added as defense-in-depth.

