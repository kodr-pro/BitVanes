import { describe, expect, it } from 'vitest';
import { REVIEW_THRESHOLD, shouldAskForReview } from '../src/util/reviewPrompt';

describe('shouldAskForReview', () => {
  it('stays silent before the threshold', () => {
    expect(shouldAskForReview(0, false)).toBe(false);
    expect(shouldAskForReview(REVIEW_THRESHOLD - 1, false)).toBe(false);
  });

  it('fires exactly at the threshold', () => {
    expect(shouldAskForReview(REVIEW_THRESHOLD, false)).toBe(true);
    expect(shouldAskForReview(REVIEW_THRESHOLD + 5, false)).toBe(true);
  });

  it('never fires again once shown', () => {
    expect(shouldAskForReview(REVIEW_THRESHOLD, true)).toBe(false);
    expect(shouldAskForReview(1000, true)).toBe(false);
  });
});
