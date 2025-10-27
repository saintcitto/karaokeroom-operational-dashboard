import { 
  TARIF_HAPPY_HOUR, 
  TARIF_PRIME_TIME, 
  WARNING_TIME_MINUTES 
} from '../data/constants';


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
  
  if (hour === 16 && minute >= 45) return TARIF_PRIME_TIME;
  if (hour >= 17) return TARIF_PRIME_TIME;
  if (hour <= 9) return TARIF_PRIME_TIME;
  
  return TARIF_HAPPY_HOUR;
};

export const getBookingStatus = (endTime, now) => {
  const timeLeftMs = endTime.getTime() - now.getTime();
  const timeLeftMin = timeLeftMs / 60000;

  if (timeLeftMin <= 0) return 'expired';
  if (timeLeftMin <= WARNING_TIME_MINUTES) return 'warning';
  return 'normal';
};

