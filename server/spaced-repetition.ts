// SuperMemo-2 algorithm implementation for spaced repetition
export interface SpacedRepetitionResult {
  easeFactor: number;
  interval: number;
  nextReview: Date;
}

export function calculateNextReview(
  quality: number, // 0-5 scale (0 = complete blackout, 5 = perfect response)
  easeFactor: number = 2.5,
  interval: number = 1,
  repetitions: number = 0
): SpacedRepetitionResult {
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  if (quality < 3) {
    // Incorrect response - reset interval and repetitions
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Correct response
    newRepetitions++;
    
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
  }

  // Update ease factor (only for quality >= 3)
  if (quality >= 3) {
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  }

  // Ensure ease factor doesn't go below 1.3
  newEaseFactor = Math.max(1.3, newEaseFactor);

  // Calculate next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100, // Round to 2 decimal places
    interval: newInterval,
    nextReview
  };
}

// Convert swipe result to quality score
export function swipeToQuality(known: boolean): number {
  return known ? 5 : 1; // Perfect response or near failure
}

// Check if a word is due for review
export function isDueForReview(nextReview: Date | null): boolean {
  if (!nextReview) return true; // New words are always due
  return new Date() >= nextReview;
}