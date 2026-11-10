# TrackMySpends: Product Requirements

Last updated: 2026-11-10

## Goal

A calm personal finance companion for logging everyday spending in two taps and seeing at a glance how much of the monthly budget is left.

## Principles

- **Offline first, no login.** Expenses are saved on the device (AsyncStorage on mobile, localStorage on web). The backend is optional.
- **Simple English** everywhere in the UI.
- **Indian rupees.** Amounts are shown as ₹ with Indian digit grouping (en-IN).
- **Accessible.** Touch targets of at least 44x44pt and WCAG AA contrast.

## Implemented

**Dashboard** (`frontend/app/index.tsx`)
- Header with app title and current month badge.
- Monthly budget card: ₹15,000 limit, amount spent, amount left, percent used with a progress bar. The limit is a constant (`BUDGET`) in the screen file.
- Summary cards for Today and This month.
- Spending by category: one bar per category for the current month.
- Recent expenses: latest 8 with category icon, note or date, amount and a delete button.
- Loading spinner and empty states with an "Add your first expense" action.

**Add expense** (bottom sheet opened from the + button)
- Amount, category chips (Groceries, Fuel, Electricity, Eating out, Recharge) and an optional note.
- Inline error when the amount is missing or not above zero.

**Storage** (`frontend/src/expenses.ts`, `frontend/src/utils/storage/`)
- Expenses saved under the key `trackmyspends:expenses:v1`. Corrupt or invalid saved data is ignored instead of crashing the app.

**Backend** (`backend/server.py`, FastAPI + MongoDB)
- `GET /health`, `GET /api/`, `POST/GET /api/status`.
- `POST /api/expenses`, `GET /api/expenses`, `DELETE /api/expenses/{id}`, `POST /api/expenses/bulk` (upsert by id, used for backups).
- `frontend/src/utils/upload.ts` has an `uploadExpenses()` helper for the bulk endpoint. It is not connected to any screen yet.

## Design system

Taken from the original `design_guidelines.json` ("iOS-native clean").

- **Brand:** green. `brand #38A169`, `brandPrimary #2F855A`, `brandSecondary #48BB78`, `brandTertiary #E6FFFA`. Surfaces `#F8F9FA`, `#FFFFFF`, `#E9ECEF`.
- **Banned colors:** indigo, violet, purple, navy.
- **Tokens** live only in `frontend/src/theme.ts`. Components use `makeStyles` and `useTheme`, never color literals.
- **Icons:** Ionicons.
- **Radius:** 6, 12, 20, pill. **Spacing:** 4, 8, 12, 16, 24, 32, 48.
- **Typography:** Plus Jakarta Sans (Medium for display, Regular for text), sizes 12, 14, 16, 20, 24.

## Not built yet

These are in the original design guidelines but not in the original code:

- Analytics screen: category percentages and month-to-month comparison.
- Settings screen: editable monthly budget (default ₹15,000), export and import of data, storage stats.
- Bottom tab navigation (Dashboard, Analytics, Settings).
- Frosted glass header and sticky bar.
- Haptic feedback on save.
- Loading the Plus Jakarta Sans font.
- Dark theme (only the light palette exists in `theme.ts`).
- A screen that calls `uploadExpenses()`.
