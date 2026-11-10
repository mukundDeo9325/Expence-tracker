import { getItem, setItem } from "@/src/utils/storage";

export const CATEGORIES = ["Groceries", "Fuel", "Electricity", "Eating out", "Recharge"] as const;

export type Category = (typeof CATEGORIES)[number];

export type Expense = {
  id: string;
  amount: number;
  category: Category;
  note: string;
  createdAt: string; // ISO 8601 date string
};

const STORAGE_KEY = "trackmyspends:expenses:v1";

function isExpense(value: unknown): value is Expense {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.amount === "number" &&
    Number.isFinite(item.amount) &&
    item.amount > 0 &&
    typeof item.category === "string" &&
    (CATEGORIES as readonly string[]).includes(item.category) &&
    typeof item.note === "string" &&
    typeof item.createdAt === "string" &&
    !Number.isNaN(Date.parse(item.createdAt))
  );
}

// Reads saved expenses. Missing, corrupt or unexpected data gives an empty list
// instead of crashing the app, and invalid rows are skipped.
export async function loadExpenses(): Promise<Expense[]> {
  try {
    const raw = await getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isExpense) : [];
  } catch {
    return [];
  }
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  await setItem(STORAGE_KEY, JSON.stringify(expenses));
}
