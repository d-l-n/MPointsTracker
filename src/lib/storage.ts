const STORAGE_KEY = "bgt_v6";

type StorageShape = Record<string, unknown>;

function load(): StorageShape {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || {};
  } catch {
    return {};
  }
}

function persist(data: StorageShape): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("[persist] localStorage write failed:", error);
    return false;
  }
  return true;
}

function mkId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function haptic(type: "light" | "medium" | "strong" = "light"): void {
  try {
    if (localStorage.getItem("bgt_haptic") === "0") return;
  } catch {
    return;
  }
  if (!navigator.vibrate) return;
  if (type === "light") navigator.vibrate(8);
  if (type === "medium") navigator.vibrate(18);
  if (type === "strong") navigator.vibrate([12, 40, 12]);
}

const APP_VERSION = __APP_VERSION__;
const ADMIN_UID = "5UpEw50cQXcNnZQS4i7AaDQzY7J2";

export { load, persist, mkId, haptic, APP_VERSION, ADMIN_UID, STORAGE_KEY };
