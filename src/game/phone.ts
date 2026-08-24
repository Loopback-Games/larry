/** Numbers the player can dial from the payphone outside the store. */
export const HOTLINE = '555-6969';
/** Scratched into the casing of the payphone; a joke, and worth points. */
export const SCRATCHED = '555-0100';
/** Given out over the phone once you answer a call. */
export const DELIVERY = '555-8039';

/**
 * Pull a dialled number out of raw input.
 *
 * The parser works on words, and phone numbers are not words, so dialling is
 * matched against the raw line and normalised to a bare digit string.
 */
export function dialledNumber(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, '');
  return digits.length >= 7 ? digits : null;
}

export function isNumber(raw: string, target: string): boolean {
  const dialled = dialledNumber(raw);
  return dialled !== null && dialled === target.replace(/[^0-9]/g, '');
}
