// Preference: after discarding an in-progress match, go back home instead of
// staying on the setup screen. Stored locally (per device), like reduceEffects.
const DISCARD_GOES_HOME_KEY = "bgt_discard_goes_home";

export function readDiscardGoesHome(): boolean {
  try {
    return localStorage.getItem(DISCARD_GOES_HOME_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeDiscardGoesHome(value: boolean): void {
  try {
    localStorage.setItem(DISCARD_GOES_HOME_KEY, value ? "1" : "0");
  } catch {
    // Ignore storage failures when storage is unavailable.
  }
}
