/**
 * One-time review ask. After a user completes enough walkthroughs to know
 * whether BitVanes works for them, we ask once — ever — for an Open VSX
 * review. There is no telemetry anywhere in BitVanes: this is a local
 * completion counter and a boolean flag, both in extension globalState.
 */

/** Walkthroughs completed before the prompt may appear. */
export const REVIEW_THRESHOLD = 3;

/** Open VSX extension page (where reviews are written). */
export const REVIEW_URL = 'https://open-vsx.org/extension/bitvanes/bitvanes';

export const COMPLETED_COUNT_KEY = 'bitvanes.completedWalkthroughs';
export const REVIEW_PROMPT_SHOWN_KEY = 'bitvanes.reviewPromptShown';

/** True exactly when the prompt should be shown: never shown before, threshold reached. */
export function shouldAskForReview(completed: number, alreadyShown: boolean): boolean {
  return !alreadyShown && completed >= REVIEW_THRESHOLD;
}
