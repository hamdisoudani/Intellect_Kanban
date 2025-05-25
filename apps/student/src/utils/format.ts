/**
 * Formats minutes into hours and minutes string
 * e.g. 90 => "1h 30m", 45 => "45m", 120 => "2h"
 */
export function formatMinutesToTime(minutes: number): string {
  if (!minutes || minutes <= 0) {
    return '0m';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
} 