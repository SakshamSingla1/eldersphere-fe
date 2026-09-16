// Tiny localStorage-backed "has this milestone already been celebrated" gates for the
// three genuine milestones the app celebrates (see hooks/useCelebration.ts): a family's
// first-ever successful booking, a caretaker finishing their Getting Started checklist,
// and a caretaker's verification status flipping to VERIFIED. Each helper both answers
// "should this fire right now" and persists the fact that it just did, in one call, so
// call sites never need a separate read-then-write step (and can't accidentally double-
// celebrate by forgetting the write half).
//
// Keyed by user id (not just a global flag) since the same browser can be signed into
// different demo accounts across sessions, and each account's milestones are independent.

const keyFor = (milestone: string, userId: number | string): string => `es_celebrated_${milestone}_${userId}`;

// Returns true the first time it's called for this user (and marks it done for every
// subsequent call). Used for both the "first booking" and "checklist complete" milestones,
// which are both simple one-shot flags.
const consumeOnce = (milestone: string, userId: number | string): boolean => {
  const key = keyFor(milestone, userId);
  try {
    if (localStorage.getItem(key) === "true") return false;
    localStorage.setItem(key, "true");
    return true;
  } catch {
    // localStorage unavailable (private browsing, disabled storage) — never celebrate
    // rather than risk celebrating on every load.
    return false;
  }
};

/** A family member's first successful booking, ever. */
export const consumeFirstBookingMilestone = (userId: number): boolean => consumeOnce("firstBooking", userId);

/** A caretaker completing all three Getting Started steps. */
export const consumeChecklistCompleteMilestone = (userId: number): boolean => consumeOnce("checklistComplete", userId);

/**
 * Detects a caretaker's verification status flipping to VERIFIED since the last time this
 * ran (verification is an admin-side action, so the only way the caretaker's own browser
 * finds out is by comparing against what it last saw on a previous dashboard load).
 * Always records the current status — including the very first call, which never
 * celebrates on its own (nothing to compare against yet) even if already verified.
 */
export const checkVerificationMilestone = (userId: number, currentStatus: string): boolean => {
  const key = keyFor("verificationStatus", userId);
  try {
    const previous = localStorage.getItem(key);
    localStorage.setItem(key, currentStatus);
    return previous !== null && previous !== "VERIFIED" && currentStatus === "VERIFIED";
  } catch {
    return false;
  }
};

/**
 * Detects a booking's status flipping to CONFIRMED since the last time this ran on this
 * device (confirmation is a caretaker/admin-side action, so the only way the family
 * member's browser finds out is by comparing against what it last saw for this booking).
 * Keyed by booking id rather than user id, since it's the booking's own lifecycle being
 * tracked. Always records the current status — including the very first call, which never
 * celebrates on its own (nothing to compare against yet) even if already confirmed.
 */
export const checkBookingConfirmedMilestone = (bookingId: number, currentStatus: string): boolean => {
  const key = keyFor("bookingConfirmed", bookingId);
  try {
    const previous = localStorage.getItem(key);
    localStorage.setItem(key, currentStatus);
    return previous !== null && previous !== "CONFIRMED" && currentStatus === "CONFIRMED";
  } catch {
    return false;
  }
};
