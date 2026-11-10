# Test results

Latest run: iteration 1, 2026-11-10. Details are in `test_reports/iteration_1.json`.

## What was checked

| Area | Result |
| --- | --- |
| Backend API (`backend/server.py`): health, original status routes, expense create, list, delete, bulk upsert, validation errors | 20 of 20 passed |
| Frontend storage logic (`src/expenses.ts`): empty, round trip, corrupt data, invalid rows | 6 of 6 passed |
| `tsc --noEmit` | passed |
| `eslint .` | passed |
| Production web bundle (`expo export --platform web`) | built without errors |
| `yarn install --frozen-lockfile` with the delivered `package.json` and `yarn.lock` | passed |
| `scripts/cmd-guard.js` and `scripts/reset-project.js` | behave as described |
| `entrypoint.sh backend` | created the virtualenv, installed the requirements and served `/health` |

Environment: Node 22.23.4, Yarn 1.22.22, Python 3.13.18.

## Not checked

- The backend against a real MongoDB. The API tests used `mongomock-motor`, and the bulk endpoint needed a small workaround for that stand-in (see the caveat in the JSON report).
- The app itself in a browser, simulator or on a phone. Only type checking, linting and bundling were run.
- `./entrypoint.sh frontend` and `./entrypoint.sh` with no argument.
- `uploadExpenses()` talking to a running backend.

## Problems found and fixed during this run

1. `@expo/vector-icons` was imported by `app/index.tsx` but missing from `package.json`. Added.
2. `src/theme.ts` failed type checking because React Native 0.88 no longer exports `StyleSheet.NamedStyles`. The type is now declared locally.
3. `app/index.tsx` had lint errors on a manual `useMemo`. Replaced with a plain filter that gives the same result.
4. `GET /api/expenses` returned `createdAt` without a timezone. Timestamps are now marked as UTC.

## Running the checks again

- Frontend: `cd frontend && yarn install && npx tsc --noEmit && yarn lint`
- Backend: start MongoDB, run `./entrypoint.sh backend`, then call the endpoints in the table in `README.md`.
