/**
 * Chart Formatting Utilities
 *
 * Provides intelligent formatting for chart labels, numbers, and dates
 */

/**
 * Format a number for display (with commas, abbreviations, etc.)
 */
export function formatNumber(value: number, format?: 'compact' | 'precise' | 'percentage'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  switch (format) {
    case 'compact':
      // Abbreviate large numbers (1.2M, 3.4K, etc.)
      if (Math.abs(value) >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
      }
      if (Math.abs(value) >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
      }
      return value.toFixed(0);

    case 'percentage':
      return `${value.toFixed(1)}%`;

    case 'precise':
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });

    default:
      // Default: show with commas, no decimals for integers
      if (Number.isInteger(value)) {
        return value.toLocaleString();
      }
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}

/**
 * Format a date value for display
 */
export function formatDate(value: string | Date): string {
  try {
    const date = typeof value === 'string' ? new Date(value) : value;

    if (isNaN(date.getTime())) {
      return String(value);
    }

    // Check if it's just a year (YYYY)
    if (typeof value === 'string' && /^\d{4}$/.test(value)) {
      return value;
    }

    // Check if it's a year-month (YYYY-MM)
    if (typeof value === 'string' && /^\d{4}-\d{2}$/.test(value)) {
      const [year, month] = value.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }

    // Check if it's a full date (YYYY-MM-DD)
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }

    // Default: format as short date
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return String(value);
  }
}

/**
 * Intelligently format a label based on its value
 */
export function formatLabel(value: any): string {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return 'N/A';
  }

  // Handle numbers
  if (typeof value === 'number') {
    return formatNumber(value);
  }

  // Handle dates
  if (value instanceof Date) {
    return formatDate(value);
  }

  // Handle strings that might be dates
  if (typeof value === 'string') {
    // Try to detect date strings
    if (/^\d{4}(-\d{2})?(-\d{2})?$/.test(value)) {
      return formatDate(value);
    }

    // Truncate very long labels
    if (value.length > 25) {
      return value.substring(0, 22) + '...';
    }
  }

  // Default: convert to string
  return String(value);
}

/**
 * Format axis labels with rotation for long labels
 */
export function getAxisLabelProps(labels: any[]): {
  angle: number;
  textAnchor: 'start' | 'middle' | 'end';
  height: number;
} {
  // Calculate average label length
  const avgLength = labels.reduce((sum, label) => sum + String(label).length, 0) / labels.length;

  // Determine rotation based on label length and count
  if (labels.length > 10 || avgLength > 15) {
    return {
      angle: -45,
      textAnchor: 'end',
      height: 80, // Extra height for rotated labels
    };
  }

  if (avgLength > 10) {
    return {
      angle: -30,
      textAnchor: 'end',
      height: 60,
    };
  }

  return {
    angle: 0,
    textAnchor: 'middle',
    height: 40,
  };
}

/**
 * Custom label formatter for tooltips
 */
export function formatTooltipValue(value: number, name: string, format?: string): [string, string] {
  const formattedValue = formatNumber(value, 'precise');
  return [formattedValue, name];
}
