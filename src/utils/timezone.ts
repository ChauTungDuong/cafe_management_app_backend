// Timezone helper for UTC+7 (Asia/Bangkok)
export function parseDateAsUTC7(input?: string | Date | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;

  // If the input is a date-only string like YYYY-MM-DD, treat it as midnight in UTC+7
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T00:00:00+07:00`);
  }

  // Accept US-style dates like MM/DD/YYYY (e.g., 12/31/2025)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
    const parts = input.split('/').map((p) => parseInt(p, 10));
    const month = parts[0];
    const day = parts[1];
    const year = parts[2];
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return new Date(`${year}-${mm}-${dd}T00:00:00+07:00`);
  }

  // Parse other formats normally
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? null : parsed;
}
