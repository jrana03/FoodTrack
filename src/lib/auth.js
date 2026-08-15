// ── Frontend auth guard ───────────────────────────────────────────────────────
// This is "soft" protection — the password ends up in the JS bundle, so it
// isn't suitable for truly sensitive data. For a personal journal shared with
// family/friends it's perfectly fine.
//
// Storage strategy:
//   "Remember 30 days" → localStorage key with an expiry timestamp
//   Session only        → sessionStorage flag (cleared when tab closes)
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'foodtrack_auth_until'    // localStorage  — expiry ms timestamp
const SS_KEY = 'foodtrack_auth_session'  // sessionStorage — session-only flag

const PASSWORD = import.meta.env.VITE_EDIT_PASSWORD ?? ''

/** True if the user is currently authenticated (persistent or session). */
export function isAuthenticated() {
  // 1. Session-only flag (cleared automatically when the tab closes)
  if (sessionStorage.getItem(SS_KEY) === '1') return true

  // 2. Persistent 30-day token
  const until = localStorage.getItem(LS_KEY)
  if (until && Date.now() < Number(until)) return true

  // Clean up an expired persistent token
  if (until) localStorage.removeItem(LS_KEY)
  return false
}

/** Returns true if the supplied password matches. */
export function checkPassword(input) {
  return input === PASSWORD
}

/**
 * Persist authentication after a successful password entry.
 * @param {boolean} remember  true → localStorage for 30 days; false → sessionStorage only
 */
export function storeAuth(remember) {
  if (remember) {
    localStorage.setItem(LS_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000))
    sessionStorage.removeItem(SS_KEY)
  } else {
    sessionStorage.setItem(SS_KEY, '1')
  }
}

/** Sign out — clears both storage locations. */
export function clearAuth() {
  localStorage.removeItem(LS_KEY)
  sessionStorage.removeItem(SS_KEY)
}
