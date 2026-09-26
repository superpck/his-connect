# Security Audit — his-connect

**Date:** 2026-09-25
**Scope:** `src/` (active TypeScript source) only. `app/` is the compiled/legacy JS mirror produced by `npm run build` and is excluded — findings here apply equally to it once rebuilt.
**Method:** Static code review (manual read + grep across the full `src/` tree). No dynamic testing / DAST was performed.

---

## Executive summary

| ID | Title | Severity | File(s) | Status |
|----|-------|----------|---------|--------|
| SEC-01 | SQL injection via unparameterized `db.raw()` string interpolation | **Critical** | 14 files in `src/models/his/*.ts` (see Appendix A) | Confirmed |
| SEC-02 | Hardcoded/default fallback secrets | **Critical** | `src/middleware/telegram.ts`, `src/middleware/moph-refer.ts`, `src/routes/refer/send.ts`, `src/routes/refer/send-moph.ts` | Confirmed |
| SEC-03 | Global, unkeyed session for the setup admin panel (session shared by all clients) | **Critical** | `src/routes/setup.ts` | Confirmed |
| SEC-04 | Admin credentials submitted via `GET` query string | **High** | `templates/pages/login.ejs`, `src/routes/setup.ts` | Confirmed |
| SEC-05 | Permissive CORS (`origin: true` + `credentials: true`) | **High** | `src/app.ts` | Confirmed |
| SEC-06 | No CSRF protection on the session-based setup panel | **High** | `src/routes/setup.ts`, `templates/pages/setup.ejs` | Confirmed |
| SEC-07 | Information disclosure — raw `error.message` returned to API clients | **High** | 10+ files under `src/routes/**` (100+ occurrences) | Confirmed |
| SEC-08 | Sensitive data (PII, tokens) written to console logs | **Medium** | `src/routes/pcc/index.ts`, `src/routes/isonline/login.ts`, `src/routes/refer/crontab.ts`, `src/routes/refer/send-moph.ts` | Confirmed |
| SEC-09 | No centralized input validation | **Medium** | Most of `src/routes/**` | Confirmed |
| SEC-10 | JWT accepted from request body as a fallback to the `Authorization` header | **Medium** | `src/middleware/authenticate.ts` | Confirmed |
| SEC-11 | Weak hash (MD5) used for request-key comparison | **Low** | `src/app.ts`, `src/routes/index.ts` | Confirmed |
| SEC-12 | Deprecated `mysql` driver kept alongside `mysql2` | **Low** | `package.json` | Confirmed |
| SEC-13 | Dead code retains an unsafe SQL pattern | **Info** | `src/models/his/his_hosxpv3.ts` (`getDrugAllergy__`) | Confirmed |

---

## Findings

### SEC-01 — SQL injection via unparameterized `db.raw()` (Critical)

**Category:** A03:2021 – Injection

Many `his_*` model files build SQL with template literals that splice request-derived values (`date`, `searchText`, `searchNo`, `hn`, `cid`, occasionally `columnName`) directly into the query string passed to Knex's `db.raw()`, instead of using `?` placeholders + a bindings array.

Representative evidence:

```ts
// src/models/his/his_md.ts:20-34
async getReferOut(db: Knex, date, hospCode=hcode) {
        const sql=`select ${hcode} as hospcode, ...
        where b.date_visit="${date}"
        order by a.SEQ `;
        const result = await db.raw(sql);
```
```ts
// src/models/his/his_md.ts:78-83
async getPerson(db: Knex, columnName, searchText) {
    const sql = `select ... from f43_person a
        where ${columnName}="${searchText}" `;
    const result = await db.raw(sql);
```

Both `date` and `searchText`/`searchNo`/`hn`/`cid` originate from the HTTP request body without sanitization, e.g.:

```ts
// src/routes/his/index.ts:169-173
const date = body.date || now;
...
const rows: any = await hisModel.getReferOut(global.dbHIS, date, hospcode);
```
```ts
// src/routes/his/index.ts:198-210
const hn = body.hn;
const cid = body.cid;
...
const result = await hisModel.getPerson(global.dbHIS, typeSearch, textSearch, hospcode);
```

`columnName` itself is fixed by the route handler (`'hn'` or `'cid'` literals) in this specific case, so the primary injection vector here is through the *value* (`searchText`/`date`), not the column name — but in other affected files (`his_mkhospital.ts`, `thairefer.ts`, `his_ihospital.ts`) `columnName` is also interpolated directly, widening the attack surface to arbitrary column/clause injection.

