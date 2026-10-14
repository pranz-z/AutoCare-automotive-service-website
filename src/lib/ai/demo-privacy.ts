export const DEMO_PRIVACY_NOTICE = "Demo AI: use synthetic vehicle scenarios only. Do not enter real names, contact details, VINs, license plates, booking details, or confidential information.";
export const DEMO_PRIVACY_ERROR = "This demo cannot send contact or vehicle identifiers to AI. Remove personal details and try a synthetic example, or continue without AI.";

export function containsPersonalData(text: string) {
  return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:\+?63|0)9\d{9}\b|\b(?:VIN|vehicle identification number|plate(?: number)?|license plate|registration number|booking (?:id|number|reference)|appointment (?:id|number|reference)|phone(?: number)?|email address|my address)\s*[:#-]?\s*\S+/i.test(text) ||
    /\b[A-HJ-NPR-Z0-9]{17}\b/i.test(text) ||
    // PH-style plate pattern is intentionally case-sensitive so ordinary
    // words like "the 2024" or "for 2020" are not flagged.
    /\b[A-Z]{3}[ -]?\d{3,4}\b/.test(text);
}
