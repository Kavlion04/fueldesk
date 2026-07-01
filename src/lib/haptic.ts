// Lightweight haptic feedback helper.
// Uses Vibration API on Android/Chrome. Silently no-ops on unsupported devices (iOS Safari).

type Pattern = "tap" | "success" | "warn" | "error" | "select";

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  select: 12,
  success: [10, 40, 20],
  warn: [20, 60, 20],
  error: [40, 30, 40, 30, 60],
};

let enabled = true;

export function setHapticEnabled(v: boolean) {
  enabled = v;
  try {
    localStorage.setItem("fueldesk:haptic", JSON.stringify(v));
  } catch {}
}

export function initHaptic() {
  try {
    const raw = localStorage.getItem("fueldesk:haptic");
    if (raw != null) enabled = JSON.parse(raw);
  } catch {}
}

export function haptic(pattern: Pattern = "tap") {
  if (!enabled) return;
  if (typeof window === "undefined") return;
  const nav = window.navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate !== "function") return;
  try {
    nav.vibrate(PATTERNS[pattern]);
  } catch {}
}
