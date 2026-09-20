## Task 9: Minimal GitHub Actions workflow

**Files:**

- Create: `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: `package-lock.json`, `.nvmrc`, and the `lint`, `format:check`, `typecheck`,
  `test` scripts.
- Produces: a `ci` workflow running on pull requests and on pushes to `main` — install,
  lint, typecheck, unit. API and E2E jobs are added by T-05/T-06, the full matrix by T-13
  (backlog).

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: lint · typecheck · unit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install
        run: npm ci

      - name: Lint (includes ADR-0002 import boundaries)
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Typecheck
        run: npm run typecheck

      - name: Unit tests
        run: npm test
```

- [ ] **Step 2: Run the same four commands locally, in the same order, to be sure the
      workflow will pass**

Run: `npm run lint && npm run format:check && npm run typecheck && npm test`
Expected: all four exit 0.

- [ ] **Step 3: Validate the workflow file parses**

Run: `node -e "const fs=require('fs');const s=fs.readFileSync('.github/workflows/ci.yml','utf8');if(!/^name: CI$/m.test(s)||!/npm ci/.test(s))throw new Error('workflow looks wrong');console.log('workflow ok')"`
Expected: `workflow ok`. (A YAML parser is not a dependency of this project; the workflow
is validated for real on the first push.)

- [ ] **Step 4: Commit**

```bash
git add .github
git commit -m "ci: minimal pipeline — install, lint, typecheck, unit (T-01)"
```

---
