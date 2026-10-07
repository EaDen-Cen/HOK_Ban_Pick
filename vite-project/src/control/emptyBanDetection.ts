export interface EmptyBanStability {
  phaseKey: string;
  fingerprint: string;
  count: number;
}

export interface EmptyBanDetection {
  stability: EmptyBanStability;
  suspected: boolean;
  waitingForGracePeriod: boolean;
  lockCueDetected: boolean;
}

export const EMPTY_BAN_GRACE_MS = 4000;
export const EMPTY_BAN_LOCK_DISTANCE = 10;
export const EMPTY_BAN_MAX_HERO_CONFIDENCE = .50;

export function fingerprintDistance(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    const xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    distance += ((xor >> 0) & 1) + ((xor >> 1) & 1) + ((xor >> 2) & 1) + ((xor >> 3) & 1);
  }
  return distance;
}

/**
 * Empty-ban detection is deliberately based on two independent signals:
 * 1) no trustworthy hero match (real Ban portraits currently test well above this cutoff), and
 * 2) the lower-right "locked/confirmed" cue changed from the start-of-phase baseline.
 *
 * A static empty portrait is therefore not enough to produce an empty-ban prompt,
 * and a random low-confidence hero such as Kongming cannot by itself become an
 * empty ban.
 */
export function detectEmptyBan(
  previous: EmptyBanStability,
  input: {
    phaseKey: string;
    isBan: boolean;
    fingerprint?: string;
    topConfidence?: number;
    elapsedMs?: number;
    suppressed?: boolean;
    graceMs?: number;
    lockCueDistance?: number;
    lockCueThreshold?: number;
  },
): EmptyBanDetection {
  const fingerprint = input.fingerprint || '';
  const lowConfidence = (input.topConfidence ?? 0) < EMPTY_BAN_MAX_HERO_CONFIDENCE;
  const graceMs = input.graceMs ?? EMPTY_BAN_GRACE_MS;
  const elapsedMs = input.elapsedMs ?? 0;
  const waitingForGracePeriod = input.isBan && elapsedMs < graceMs;
  const lockCueDetected = Number.isFinite(input.lockCueDistance)
    && (input.lockCueDistance ?? 0) >= (input.lockCueThreshold ?? EMPTY_BAN_LOCK_DISTANCE);

  if (
    !input.isBan
    || input.suppressed
    || waitingForGracePeriod
    || !fingerprint
    || !lowConfidence
    || !lockCueDetected
  ) {
    return {
      stability: { phaseKey: input.phaseKey, fingerprint: '', count: 0 },
      suspected: false,
      waitingForGracePeriod,
      lockCueDetected,
    };
  }

  const samePhase = previous.phaseKey === input.phaseKey;
  const stableFrame = samePhase && previous.fingerprint && fingerprintDistance(previous.fingerprint, fingerprint) <= 8;
  const count = stableFrame ? previous.count + 1 : 1;
  const stability = { phaseKey: input.phaseKey, fingerprint, count };
  return {
    stability,
    suspected: count >= 2,
    waitingForGracePeriod: false,
    lockCueDetected,
  };
}
