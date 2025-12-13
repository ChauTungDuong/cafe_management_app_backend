// Timezone helper for UTC+7 (Asia/Bangkok)
export function parseDateAsUTC7(input?: string | Date | null): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;

  // For date-only strings (YYYY-MM-DD), treat as midnight UTC+7
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T00:00:00+07:00`);
  }

  // Parse other formats normally
  const parsed = new Date(input);
  return isNaN(parsed.getTime()) ? null : parsed;
}
