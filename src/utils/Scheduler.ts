import { fsrs, generatorParameters, createEmptyCard, Rating } from 'ts-fsrs';

enum State {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

interface Card {
    difficulty: number;
    due: Date;
    elapsed_days: number;
    lapses: number;
    last_review?: Date;
    reps: number;
    scheduled_days: number;
    stability: number;
    state: State;
}

/**
 * Scheduler wraps ts-fsrs to compute next review intervals.
 */
export class Scheduler {
  scheduler: any;
  constructor() {
    const params = generatorParameters({ enable_fuzz: true });
    /** @private */
    this.scheduler = fsrs(params);
  }

  /**
   * Create a new card state at a given date.
   * @param {Date} date 
   * @returns {Card} FSRS card.
   */
  createCard(date: Date = new Date()): Card {
    return createEmptyCard(date);
  }

  /**
   * Given a card and a quality rating, compute next intervals.
   * @param {Card} card - FSRS card.
   * @param {Rating} quality - Recall quality (0=Forgot,4=Mastered).
   * @returns {Card[]} Next scheduled card states.
   */
  schedule(card: Card, quality: Rating): Card[] {
    return this.scheduler.repeat(card, new Date(), quality);
  }
}