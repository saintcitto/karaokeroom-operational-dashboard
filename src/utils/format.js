export const formatTimer = (ms) => {
  if (!ms || ms <= 0) return "00:00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
};


export const formatTime = (timestamp) => {
  if (!timestamp) return " - ";

  const date = new Date(timestamp);

  if (isNaN(date.getTime())) {
    console.warn("Invalid timestamp passed to formatTime:", timestamp);
    return " - ";
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};
