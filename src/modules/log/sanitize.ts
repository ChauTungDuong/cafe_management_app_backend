const SENSITIVE_KEYS = new Set([
  'password',
  'refreshToken',
  'accessToken',
  'token',
  'authorization',
  'Authorization',
]);

export function sanitizeForLog(input: any, depth = 0): any {
  if (input === null || input === undefined) return input;
  if (depth > 6) return '[Truncated]';

  if (typeof input === 'string') {
    return input.length > 1000 ? input.slice(0, 1000) + '…' : input;
  }

  if (typeof input === 'number' || typeof input === 'boolean') return input;

  if (Array.isArray(input)) {
    const sliced = input.slice(0, 50);
    return sliced.map((v) => sanitizeForLog(v, depth + 1));
  }

  if (typeof input === 'object') {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      if (SENSITIVE_KEYS.has(key)) {
        out[key] = '[REDACTED]';
        continue;
      }
      out[key] = sanitizeForLog(value, depth + 1);
    }
    return out;
  }

  return String(input);
}
