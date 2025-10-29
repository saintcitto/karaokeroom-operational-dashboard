import { 
  TARIF_HAPPY_HOUR, 
  TARIF_PRIME_TIME, 
  WARNING_TIME_MINUTES 
} from '../data/constants';

export const TARIF_PAGI = 45000;
export const TARIF_MALAM = 60000;
export const EXTRA_ROOM_CHARGE = 5000;
export const FREE_PROMO_MINUTES = 30;

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const formatTime = (date) => {
  if (!date || typeof date.toLocaleTimeString !== 'function') {
    console.error("formatTime menerima nilai non-Date:", date);
    return "Invalid Time";
  }
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const formatTimeForInput = (date) => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const formatDuration = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}j ${minutes}m`;
};

export const calculateTarif = (startTime) => {
  const hour = startTime.getHours();
  const minute = startTime.getMinutes();

  const pagiMulai = 10 * 60;       // 10:00
  const soreMulai = 16 * 60 + 45;  // 16:45
  const totalMenit = hour * 60 + minute;

  if (totalMenit >= pagiMulai && totalMenit <= soreMulai - 1) {
    return TARIF_PAGI;
  } else {
    return TARIF_MALAM;
  }
};

export const calculateTotalPriceWithPromo = (startTime, durationMinutes, people) => {
  const tarif = calculateTarif(startTime);
  const durasiTagih = Math.max(0, durationMinutes - FREE_PROMO_MINUTES);
  const hargaWaktu = (tarif / 60) * durasiTagih;
  const biayaTambahan = people > 10 ? EXTRA_ROOM_CHARGE : 0;
  const total = Math.round(hargaWaktu + biayaTambahan);

  return {
    tarif,
    durasiTagih,
    hargaWaktu,
    biayaTambahan,
    total
  };
};

export const getBookingStatus = (endTime, now) => {
  const timeLeftMs = endTime.getTime() - now.getTime();
  const timeLeftMin = timeLeftMs / 60000;

  if (timeLeftMin <= 0) return 'expired';
  if (timeLeftMin <= WARNING_TIME_MINUTES) return 'warning';
  return 'normal';
};
