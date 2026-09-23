# OWASP Web Application Security Testing checklist

Source: [OWASP](https://www.owasp.org/index.php/Web_Application_Security_Testing_Cheat_Sheet)
(Web Application Security Testing Cheat Sheet), as supplied by the owner on 2026-09-23.

**Attribution and licence.** Adapted from the OWASP Foundation's _Web
Application Security Testing Cheat Sheet_, whose checklist was last on the OWASP
wiki in
[revision 236456 (2017-12-29)](https://wiki.owasp.org/index.php?title=Web_Application_Security_Testing_Cheat_Sheet&oldid=236456).
The archived wiki's content is available under
[Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
(the wiki footer, checked 2026-09-23). This file is an adaptation shared under
the same licence, CC BY-SA 4.0, whatever the licence of the rest of the
repository. Changes from the original: item IDs and the **How to verify** column
added, lists turned into tables, and item wording taken from the copy the owner
supplied. That copy matches the 2017 revision word for word in 102 of the 131
items and rewords the other 29.

The **Item** column is the owner-supplied copy's text, verbatim. The **ID**
column and the **How to verify** column are this skill's own additions: the IDs
are stable so that reports can be compared across runs, and the hints are
starting points, not OWASP guidance and not the only acceptable method.

131 items: INFO 14 · CONF 8 · TRAN 6 · AUTHN 16 · SESS 13 · AUTHZ 5 · VAL 32 ·
DOS 4 · BIZ 5 · CRYP 5 · FILE 8 · CARD 11 · HTML5 4.

## Contents

1. [Information Gathering (INFO)](#information-gathering-info)
2. [Configuration Management (CONF)](#configuration-management-conf)
3. [Secure Transmission (TRAN)](#secure-transmission-tran)
4. [Authentication (AUTHN)](#authentication-authn)
5. [Session Management (SESS)](#session-management-sess)
6. [Authorization (AUTHZ)](#authorization-authz)
7. [Data Validation (VAL)](#data-validation-val)
8. [Denial of Service (DOS)](#denial-of-service-dos)
9. [Business Logic (BIZ)](#business-logic-biz)
10. [Cryptography (CRYP)](#cryptography-cryp)
11. [Risky Functionality - File Uploads (FILE)](#risky-functionality---file-uploads-file)
12. [Risky Functionality - Card Payment (CARD)](#risky-functionality---card-payment-card)
13. [HTML 5 (HTML5)](#html-5-html5)

## Information Gathering (INFO)

| ID      | Item                                                                                                       | How to verify                                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| INFO-01 | Manually explore the site                                                                                  | Walk every page and flow in the running app; list every route you reach.                                            |
| INFO-02 | Spider/crawl for missed or hidden content                                                                  | Compare the route files in the source tree with the routes you reached; anything unreached is a hidden entry point. |
| INFO-03 | Check for files that expose content, such as robots.txt, sitemap.xml, .DS_Store                            | `curl -i` each well-known path; check the public/static directory and the build output for stray files.             |
| INFO-04 | Check the caches of major search engines for publicly accessible sites                                     | Passive only: read the results of a `site:<host>` search. Never request indexing or removal.                        |
| INFO-05 | Check for differences in content based on User Agent (eg, Mobile sites, access as a Search engine Crawler) | Request the same page with a desktop, mobile and crawler `User-Agent`; diff the responses.                          |
| INFO-06 | Perform Web Application Fingerprinting                                                                     | Look at what headers (`Server`, `X-Powered-By`) and error pages reveal about the framework and its version.         |
| INFO-07 | Identify technologies used                                                                                 | Read the dependency manifest and the architecture decisions; record framework, auth library, ORM, database, host.   |
| INFO-08 | Identify user roles                                                                                        | Read the data model and auth spec; list every role, including "anonymous".                                          |
| INFO-09 | Identify application entry points                                                                          | Enumerate every page route, API route, server action, form, and agent-callable tool, with its HTTP method.          |
| INFO-10 | Identify client-side code                                                                                  | Identify what ships to the browser (client components, bundles) versus what stays on the server.                    |
| INFO-11 | Identify multiple versions/channels (e.g. web, mobile web, mobile app, web services)                       | List every channel the same data is reachable through (UI, JSON API, agent tools) — each needs the same controls.   |
| INFO-12 | Identify co-hosted and related applications                                                                | Check the hosting config for other apps or preview deployments on the same domain.                                  |
| INFO-13 | Identify all hostnames and ports                                                                           | List production, preview and local hosts and ports from the hosting and dev config.                                 |
| INFO-14 | Identify third-party hosted content                                                                        | Grep for external script, font, image and API origins; compare with the CSP allow-list.                             |

## Configuration Management (CONF)

| ID      | Item                                                                      | How to verify                                                                                                                                                                                                                                      |
| ------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CONF-01 | Check for commonly used application and administrative URLs               | Probe `/admin`, `/api/admin/*`, `/debug`, test-support routes and framework dev endpoints; each is absent (404) or requires auth or a secret, as the route matrix says.                                                                            |
| CONF-02 | Check for old, backup and unreferenced files                              | Look for `.bak`, `.old`, `~`, source maps and editor files in the public directory and the build output.                                                                                                                                           |
| CONF-03 | Check HTTP methods supported and Cross Site Tracing (XST)                 | Send `TRACE`, `PUT`, `PATCH`, `DELETE` to each route; unsupported methods answer 405 (or the route's 404), never execute. Next.js answers `OPTIONS` itself and serves `HEAD` from `GET`, so those two are not findings.                            |
| CONF-04 | Test file extensions handling                                             | Request routes with added extensions (`.json`, `.txt`, `.bak`); confirm no source or data leaks.                                                                                                                                                   |
| CONF-05 | Test for security HTTP headers (e.g. CSP, X-Frame-Options, HSTS)          | `curl -I` a page and an API route; check CSP, `frame-ancestors`/`X-Frame-Options`, HSTS, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`. Compare with the documented header requirement before calling a missing header a FAIL. |
| CONF-06 | Test for policies (e.g. Flash, Silverlight, robots)                       | Check for `crossdomain.xml`, `clientaccesspolicy.xml`, and what `robots.txt` discloses.                                                                                                                                                            |
| CONF-07 | Test for non-production data in live environment, and vice-versa          | Compare the seed data with what production serves; confirm no real personal data in dev fixtures.                                                                                                                                                  |
| CONF-08 | Check for sensitive data in client-side code (e.g. API keys, credentials) | Grep the client bundle and client-exposed env vars (`NEXT_PUBLIC_*` or equivalent) for keys, secrets, internal URLs.                                                                                                                               |

## Secure Transmission (TRAN)

| ID      | Item                                                                | How to verify                                                                                                                                                                                                                                                             |
| ------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TRAN-01 | Check SSL Version, Algorithms, Key length                           | Deployed host only: one `openssl s_client -connect <host>:443 -servername <host>`, plus one attempt with `-tls1_1` to confirm it is refused. Cipher enumeration (`nmap`, `testssl.sh`) makes hundreds of handshakes, so it needs the owner's go-ahead. Local HTTP is N/A. |
| TRAN-02 | Check for Digital Certificate Validity (Duration, Signature and CN) | Inspect the deployed certificate: expiry, issuer, SAN/CN matches the host.                                                                                                                                                                                                |
| TRAN-03 | Check credentials only delivered over HTTPS                         | Confirm the login endpoint is not reachable over plain HTTP on the deployed host (redirect or refusal).                                                                                                                                                                   |
| TRAN-04 | Check that the login form is delivered over HTTPS                   | Confirm the login page itself is only served over HTTPS in production.                                                                                                                                                                                                    |
| TRAN-05 | Check session tokens only delivered over HTTPS                      | The session cookie carries `Secure` in production; check the code path that decides when `Secure` is set.                                                                                                                                                                 |
| TRAN-06 | Check if HTTP Strict Transport Security (HSTS) in use               | `Strict-Transport-Security` header present on the deployed host, with a sensible `max-age`.                                                                                                                                                                               |

## Authentication (AUTHN)

| ID       | Item                                                                                           | How to verify                                                                                                                                                                                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUTHN-01 | Test for user enumeration                                                                      | Compare status and body for a wrong password on a real user versus an unknown user; they must be identical. For timing, read the code: does the password comparison still run when the user is unknown? Sampling timings needs many requests and trips the login rate limit. |
| AUTHN-02 | Test for authentication bypass                                                                 | Call every protected route without a session, with a tampered cookie, and with an expired one.                                                                                                                                                                               |
| AUTHN-03 | Test for bruteforce protection                                                                 | Read the rate-limit code and its tests; confirm the limit locally with a small, fixed number of requests.                                                                                                                                                                    |
| AUTHN-04 | Test password quality rules                                                                    | Read the sign-up validation schema; try boundary-length and trivial passwords.                                                                                                                                                                                               |
| AUTHN-05 | Test remember me functionality                                                                 | Check whether a "remember me" exists; if so, how its token is stored, scoped and revoked.                                                                                                                                                                                    |
| AUTHN-06 | Test for autocomplete on password forms/input                                                  | Check the password input's `autocomplete` attribute (`current-password` / `new-password` is the modern expectation).                                                                                                                                                         |
| AUTHN-07 | Test password reset and/or recovery                                                            | Check whether a reset flow exists; if so, token entropy, expiry, single use, and no enumeration.                                                                                                                                                                             |
| AUTHN-08 | Test password change process                                                                   | Check whether change-password exists; if so, it requires the current password and rotates the session.                                                                                                                                                                       |
| AUTHN-09 | Test CAPTCHA                                                                                   | Check whether a CAPTCHA exists; if not, record what else provides anti-automation (see DOS-01).                                                                                                                                                                              |
| AUTHN-10 | Test multi factor authentication                                                               | Check whether MFA exists and whether its absence is a scope decision.                                                                                                                                                                                                        |
| AUTHN-11 | Test for logout functionality presence                                                         | Logout exists and is reachable from every authenticated page. What logout does to the session is SESS-07.                                                                                                                                                                    |
| AUTHN-12 | Test for cache management on HTTP (eg Pragma, Expires, Max-age)                                | Authenticated pages and API responses send `Cache-Control: no-store` (or `private`); check the headers.                                                                                                                                                                      |
| AUTHN-13 | Test for default logins                                                                        | Search for hard-coded or seeded credentials; if they exist by design, record the design decision.                                                                                                                                                                            |
| AUTHN-14 | Test for user-accessible authentication history                                                | Check whether users can see their own login history; record absence with the scope reason if any.                                                                                                                                                                            |
| AUTHN-15 | Test for out-of channel notification of account lockouts and successful password changes       | Check whether any email/SMS notification exists; record absence with the scope reason if any.                                                                                                                                                                                |
| AUTHN-16 | Test for consistent authentication across applications with shared authentication schema / SSO | Check whether any other app shares the auth; every channel from INFO-11 enforces the same auth.                                                                                                                                                                              |

## Session Management (SESS)

| ID      | Item                                                                                                 | How to verify                                                                                                                                                                                                                                                                                                                 |
| ------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SESS-01 | Establish how session management is handled in the application (eg, tokens in cookies, token in URL) | Read the auth ADR and session code; record mechanism (sealed cookie, server store, JWT) and confirm no token in URLs.                                                                                                                                                                                                         |
| SESS-02 | Check session tokens for cookie flags (httpOnly and secure)                                          | Inspect `Set-Cookie` on login: `HttpOnly`, `Secure` (production), `SameSite`.                                                                                                                                                                                                                                                 |
| SESS-03 | Check session cookie scope (path and domain)                                                         | `Path=/` at most as wide as needed; no `Domain` wider than the host.                                                                                                                                                                                                                                                          |
| SESS-04 | Check session cookie duration (expires and max-age)                                                  | `Max-Age`/`Expires` matches the documented session lifetime.                                                                                                                                                                                                                                                                  |
| SESS-05 | Check session termination after a maximum lifetime                                                   | Check whether an absolute lifetime exists in addition to any sliding window; record which the spec requires.                                                                                                                                                                                                                  |
| SESS-06 | Check session termination after relative timeout                                                     | Check the idle/sliding timeout logic and its tests.                                                                                                                                                                                                                                                                           |
| SESS-07 | Check session termination after logout                                                               | Replay the pre-logout cookie after logout; it must be rejected (a stateless sealed cookie may not be — check how the design handles that).                                                                                                                                                                                    |
| SESS-08 | Test to see if users can have multiple simultaneous sessions                                         | Log in from two clients; record whether both stay valid and whether the spec allows it.                                                                                                                                                                                                                                       |
| SESS-09 | Test session cookies for randomness                                                                  | Check the session secret's source and length, and that session ids come from a CSPRNG.                                                                                                                                                                                                                                        |
| SESS-10 | Confirm that new session tokens are issued on login, role change and logout                          | Session fixation. With server-side session ids, the id changes on login and logout. With sealed/encrypted cookies the value changes on every write, so comparing values proves nothing: check instead that login replaces the fields of any pre-login session rather than merging into it, and that logout clears the cookie. |
| SESS-11 | Test for consistent session management across applications with shared session management            | Every channel from INFO-11 honours the same session and the same expiry.                                                                                                                                                                                                                                                      |
| SESS-12 | Test for session puzzling                                                                            | Check whether any flow writes a session attribute that another flow trusts (e.g. a pre-auth value read as authenticated).                                                                                                                                                                                                     |
| SESS-13 | Test for CSRF and clickjacking                                                                       | State-changing routes: `SameSite` cookie, method checks, origin checks; framing blocked by `frame-ancestors`.                                                                                                                                                                                                                 |

## Authorization (AUTHZ)

| ID       | Item                                                                                        | How to verify                                                                                                                                                                        |
| -------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AUTHZ-01 | Test for path traversal                                                                     | Find every place a request value becomes a file path; try `../` sequences.                                                                                                           |
| AUTHZ-02 | Test for bypassing authorization schema                                                     | Check the auth middleware's matcher: which paths does it skip, and are all of them meant to be public?                                                                               |
| AUTHZ-03 | Test for vertical Access control problems (a.k.a. Privilege Escalation)                     | If roles exist, call privileged routes with a lower role. If only one role exists, record that.                                                                                      |
| AUTHZ-04 | Test for horizontal Access control problems (between two users at the same privilege level) | Every query that loads by id also filters by the session's owner; try another user's id. If the data model has only one identity, the item is N/A, citing the document that says so. |
| AUTHZ-05 | Test for missing authorization                                                              | Enumerate every API route and server action from INFO-09; each checks the session unless the spec names it public.                                                                   |

## Data Validation (VAL)

| ID     | Item                                                 | How to verify                                                                                                                                                                      |
| ------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VAL-01 | Test for Reflected Cross Site Scripting              | Find request values echoed into responses; inject `<script>`/`"><img onerror>` payloads.                                                                                           |
| VAL-02 | Test for Stored Cross Site Scripting                 | Store payloads in every free-text field, then view every page that renders them.                                                                                                   |
| VAL-03 | Test for DOM based Cross Site Scripting              | Grep for `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, and URL-fragment reads.                                                                                   |
| VAL-04 | Test for Cross Site Flashing                         | Check for any Flash/SWF content; normally N/A with the evidence of a grep.                                                                                                         |
| VAL-05 | Test for HTML Injection                              | Same entry points as VAL-01/02, with plain HTML payloads; check output encoding.                                                                                                   |
| VAL-06 | Test for SQL Injection                               | Grep for `$queryRawUnsafe`, `$executeRawUnsafe`, `Prisma.raw` and string-built SQL. Tagged-template `$queryRaw`/`$executeRaw` and ORM calls are parameterised and are the control. |
| VAL-07 | Test for SOQL Injection                              | Only applies if Salesforce is used; N/A otherwise with evidence.                                                                                                                   |
| VAL-08 | Test for LDAP Injection                              | Only applies if LDAP is used; N/A otherwise with evidence.                                                                                                                         |
| VAL-09 | Test for ORM Injection                               | Check whether request objects are passed straight into ORM `where`/`orderBy`/`select` clauses.                                                                                     |
| VAL-10 | Test for XML Injection                               | Check for any XML parsing of request data; N/A otherwise with evidence.                                                                                                            |
| VAL-11 | Test for XXE Injection                               | Same as VAL-10; if XML is parsed, external entities must be disabled.                                                                                                              |
| VAL-12 | Test for SSI Injection                               | Check for server-side includes; normally N/A for a JS framework, with evidence.                                                                                                    |
| VAL-13 | Test for XPath Injection                             | Check for XPath queries over request data; N/A otherwise with evidence.                                                                                                            |
| VAL-14 | Test for XQuery Injection                            | Check for XQuery use; N/A otherwise with evidence.                                                                                                                                 |
| VAL-15 | Test for IMAP/SMTP Injection                         | Check for any mail sending from request data; N/A otherwise with evidence.                                                                                                         |
| VAL-16 | Test for Code Injection                              | Grep for `eval`, `new Function`, `vm`, dynamic `import()` or `require()` of request values.                                                                                        |
| VAL-17 | Test for Expression Language Injection               | Check for template engines evaluating request data.                                                                                                                                |
| VAL-18 | Test for Command Injection                           | Grep for `child_process`, `exec`, `spawn` in server code reachable from requests.                                                                                                  |
| VAL-19 | Test for Overflow (Stack, Heap and Integer)          | Numeric fields: boundary values, above safe-integer range, negative, `NaN`, exponent notation; compare with the documented bounds.                                                 |
| VAL-20 | Test for Format String                               | Check whether request values are used as format strings in logging or formatting calls.                                                                                            |
| VAL-21 | Test for incubated vulnerabilities                   | Values stored now and rendered or executed later (logs, exports, agent tool outputs).                                                                                              |
| VAL-22 | Test for HTTP Splitting/Smuggling                    | Check whether request values reach response headers unencoded (CR/LF); smuggling is mostly a host/proxy concern — record the host.                                                 |
| VAL-23 | Test for HTTP Verb Tampering                         | Same route with every method, including `HEAD` and method-override headers; auth must not depend on the method.                                                                    |
| VAL-24 | Test for Open Redirection                            | Every redirect that takes a request value (`next`, `returnTo`); try absolute, `//host`, backslash and encoded variants.                                                            |
| VAL-25 | Test for Local File Inclusion                        | Request values reaching `fs` reads or dynamic imports; see AUTHZ-01.                                                                                                               |
| VAL-26 | Test for Remote File Inclusion                       | Request values reaching server-side `fetch` or imports (SSRF-adjacent).                                                                                                            |
| VAL-27 | Compare client-side and server-side validation rules | The server enforces every rule the client enforces — ideally one shared schema; call the API directly with client-invalid data.                                                    |
| VAL-28 | Test for NoSQL injection                             | Only applies if a document store is queried with request objects; N/A otherwise with evidence.                                                                                     |
| VAL-29 | Test for HTTP parameter pollution                    | Repeat a query/body parameter; confirm which value wins and that validation sees that same value.                                                                                  |
| VAL-30 | Test for auto-binding                                | Check whether request bodies are spread into models; only whitelisted fields should bind.                                                                                          |
| VAL-31 | Test for Mass Assignment                             | Send extra fields (`id`, `userId`, `createdAt`, role) on create/update; confirm they are stripped or rejected.                                                                     |
| VAL-32 | Test for NULL/Invalid Session Cookie                 | Send an empty, truncated, oversized and garbage session cookie; expect a clean 401/redirect, never a 500.                                                                          |

## Denial of Service (DOS)

| ID     | Item                       | How to verify                                                                                                        |
| ------ | -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| DOS-01 | Test for anti-automation   | Read which endpoints are rate-limited and how the limit is keyed; confirm locally with a small, fixed request count. |
| DOS-02 | Test for account lockout   | Check whether failed logins lock the account; if the product has one shared account, weigh lockout-as-DoS.           |
| DOS-03 | Test for HTTP protocol DoS | Body size limits, request timeouts, and what the host provides. Read config; do not flood anything.                  |
| DOS-04 | Test for SQL wildcard DoS  | Search/filter inputs passed into `LIKE`/`contains` queries; check for length limits and wildcard escaping.           |

## Business Logic (BIZ)

| ID     | Item                             | How to verify                                                                                              |
| ------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| BIZ-01 | Test for feature misuse          | For each feature, ask what a hostile user gains by using it as designed but at scale or out of order.      |
| BIZ-02 | Test for lack of non-repudiation | Check what is logged for state changes (who, what, when) and whether the spec requires it.                 |
| BIZ-03 | Test for trust relationships     | List what the server trusts from the client (ids, totals, dates, clock) instead of computing itself.       |
| BIZ-04 | Test for integrity of data       | Invariants (balances, totals, limits) hold under concurrent and out-of-order requests; check transactions. |
| BIZ-05 | Test segregation of duties       | If roles exist, check that no single role can both perform and approve a sensitive action.                 |

## Cryptography (CRYP)

| ID      | Item                                                  | How to verify                                                                                                                                                               |
| ------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CRYP-01 | Check if data which should be encrypted is not        | Passwords hashed, session sealed/signed, secrets only in env; check what the database stores in clear.                                                                      |
| CRYP-02 | Check for wrong algorithms usage depending on context | Password storage uses a slow KDF (bcrypt/scrypt/argon2), not a fast hash; signatures use HMAC or AEAD, not plain hashes.                                                    |
| CRYP-03 | Check for weak algorithms usage                       | Grep as whole words, not substrings (`grep -rniw md5`, likewise `sha1`, `rc4`), plus cipher names containing `des-` or `-ecb`; read each hit. Check the bcrypt cost factor. |
| CRYP-04 | Check for proper use of salting                       | The password KDF salts per password (bcrypt does by construction); no global salt reused as a pepper without reason.                                                        |
| CRYP-05 | Check for randomness functions                        | Security-relevant randomness uses `crypto.randomBytes`/`crypto.getRandomValues`/`randomUUID`, never `Math.random`.                                                          |

## Risky Functionality - File Uploads (FILE)

| ID      | Item                                                                                             | How to verify                                                                                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FILE-01 | Test that acceptable file types are whitelisted                                                  | Grep for `type="file"`, `multipart/form-data` and `request.formData()`, then read each hit. If there is no upload handler, the whole category is N/A with that evidence. |
| FILE-02 | Test that file size limits, upload frequency and total file counts are defined and are enforced  | As FILE-01.                                                                                                                                                              |
| FILE-03 | Test that file contents match the defined file type                                              | As FILE-01.                                                                                                                                                              |
| FILE-04 | Test that all file uploads have Anti-Virus scanning in-place.                                    | As FILE-01.                                                                                                                                                              |
| FILE-05 | Test that unsafe filenames are sanitised                                                         | As FILE-01.                                                                                                                                                              |
| FILE-06 | Test that uploaded files are not directly accessible within the web root                         | As FILE-01.                                                                                                                                                              |
| FILE-07 | Test that uploaded files are not served on the same hostname/port                                | As FILE-01.                                                                                                                                                              |
| FILE-08 | Test that files and other media are integrated with the authentication and authorisation schemas | As FILE-01.                                                                                                                                                              |

## Risky Functionality - Card Payment (CARD)

| ID      | Item                                                                                      | How to verify                                                                                        |
| ------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| CARD-01 | Test for known vulnerabilities and configuration issues on Web Server and Web Application | Grep for payment SDKs and card-number fields. If none, the whole category is N/A with that evidence. |
| CARD-02 | Test for default or guessable password                                                    | As CARD-01.                                                                                          |
| CARD-03 | Test for non-production data in live environment, and vice-versa                          | As CARD-01.                                                                                          |
| CARD-04 | Test for Injection vulnerabilities                                                        | As CARD-01.                                                                                          |
| CARD-05 | Test for Buffer Overflows                                                                 | As CARD-01.                                                                                          |
| CARD-06 | Test for Insecure Cryptographic Storage                                                   | As CARD-01.                                                                                          |
| CARD-07 | Test for Insufficient Transport Layer Protection                                          | As CARD-01.                                                                                          |
| CARD-08 | Test for Improper Error Handling                                                          | As CARD-01.                                                                                          |
| CARD-09 | Test for all vulnerabilities with a CVSS v2 score > 4.0                                   | As CARD-01.                                                                                          |
| CARD-10 | Test for Authentication and Authorization issues                                          | As CARD-01.                                                                                          |
| CARD-11 | Test for CSRF                                                                             | As CARD-01.                                                                                          |

## HTML 5 (HTML5)

| ID       | Item                               | How to verify                                                                                                                             |
| -------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| HTML5-01 | Test Web Messaging                 | Grep for `postMessage` and `message` listeners; each listener checks `event.origin`.                                                      |
| HTML5-02 | Test for Web Storage SQL injection | Grep for `localStorage`, `sessionStorage`, `indexedDB`, `openDatabase`; nothing sensitive stored, nothing read back into a query or HTML. |
| HTML5-03 | Check CORS implementation          | Send a cross-origin `Origin` header to API routes; no reflected origin with credentials, no `*` on authenticated routes.                  |
| HTML5-04 | Check Offline Web Application      | Check for a service worker or app cache; if present, what it caches (never authenticated responses).                                      |
