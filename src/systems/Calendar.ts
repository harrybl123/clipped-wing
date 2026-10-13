/** The days, in order. The prologue comes before day 1. Chapter 1 is a week; Chapter 2 runs on past it (its Part 3 and on). */
export const DAYS = ['prologue', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
export type Day = (typeof DAYS)[number];

export const TIME_SLOTS = ['morning', 'afternoon', 'evening', 'night'] as const;
export type TimeSlot = (typeof TIME_SLOTS)[number];

/** Afternoon visits allowed per day. Day 1 is unlimited. */
export const AFTERNOON_ACTIONS_PER_DAY = 2;
export const UNLIMITED_AFTERNOON_DAYS: readonly Day[] = [1];

export interface CalendarState {
  day: Day;
  slot: TimeSlot;
  afternoonActionsUsed: number;
}

/**
 * The game clock: which day and time slot it is, and how many afternoon actions are left.
 * Knows nothing about what happens on each day.
 */
export class Calendar {
  private _day: Day;
  private _slot: TimeSlot;
  private _afternoonActionsUsed: number;

  constructor(state: CalendarState = { day: 'prologue', slot: 'morning', afternoonActionsUsed: 0 }) {
    this._day = state.day;
    this._slot = state.slot;
    this._afternoonActionsUsed = state.afternoonActionsUsed;
  }

  get day(): Day {
    return this._day;
  }

  get slot(): TimeSlot {
    return this._slot;
  }

  /** True at the last slot of the last day; advance() does nothing then. */
  get isLastSlot(): boolean {
    return this._day === DAYS[DAYS.length - 1] && this._slot === TIME_SLOTS[TIME_SLOTS.length - 1];
  }

  /** Afternoon actions allowed today (Infinity when unlimited). */
  get afternoonActionLimit(): number {
    return UNLIMITED_AFTERNOON_DAYS.includes(this._day) ? Infinity : AFTERNOON_ACTIONS_PER_DAY;
  }

  get afternoonActionsLeft(): number {
    return Math.max(0, this.afternoonActionLimit - this._afternoonActionsUsed);
  }

  canTakeAfternoonAction(): boolean {
    return this._slot === 'afternoon' && this.afternoonActionsLeft > 0;
  }

  /** Uses up one afternoon action. Returns false (and changes nothing) if none can be taken. */
  takeAfternoonAction(): boolean {
    if (!this.canTakeAfternoonAction()) return false;
    this._afternoonActionsUsed += 1;
    return true;
  }

  /**
   * Moves to the next time slot; after night, to the next day's morning.
   * Returns false (and changes nothing) at the very end of the week.
   */
  advance(): boolean {
    if (this.isLastSlot) return false;
    const slotIndex = TIME_SLOTS.indexOf(this._slot);
    if (slotIndex < TIME_SLOTS.length - 1) {
      this._slot = TIME_SLOTS[slotIndex + 1]!;
    } else {
      this._day = DAYS[DAYS.indexOf(this._day) + 1]!;
      this._slot = TIME_SLOTS[0];
      this._afternoonActionsUsed = 0;
    }
    return true;
  }

  /** Moves on to `slot` later today (e.g. when the story moves the day on). Does nothing if it's already that late. */
  advanceTo(slot: TimeSlot): void {
    if (TIME_SLOTS.indexOf(slot) > TIME_SLOTS.indexOf(this._slot)) this._slot = slot;
  }

  /** Jumps to the morning of `day` with no afternoon actions used (e.g. the prologue ending and Day 1 starting). */
  jumpTo(day: Day): void {
    this._day = day;
    this._slot = TIME_SLOTS[0];
    this._afternoonActionsUsed = 0;
  }

  toJSON(): CalendarState {
    return { day: this._day, slot: this._slot, afternoonActionsUsed: this._afternoonActionsUsed };
  }

  /** Rebuilds a calendar from saved data. Throws if the data isn't a valid CalendarState. */
  static fromJSON(data: unknown): Calendar {
    const d = data as Partial<Record<keyof CalendarState, unknown>> | null;
    if (
      !d ||
      typeof d !== 'object' ||
      !DAYS.includes(d.day as Day) ||
      !TIME_SLOTS.includes(d.slot as TimeSlot) ||
      !Number.isInteger(d.afternoonActionsUsed) ||
      (d.afternoonActionsUsed as number) < 0
    ) {
      throw new Error(`Calendar: invalid saved state ${JSON.stringify(data)}`);
    }
    return new Calendar(d as CalendarState);
  }
}
