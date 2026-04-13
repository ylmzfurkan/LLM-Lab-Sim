export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export async function withDemoFallback<T>(
  apiCall: () => Promise<T>,
  fallback: T | (() => T)
): Promise<T> {
  try {
    return await apiCall();
  } catch (err) {
    if (isDemoMode()) {
      return typeof fallback === "function" ? (fallback as () => T)() : fallback;
    }
    throw err;
  }
}
