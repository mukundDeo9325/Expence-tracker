import type { Expense } from "@/src/expenses";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const CHUNK_SIZE = 1000; // the backend accepts at most 5000 expenses per request

// Backs up local expenses to the backend. Safe to call repeatedly: the backend
// matches on expense id, so existing rows are updated instead of duplicated.
export async function uploadExpenses(expenses: Expense[]): Promise<{ saved: number }> {
  if (!BACKEND_URL) {
    throw new Error("EXPO_PUBLIC_BACKEND_URL is not set. Add it to frontend/.env.");
  }
  const endpoint = `${BACKEND_URL.replace(/\/$/, "")}/api/expenses/bulk`;

  let saved = 0;
  for (let start = 0; start < expenses.length; start += CHUNK_SIZE) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expenses: expenses.slice(start, start + CHUNK_SIZE) }),
    });
    if (!response.ok) {
      throw new Error(`Backup failed (HTTP ${response.status}).`);
    }
    const result: { saved: number } = await response.json();
    saved += result.saved;
  }
  return { saved };
}
