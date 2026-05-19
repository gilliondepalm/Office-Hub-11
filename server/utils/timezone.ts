export const CURACAO_TZ = "America/Curacao";

/**
 * Returns today's date in the Curaçao timezone as "yyyy-MM-dd".
 * Use this instead of new Date().toISOString().split("T")[0] (which is UTC-based).
 */
export function todayCuracaoStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: CURACAO_TZ });
}

/**
 * Returns any Date's date portion in the Curaçao timezone as "yyyy-MM-dd".
 */
export function toCuracaoDateStr(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: CURACAO_TZ });
}
