export type StatsKey = string | number;

/**
 * @typedef {Object} StatsEntry
 * @property {number} attempts - Number of attempts for this variation.
 * @property {number} successes - Number of successful attempts for this variation.
 */
export interface StatsEntry {
  attempts: number;
  successes: number;
}