// Web storage. Metro picks this file over index.ts when bundling for the web.
function getStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null; // storage is blocked (for example private browsing)
  }
}

export async function getItem(key: string): Promise<string | null> {
  return getStorage()?.getItem(key) ?? null;
}

export async function setItem(key: string, value: string): Promise<void> {
  getStorage()?.setItem(key, value);
}

export async function removeItem(key: string): Promise<void> {
  getStorage()?.removeItem(key);
}
