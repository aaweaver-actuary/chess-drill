import { StatsKey, StatsEntry } from "@/types/StatsStore";


/**
 * StatsStore tracks attempts and successes keyed by variation.
 */
export class StatsStore {
  private store: Record<string, StatsEntry>;
  constructor() {
    /** @private @type {Record<StatsKey, StatsEntry>} */
    this.store = {};
  }

  /**
   * Record a drill result.
   * @param {StatsKey} key - Unique variation key (e.g. SAN sequence).
   * @param {boolean} success - Whether the attempt was correct.
   */
  recordResult(key: StatsKey, success: boolean): void {
    const prev = this.store[key] ?? { attempts: 0, successes: 0 };
    this.store[key] = {
      attempts: prev.attempts + 1,
      successes: prev.successes + (success ? 1 : 0),
    };
  }

  /**
   * Get stats for a variation.
   * @param {StatsKey} key
   * @returns {{attempts:number,successes:number}}
   */
  getStats(key: StatsKey): StatsEntry {
    return this.store[key] || { attempts: 0, successes: 0 };
  }
}