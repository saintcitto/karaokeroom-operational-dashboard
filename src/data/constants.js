// ==============================
// KTV SYSTEM GLOBAL CONSTANTS
// ==============================

// --- Room & Capacity ---
export const ROOM_NAMES = [
  "KTV 1",
  "KTV 2",
  "KTV 3",
  "KTV 4",
  "KTV 5",
  "KTV 8",
  "KTV 9",
  "KTV 10",
  "KTV 11",
  "KTV 12",
];

// --- Time Settings ---
export const DURATION_MINUTES = [30, 60, 90, 120, 150, 180];
export const WARNING_TIME_MINUTES = 10; // waktu warning (menit sebelum habis)
export const MODAL_TIMEOUT = 60000; // expired modal auto-close (ms)

// --- Tariff & Pricing ---
export const TARIF_HAPPY_HOUR = 45000; // 10:00–16:44
export const TARIF_PRIME_TIME = 60000; // 16:45–00:00
export const RATE_UNIT_MINUTES = 60; // per jam

// --- Capacity Rules ---
export const MAX_PEOPLE_PER_ROOM = 10;
export const OVER_CAPACITY_CHARGE = 5000; // per orang di atas batas

// --- Promotions ---
export const PROMOTIONS = {
  120: { bonus: 30, note: "Gratis 30 menit" },
  180: { bonus: 60, note: "Gratis 1 jam" },
};

// --- UI Colors (optional use for consistency) ---
export const STATUS_COLORS = {
  normal: "green",
  warning: "yellow",
  expired: "red",
};

// --- Export group (for easier import elsewhere) ---
export default {
  ROOM_NAMES,
  DURATION_MINUTES,
  WARNING_TIME_MINUTES,
  MODAL_TIMEOUT,
  TARIF_HAPPY_HOUR,
  TARIF_PRIME_TIME,
  RATE_UNIT_MINUTES,
  MAX_PEOPLE_PER_ROOM,
  OVER_CAPACITY_CHARGE,
  PROMOTIONS,
  STATUS_COLORS,
};
