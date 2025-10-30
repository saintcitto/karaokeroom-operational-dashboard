import {
  TARIF_HAPPY_HOUR,
  TARIF_PRIME_TIME,
  WARNING_TIME_MINUTES,
  MAX_PEOPLE_PER_ROOM,
  OVER_CAPACITY_CHARGE,
  PROMOTIONS,
  RATE_UNIT_MINUTES,
} from "../data/constants";

// ==============================
// FORMATTERS
// ==============================

export const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

export const formatTime = (date) => {
  if (!(date instanceof Date)) {
    console.warn("⚠️ formatTime menerima non-Date:", date);
    return "Invalid Time";
  }
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const formatTimeForInput = (date) => {
  if (!(date instanceof Date)) return "00:00";
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

export const formatDuration = (minutes = 0) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}j ${m}m`;
};

// ==============================
// TARIFF LOGIC
// ==============================

export const getTariffByTime = (startTime) => {
  if (!(startTime instanceof Date)) return TARIF_HAPPY_HOUR;

  const totalMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const pagiMulai = 10 * 60; // 10:00
  const soreMulai = 16 * 60 + 45; // 16:45

  return totalMinutes >= pagiMulai && totalMinutes < soreMulai
    ? TARIF_HAPPY_HOUR
    : TARIF_PRIME_TIME;
};

// ==============================
// PROMO + TARIF CALCULATION
// ==============================

export const calculateTotalPriceWithPromo = (
  startTime,
  durationMinutes = 0,
  people = 1
) => {
  const tarif = getTariffByTime(startTime);
  const durationHours = durationMinutes / RATE_UNIT_MINUTES;

  // Cek promo applicable
  let freeMinutes = 0;
  let bayarJam = durationHours;
  let promoNote = "-";
  if (PROMOTIONS[durationMinutes]) {
    freeMinutes = PROMOTIONS[durationMinutes].bonus;
    promoNote = PROMOTIONS[durationMinutes].note;
  }

  const hargaWaktu = tarif * bayarJam;

  // Tambahan biaya bila over capacity
  const overCount = Math.max(0, people - MAX_PEOPLE_PER_ROOM);
  const biayaTambahan = overCount * OVER_CAPACITY_CHARGE;

  const total = hargaWaktu + biayaTambahan;

  return {
    tarif,
    durationHours,
    freeMinutes,
    bayarJam,
    hargaWaktu,
    biayaTambahan,
    total,
    promoNote,
  };
};

// ==============================
// STATUS CHECKER
// ==============================

export const getBookingStatus = (endTime, now = new Date()) => {
  if (!(endTime instanceof Date)) return "unknown";
  const diffMin = (endTime - now) / 60000;
  if (diffMin <= 0) return "expired";
  if (diffMin <= WARNING_TIME_MINUTES) return "warning";
  return "normal";
};

// ==============================
// GENERAL UTILITIES
// ==============================

export const parseDateSafe = (val) => {
  try {
    return val instanceof Date ? val : new Date(val);
  } catch {
    return new Date();
  }
};
