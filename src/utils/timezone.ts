// Timezone helper for UTC+7 (Asia/Bangkok)
export function parseDateAsUTC7(input?: string | Date | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;

  // If the input is a date-only string like YYYY-MM-DD, treat it as midnight in UTC+7
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T00:00:00+07:00`);
  }

  // Accept DD/MM/YYYY format (e.g., 20/11/2025)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
    const parts = input.split('/').map((p) => parseInt(p, 10));
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return new Date(`${year}-${mm}-${dd}T00:00:00+07:00`);
  }

  // Parse other formats normally
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parse date string in DD/MM/YYYY format or other common formats
 * Returns Date object or null if invalid
 */
export function parseFlexibleDate(input?: string | Date | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;

  // DD/MM/YYYY format (e.g., 20/11/2025)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
    const parts = input.split('/').map((p) => parseInt(p, 10));
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return new Date(`${year}-${mm}-${dd}T00:00:00+07:00`);
  }

  // YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T00:00:00+07:00`);
  }

  // Try to parse other formats
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? null : parsed;
}
