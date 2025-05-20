/**
 * Utility function to format time in seconds to a readable string
 * @param seconds - Time in seconds
 * @returns Formatted time string (MM:SS or HH:MM:SS)
 */
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return '0:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};
