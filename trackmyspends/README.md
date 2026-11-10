# TrackMySpends

A simple personal expense tracker. Log an expense in two taps, see how much of your monthly budget is left, and check spending by category. The app is built with Expo (React Native) and a small FastAPI + MongoDB backend.

This project builds on [mukundDeo9325/Expence-tracker](https://github.com/mukundDeo9325/Expence-tracker). The original dashboard screen, theme, layout and backend skeleton are kept as they were. The files they depended on but that were missing from that repo were added around them.

## Project structure

```
trackmyspends/
├── README.md
├── config.json            ports and backend entry point used by entrypoint.sh
├── entrypoint.sh          starts the backend and/or the frontend
├── test_result.md         what was checked, and how
├── backend/
│   ├── .env               MONGO_URL and DB_NAME
│   ├── requirements.txt
│   └── server.py          FastAPI app
├── frontend/
│   ├── .env               EXPO_PUBLIC_BACKEND_URL
│   ├── app/               screens (Expo Router): _layout.tsx, index.tsx
│   ├── assets/images/     app icon, adaptive icon, favicon, splash, brand image
│   ├── src/
│   │   ├── expenses.ts            Expense type, categories, load/save
│   │   ├── theme.ts               design tokens (colors) and makeStyles
│   │   ├── query-client.ts        TanStack Query client
│   │   ├── components/error-boundary.tsx
│   │   └── utils/
│   │       ├── upload.ts          back up expenses to the backend
│   │       └── storage/           AsyncStorage (index.ts) and localStorage (index.web.ts)
│   └── scripts/           cmd-guard.js (yarn-only installs), reset-project.js
├── memory/PRD.md          product requirements and design notes
├── tests/                 backend test package
└── test_reports/          test run reports
```

## Getting started

You need Node.js with Yarn 1.22 (the project is locked to yarn), Python 3.10 or newer, and MongoDB for the backend.

```bash
./entrypoint.sh            # backend on :8001 and Expo on :8081
./entrypoint.sh backend    # backend only
./entrypoint.sh frontend   # frontend only
```

The first run creates `backend/.venv`, installs the Python packages and runs `yarn install`. Press `w` in the Expo terminal to open the web build, or scan the QR code with Expo Go.

The app works without the backend, because expenses are stored on the device. The backend is only needed for backups through `uploadExpenses()` in `frontend/src/utils/upload.ts`.

### Settings

- `backend/.env`: `MONGO_URL` (default `mongodb://localhost:27017`) and `DB_NAME` (default `trackmyspends`).
- `frontend/.env`: `EXPO_PUBLIC_BACKEND_URL` (default `http://localhost:8001`). Use `http://10.0.2.2:8001` on an Android emulator.

## API

| Method | Path | What it does |
| --- | --- | --- |
| GET | `/health` | Health check, no database call |
| GET | `/api/` | Hello message |
| POST, GET | `/api/status` | Status checks (from the original code) |
| POST | `/api/expenses` | Create an expense: `amount`, `category`, optional `note` |
| GET | `/api/expenses?limit=100` | List expenses, newest first |
| DELETE | `/api/expenses/{id}` | Delete one expense (404 if it does not exist) |
| POST | `/api/expenses/bulk` | Insert or update up to 5000 expenses, matched by `id` |

Categories: Groceries, Fuel, Electricity, Eating out, Recharge. Amounts must be above zero.

## Notes

- **`emergentintegrations` in `requirements.txt`.** The file is kept as it was in the original repo, but that package is not on public PyPI and `server.py` does not use it. `entrypoint.sh` skips that one line when installing. If you install by hand, run `grep -v '^emergentintegrations' requirements.txt | pip install -r /dev/stdin`.
- **Yarn only.** `npm install` is blocked on purpose by `scripts/cmd-guard.js`. Set `ALLOW_NON_YARN=1` to skip the check.
- **Not built yet:** Analytics and Settings screens, bottom tabs and dark mode. They are described in `memory/PRD.md`.
