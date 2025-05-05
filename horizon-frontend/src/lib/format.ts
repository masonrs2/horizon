import { formatDistanceToNowStrict, format as formatDate } from 'date-fns';

/**
 * Format a number for display (e.g., 1000 -> 1K)
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '0';
  
  if (num === 0) return '0';
  
  if (num < 1000) return num.toString();
  
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  
  return `${(num / 1000000).toFixed(1)}M`;
}

/**
 * Format a date relative to now (e.g., "2h", "3d")
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    const formatted = formatDistanceToNowStrict(dateObj, {
      addSuffix: false,
      roundingMethod: 'floor'
    });
    
    // Simplify the format (e.g., "2 hours" -> "2h")
    return formatted
      .replace(' seconds', 's')
      .replace(' minutes', 'm')
      .replace(' hours', 'h')
      .replace(' days', 'd')
      .replace(' months', 'mo')
      .replace(' years', 'y');
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Format a full date (e.g., "Apr 15, 2024")
 */
export function formatFullDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  try {
    return formatDate(dateObj, 'MMM d, yyyy');
  } catch (error) {
    console.error('Error formatting full date:', error);
    return '';
  }
}

/**
 * Safely get display name initials
 */
export function getInitials(displayName: string | null | undefined): string {
  if (!displayName) return '';
  
  const names = displayName.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.slice(0, maxLength)}...`;
} 