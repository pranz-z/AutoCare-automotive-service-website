import type { JsonSchema } from "./types";

/**
 * Minimal JSON-schema validation for tool arguments — covers the primitive
 * shapes the tools actually declare (object, string, number, boolean, enum,
 * required, maxLength). Returns an error string or null.
 */
export function validateArgs(schema: JsonSchema, args: unknown): string | null {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return "Arguments must be a JSON object.";
  }
  const record = args as Record<string, unknown>;
  const properties = schema.properties ?? {};

  for (const key of schema.required ?? []) {
    const value = record[key];
    if (value === undefined || value === null || (typeof value === "string" && !value.trim())) {
      return `Missing required argument: ${key}`;
    }
  }

  for (const [key, value] of Object.entries(record)) {
    const prop = properties[key];
    if (!prop) return `Unknown argument: ${key}`;
    if (value === undefined || value === null) continue;
    if (prop.type === "string" && typeof value !== "string") return `Argument ${key} must be a string.`;
    if (prop.type === "number" && typeof value !== "number") return `Argument ${key} must be a number.`;
    if (prop.type === "integer" && (typeof value !== "number" || !Number.isInteger(value))) return `Argument ${key} must be an integer.`;
    if (prop.type === "boolean" && typeof value !== "boolean") return `Argument ${key} must be a boolean.`;
    if (prop.type === "array" && !Array.isArray(value)) return `Argument ${key} must be an array.`;
    if (typeof value === "string" && prop.maxLength && value.length > prop.maxLength) {
      return `Argument ${key} is too long.`;
    }
    if (prop.enum && typeof value === "string" && !prop.enum.includes(value)) {
      return `Argument ${key} must be one of: ${prop.enum.join(", ")}.`;
    }
  }
  return null;
}
