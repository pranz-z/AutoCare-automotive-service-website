export class ValidationError extends Error {}

export function badRequest(error: string) {
  return Response.json({ ok: false, error }, { status: 400 });
}

export async function readJson(request: Request, maxBytes = 16_384): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes) throw new ValidationError("Request is too large.");
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) throw new ValidationError("Request is too large.");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new ValidationError("Request body must be valid JSON.");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }
  return body as Record<string, unknown>;
}

export function reqStr(body: Record<string, unknown>, key: string, max = 200): string {
  const value = body[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`${key} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) throw new ValidationError(`${key} is too long.`);
  return trimmed;
}

export function optStr(body: Record<string, unknown>, key: string, max = 200): string {
  const value = body[key];
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new ValidationError(`${key} must be a string.`);
  const trimmed = value.trim();
  if (trimmed.length > max) throw new ValidationError(`${key} is too long.`);
  return trimmed;
}

export function reqEmail(body: Record<string, unknown>, key: string): string {
  const value = reqStr(body, key, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new ValidationError(`${key} must be a valid email address.`);
  }
  return value;
}

export function reqPhone(body: Record<string, unknown>, key: string): string {
  const value = reqStr(body, key, 32);
  if (!/^[0-9+\s()-]{7,}$/.test(value)) {
    throw new ValidationError(`${key} must be a valid phone number.`);
  }
  return value;
}

export function optPhone(body: Record<string, unknown>, key: string): string {
  const value = optStr(body, key, 32);
  if (value && !/^[0-9+\s()-]{7,}$/.test(value)) {
    throw new ValidationError(`${key} must be a valid phone number.`);
  }
  return value;
}

export function oneOf(value: string, allowed: readonly string[], key: string): string {
  if (!allowed.includes(value)) throw new ValidationError(`${key} is not a valid option.`);
  return value;
}

export function reqDate(body: Record<string, unknown>, key: string): string {
  const value = reqStr(body, key, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError(`${key} must be a YYYY-MM-DD date.`);
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new ValidationError(`${key} must be a valid date.`);
  }
  return value;
}
