export function formatPrice(amount: number) {
  const formatted = amount.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `KSH\u00A0${formatted}`;
}

export function isInStock(price: number) {
  return price > 0;
}

function to12Hour(value: string) {
  const [hourPart, minutePart] = value.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatHours(open: string, close: string) {
  if (open === "00:00" && close === "00:00") return "Closed";
  return `${to12Hour(open)} - ${to12Hour(close)}`;
}

export function mapsDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function mapsEmbedUrl(lat: number, lng: number) {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
}
