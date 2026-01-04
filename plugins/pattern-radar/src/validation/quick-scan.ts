import { Signal, QuickScanResult, SignalTier } from '../types';

/**
 * Thresholds for quick scan validation
 */
export const QUICK_SCAN_THRESHOLDS = {
  minPoints: 5,
  minComments: 2,
  staleDays: 90,
};

/**
 * Run quick scan on a signal to determine quality tier
 * Fast, no network calls - just evaluates existing data
 */
export function quickScan(signal: Signal): QuickScanResult {
  const points = signal.score || 0;
  const comments = (signal.metadata.comments as number) || 0;

  const postDate = new Date(signal.timestamp);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));

  const passesThreshold =
    points >= QUICK_SCAN_THRESHOLDS.minPoints ||
    comments >= QUICK_SCAN_THRESHOLDS.minComments;

  const isStale = daysSince > QUICK_SCAN_THRESHOLDS.staleDays;

  let tier: SignalTier;
  if (!passesThreshold) {
    tier = 'dead';
  } else if (isStale) {
    tier = 'unverified';
  } else {
    tier = 'verified';
  }

  return {
    tier,
    engagement: { points, comments, passesThreshold },
    age: { days: daysSince, isStale },
  };
}

/**
 * Run quick scan on array of signals, attaching results
 */
export function quickScanAll(signals: Signal[]): Signal[] {
  return signals.map(signal => ({
    ...signal,
    quickScan: quickScan(signal),
  }));
}

/**
 * Filter signals to only those passing quick scan
 */
export function filterByQuickScan(signals: Signal[], excludeDead = true): Signal[] {
  const scanned = quickScanAll(signals);
  if (excludeDead) {
    return scanned.filter(s => s.quickScan?.tier !== 'dead');
  }
  return scanned;
}