**Exploit sketch:** `POST /his/referout` with `{"date": "2024-01-01\" OR \"1\"=\"1"}` or `{"date": "2024-01-01\"; DROP TABLE hos_pt; --"}` alters the WHERE clause or chains a second statement (subject to the underlying driver's multi-statement support).

**Impact:** Full read/write access to the connected HIS database (patient PII, medical records), potential data destruction, depending on DB engine and driver multi-statement behavior.

**Note — mixed safety within some files:** `his_emrsoft.ts`, `his_haos.ts`, `his_hosxppcu.ts`, `his_hosxpv3.ts`, and `his_hosxpv4.ts` contain *both* patterns: some functions correctly use `?` bindings (e.g. `his_hosxpv3.ts:1571-1604` `getAppointment()` whitelists `columnName` via a `colMap` lookup and throws on unknown values, then binds the value with `.where(colRef, searchValue)`), while sibling functions in the same file still interpolate raw values. The safe pattern already exists in this codebase and should be the template for the fix.

**Remediation:**
1. Replace every `` db.raw(`...${value}...`) `` with `db.raw('...?...', [value])`, or use Knex's query builder (`.where()`, `.whereBetween()`) instead of raw SQL where possible.
2. For dynamic column names, apply the `colMap` whitelist pattern already used in `his_hosxpv3.ts`/`his_hosxpv4.ts` (`getAppointment`, `getDiagnosisIpd`): map the incoming `columnName` through a fixed dictionary and throw on unmapped values — never interpolate the raw column name.
3. Add a regression test per fixed model (mirroring `test/security/security-regressions.test.ts`'s existing `buildReportQuery` SQLi test) asserting that injection payloads in `date`/`searchText`/`hn`/`cid` are rejected or safely bound.
4. Full list of files requiring remediation is in **Appendix A**.

---

### SEC-02 — Hardcoded / default fallback secrets (Critical)

**Category:** A07:2021 – Identification and Authentication Failures / A02:2021 – Cryptographic Failures

```ts
// src/middleware/telegram.ts:8-11
const tokenList: Record<string, BotConfig> = {
  "group name": {
    botToken: "token1",
  }
};
```
This is a placeholder/example value committed to source control as a literal bot token map, rather than being loaded from environment/config. If real tokens are ever substituted here directly (as the structure invites), they become permanently baked into git history.

```ts
// src/middleware/moph-refer.ts:13-14
const apiKey = process.env?.MOPH_ERP_APIKEY || process.env.NREFER_APIKEY || 'api-key';
const secretKey = process.env?.MOPH_ERP_SECRETKEY || process.env.NREFER_SECRETKEY || 'secret-key';
```
Same fallback pattern is duplicated in `src/routes/refer/send.ts:16-17` and `src/routes/refer/send-moph.ts` (via the shared `getToken(apiKey, secretKey)` call). If the environment variables are unset (e.g. misconfigured deployment), the app silently uses the literal strings `'api-key'`/`'secret-key'` to authenticate against the external MOPH refer API instead of failing closed.

**Note:** `send.ts` and `send-moph.ts` both begin with the comment `// ห้ามแก้ไข file นี้ //` ("do not modify this file"). Any fix touching these two files must be coordinated with whoever owns that constraint — the recommended fix below can be applied entirely inside `moph-refer.ts` (the shared module they both call into) without touching the protected files.

**Remediation:**
1. Move the real Telegram bot token map in `telegram.ts` to environment variables (e.g. `TELEGRAM_BOT_TOKENS` as JSON, or one env var per bot).
2. Remove the `'api-key'` / `'secret-key'` string fallbacks in `moph-refer.ts`; instead, throw/log a startup error if the required env vars are missing so the app fails closed rather than authenticating with a known dummy value.

---

### SEC-03 — Global, unkeyed session for the setup panel (Critical)

**Category:** A01:2021 – Broken Access Control / A07:2021 – Identification and Authentication Failures

```ts
// src/routes/setup.ts:266-279
let setupSession: any = '';
...
function setSession() {
  setupSession = moment().add(15 * 4 * 4, 'minute').format('YYYYMMDDHHmmss');
  fastify.setupSession = setupSession;
  return setupSession
}
function getSession() {
  return setupSession;
}
```

`setupSession` is a single module-scope (process-wide) variable, not a per-client cookie or token. Once **any** visitor successfully authenticates with the `RequestKey`/`SecretKey` (see SEC-04), the resulting "session" is valid for **every** subsequent visitor to `/setup-api/form` from any IP, for up to 4 hours (`15*4*4` = 240 minutes), until it expires or another login overwrites it. This is a shared global state authentication bypass, not merely a weak session — no per-user isolation exists at all.

**Impact:** Any unauthenticated user who accesses the setup panel while a legitimate admin's session is active can view and modify the running configuration (`/setup-api/save`), including `REQUEST_KEY`/`SECRET_KEY`, DB connection settings, etc.

**Remediation:** Replace the module-level variable with a real per-client session (signed, `HttpOnly`, `Secure`, `SameSite=Strict` cookie, e.g. via `fastify-session`, which is already a dependency in `package.json` but not registered in `src/app.ts`).

---

### SEC-04 — Admin credentials submitted via `GET` query string (High)

**Category:** A02:2021 – Cryptographic Failures / A05:2021 – Security Misconfiguration

```html
<!-- templates/pages/login.ejs:6 -->
<form action="/setup-api/form" method="get">
  ...
  <input type="password" ... name="RequestKey" ...>
  <input type="password" ... name="SecretKey" ...>
```
```ts
// src/routes/setup.ts:34-40
const requestKey = req.query && req.query.RequestKey ? req.query.RequestKey : null;
const secretKey = req.query && req.query.SecretKey ? req.query.SecretKey : null;
if (requestKey && secretKey &&
  requestKey === process.env.REQUEST_KEY && secretKey === process.env.SECRET_KEY) {
```
Credentials are sent as URL query parameters via a `GET` form. They will appear in browser history, server access logs, proxy logs, and the `Referer` header of any subsequent cross-origin request from that page. Comparison is also a plain `===` (not constant-time), though the primary risk here is the transport, not timing.

**Remediation:** Change the form to `method="post"` and read credentials from `req.body` instead of `req.query`; use `crypto.timingSafeEqual` for the comparison (as already done for `REQUEST_KEY` in `src/routes/index.ts`, see "What's already good").

---

### SEC-05 — Permissive CORS configuration (High)

**Category:** A05:2021 – Security Misconfiguration

```ts
// src/app.ts:53-60
app.register(require('@fastify/cors'), {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [...],
  credentials: true,
  strictPreflight: false,
  allowPrivateNetwork: true
});
```
`origin: true` reflects whatever `Origin` header the browser sends and allows it, combined with `credentials: true`. This means any website can make authenticated (cookie/Authorization-bearing) cross-origin requests to this API and read the response, defeating the same-origin policy for browser-based clients.

**Remediation:** Replace `origin: true` with an explicit allow-list (env-configurable) of trusted origins. Only set `credentials: true` for origins that actually need cookie/credentialed access.

---

### SEC-06 — No CSRF protection (High)

**Category:** A01:2021 – Broken Access Control

No CSRF token generation/validation exists anywhere in `src/` (no `csrf`/`csurf` dependency, no hidden token field in `templates/pages/setup.ejs` or `login.ejs`). Combined with SEC-03 (shared global session) and SEC-05 (permissive CORS), a third-party page can trigger state-changing requests (e.g. `POST /setup-api/save`) on behalf of an active admin session.

**Remediation:** Once SEC-03 is fixed with a real cookie-based session, add CSRF tokens to the setup forms (e.g. `@fastify/csrf-protection`) and set `SameSite=Strict` on the session cookie.

---

### SEC-07 — Information disclosure via raw error messages (High)

**Category:** A09:2021 – Security Logging and Monitoring Failures / Information Exposure

Over 100 call sites across `src/routes/his/index.ts`, `src/routes/index.ts`, `src/routes/isonline/*.ts`, `src/routes/pcc/index.ts`, `src/routes/qdrugstore/index.ts`, `src/routes/refer/*.ts` return the raw exception message (and in several places the full `error` object) directly to the API caller:

```ts
// src/routes/isonline/index.ts:62
reply.send({ ..., ok: false, error: error, message: error.message });
```
```ts
// src/routes/pcc/index.ts:46
reply.status(...).send({ ..., message: error.message });
```

Depending on the failure, this can leak SQL fragments, driver error codes, file paths, or internal hostnames to any caller — including unauthenticated ones on routes without a `preHandler`.

**Remediation:** Return a generic message (`"Internal Server Error"`) to the client; log `error` (with stack trace) server-side only, e.g. via the `pino` logger already in `package.json`. This can be centralized with a Fastify `setErrorHandler` instead of repeating try/catch blocks in every route.

---

### SEC-08 — Sensitive data written to console logs (Medium)

**Category:** A09:2021 – Security Logging and Monitoring Failures

```ts
// src/routes/pcc/index.ts:43
console.log('person', searchValue, error.message);
// src/routes/pcc/index.ts:70
console.log('person', fname, lname, error.message);
// src/routes/pcc/index.ts:104
console.log('person-chronic', cid, pid, error.message);
```
```ts
// src/routes/refer/send-moph.ts:124
console.log(resultGetData.rows[0].hn, resultGetData.rows[0].fname);
```
Patient identifiers (HN, CID, name) and authentication artifacts are written to stdout, which is typically captured by log aggregation with looser access controls than the primary database — a compliance concern for health data (PHI) specifically.

**Remediation:** Remove or redact PII/credential values from log statements; if needed for debugging, log a hashed/truncated identifier instead of the raw value, and gate verbose logs behind a debug-only flag that's off in production.

---

### SEC-09 — No centralized input validation (Medium)

**Category:** A03:2021 – Injection (contributing factor) / A04:2021 – Insecure Design

No validation library (`joi`, `zod`, `class-validator`, Fastify JSON Schema) is used project-wide. The one exception is `src/models/isonline/report.ts`, which validates `hospCode`/`region`/`changwat` against a regex before use:
```ts
// src/models/isonline/report.ts:3-12
const CODE_PATTERN = /^[A-Za-z0-9_-]{1,20}$/;
if (!CODE_PATTERN.test(conditions.hospCode)) {
  throw new Error('Invalid hospital code');
}
```
Elsewhere, `req.body`/`req.query` fields are used directly (e.g. `body.date`, `body.hn`, `body.cid` in `src/routes/his/index.ts`) with no type/format/length checks before being passed to model functions.

**Remediation:** Adopt Fastify's built-in JSON Schema validation (`schema: { body: {...} }` per route) as the primary defense, so malformed input is rejected before it reaches any model/query code — this also mitigates SEC-01 as defense-in-depth (though parameterization in SEC-01 remains the primary fix).

---

### SEC-10 — JWT accepted via request body (Medium)

**Category:** A07:2021 – Identification and Authentication Failures

```ts
// src/middleware/authenticate.ts:5-8
if (request.body && request.body.token) {
  request.headers.authorization = 'Bearer ' + request.body.token;
}
```
Accepting the token in the JSON body (in addition to the standard `Authorization` header) increases the chance the token ends up logged (body logging, error dumps, proxies that log bodies but redact headers) and is unconventional for bearer-token APIs.

**Remediation:** If this exists for backward compatibility with an older client, deprecate it on a timeline and log a warning when the body fallback path is used, so remaining callers can be identified and migrated to header-based auth.

---

### SEC-11 — MD5 used for request-key hashing (Low)

**Category:** A02:2021 – Cryptographic Failures

```ts
// src/app.ts:97 / src/routes/index.ts (isValidRequestKey)
var requestKey = crypto.createHash('md5').update(process.env.REQUEST_KEY).digest('hex');
```
MD5 is cryptographically broken for collision resistance, though its use here is only to obscure the key in transit/headers rather than for integrity — and the comparison against it is timing-safe (`crypto.timingSafeEqual`, see "What's already good"). Risk is low but the algorithm choice should be modernized.

**Remediation:** Replace `md5` with `sha256` for the digest; this is a low-risk, low-effort change with no functional impact as long as client and server are updated together.

---

### SEC-12 — Deprecated `mysql` driver retained (Low)

**Category:** A06:2021 – Vulnerable and Outdated Components

```json
// package.json
"mysql": "^2.18.1",
"mysql2": "^3.24.4",
```
The legacy `mysql` package is no longer actively maintained (superseded by `mysql2`, which is already present). Keeping both increases dependency surface unnecessarily.

**Remediation:** Confirm nothing in `src/` still `require`s `mysql` directly (vs. Knex's `mysql2` client), then remove the `mysql` dependency.

---

### SEC-13 — Dead code retains an unsafe SQL pattern (Info)

```ts
// src/models/his/his_hosxpv3.ts:1487
async getDrugAllergy__(db: Knex, hn, hospCode = hisHospcode) {
  const sql = `... where oe.hn = '${hn}' ...`;
```
The double-underscore-suffixed `getDrugAllergy__` is not referenced anywhere in `src/` (confirmed via workspace-wide search) — it appears to be superseded by the safe, parameterized `getDrugAllergy()` defined immediately after it in the same file. It is currently dead code, but it retains the unsafe interpolation pattern and could be accidentally reactivated or copy-pasted as a template for new code.

**Remediation:** Delete `getDrugAllergy__` and its compiled counterpart in `app/models/his/his_hosxpv3.js` (on next build).

---

## What's already good (for balance)

- **Timing-safe key comparison:** `src/routes/index.ts`'s `isValidRequestKey()` correctly uses `crypto.timingSafeEqual()` after MD5-hashing the configured `REQUEST_KEY` (see SEC-11 for the hash-algorithm caveat).
- **Security headers & rate limiting:** `@fastify/helmet` and `@fastify/rate-limit` are registered in `src/app.ts` with a sane default (1000 req/min, configurable).
- **SQLi-safe query builder pattern exists in-repo:** `src/models/isonline/report.ts`'s `buildReportQuery()` validates inputs with regex and returns fully parameterized `sql`/`bindings`; `his_hosxpv3.ts`/`his_hosxpv4.ts` (`getAppointment`, `getDiagnosisIpd`) whitelist column names via a `colMap` and bind values with `?`. These are the reference implementations that SEC-01's fix should follow.
- **Existing regression test suite:** `test/security/security-regressions.test.ts` already covers: JWT rejection on missing/invalid/expired tokens, `buildReportQuery()` SQLi rejection, absence of the generic `selectSql`/`selectSqlK` raw-SQL model API, absence of the `/selectData` raw SQL route, `authenticateRequest` pre-handler presence on user-mutation routes, and rejection of spoofed `x-forwarded-for`/`x-real-ip` headers during API login. New fixes from this audit should extend this same suite.
- **XSS-safe templating:** `templates/pages/*.ejs` consistently use `<%= %>` (auto-escaped output), not `<%- %>`; no stored/reflected XSS vector found in templates.
- **No path traversal / command injection found:** all `fs.*`/`path.join` calls use fixed or config-derived paths, not request input; all `shell.exec()`/`execSync()` calls use hardcoded command strings (`pm2 jlist`, `tsc`, etc.), not request-derived data.
- **Secrets loaded from environment for the primary auth flow:** `src/plugins/jwt.ts` and `@fastify/jwt` registration both source the signing secret from `process.env.SECRET_KEY` with no hardcoded fallback.

---

## Appendix A — Files affected by SEC-01 (unparameterized SQL)

Confirmed via `grep` for `${date}` / `${searchText}` / `${searchNo}` / `${columnName}` / `${hn}` / `${cid}` interpolated directly inside `db.raw()` / raw SQL strings in `src/models/his/`:

| File | Notes |
|------|-------|
| `his_emrsoft.ts` | Mixed: some functions safe (`?` binding), others (lines ~785, 814, 1173, 1273) unsafe |
| `his_haos.ts` | Mixed: unsafe at ~947, 1319, 1419 |
| `his_hosxppcu.ts` | Unsafe at ~180, 216, 298, 860, 891, 1261, 1361 |
| `his_hosxpv3.ts` | Mostly safe (colMap + `?`), but unsafe live code at ~1722; unsafe **dead code** at ~1487 (see SEC-13) |
| `his_hosxpv4.ts` | Verify remaining raw-string functions individually against the safe `getAppointment`/`getDiagnosisIpd` pattern in the same file |
| `his_ihospital.ts` | Unsafe at ~121 |
| `his_md.ts` | Unsafe at ~34, 79, 118, 193, 278 |
| `his_mkhospital.ts` | Unsafe at ~29, 41, 52, 72, 164, 240 (including column-name interpolation) |
| `his_mypcu.ts` | Unsafe at ~351 |
| `his_nemo.ts` | Unsafe at ~41, 65, 81, 104, 169, 231 |
| `his_pmk.ts` | Unsafe at ~29, 63, 96, 176 (date range built via string concat into `TO_DATE(...)`) |
| `his_thiades.ts` | Unsafe at ~30, 39, 46, 54, 122, 183 |
| `pcc-model.ts` | Unsafe at ~19 |
| `thairefer.ts` | Unsafe at ~116, 141, 223, 312, 728, 1064, 1155, 1233 (including column-name interpolation) |

**Note:** Line numbers are approximate anchors from the audit date (2026-09-25) and will drift as the files change — always re-locate by the surrounding function name before patching.

---

## Suggested remediation order (for the follow-up fix session)

1. SEC-01 (SQL injection) — highest impact, patient data at risk.
2. SEC-03 + SEC-04 + SEC-06 (setup panel auth/session/CSRF cluster) — full admin takeover risk.
3. SEC-02 (hardcoded/default secrets).
4. SEC-05 (CORS) and SEC-07 (error disclosure) — broad-surface hardening.
5. SEC-08, SEC-09, SEC-10, SEC-11, SEC-12, SEC-13 — lower-risk cleanup.
