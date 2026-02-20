# Dev Troubleshooting (Next.js chunk/module errors)

## Symptoms
- `Error: Cannot find module './682.js'`
- `Cannot find module './276.js'`
- `PageNotFoundError` during `next build` for routes that exist

These errors are usually caused by a stale `.next` cache and/or an out-of-sync dev process.

## Standard workflow
- For normal development: `npm run dev`
- If any chunk/module error appears: `npm run dev:reset`

Do not fix manually unless `dev:reset` fails.

## Commands
- `npm run dev:clean`: Remove `.next` and start clean dev server.
- `npm run dev:reset`: Stop workspace Next server on `:3000`, verify port is free, remove `.next`, start clean dev.
- `npm run build:clean`: Remove `.next` and run `next build`.
- `npm run diag:chunks`: Print diagnostics for `.next` server chunks/runtime and active listener on `:3000`.

## Recovery checklist
1. Run `npm run dev:reset`.
2. Verify:
   - `GET /` returns `200`
   - `GET /login/admin` returns `200`
   - `GET /api/teams/<id>` returns auth/validation response (e.g. `401`/`200`) but not `500` module error
3. If still broken, run `npm run diag:chunks` and share output.

## Build consistency check
Run:

```bash
npm run build:clean
```

Expected: build completes without `Cannot find module './*.js'` and without `PageNotFoundError` for existing routes.
