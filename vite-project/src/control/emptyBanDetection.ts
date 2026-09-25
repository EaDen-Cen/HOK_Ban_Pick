export interface EmptyBanStability {
  phaseKey: string;
  fingerprint: string;
  count: number;
}

export interface EmptyBanDetection {
  stability: EmptyBanStability;
  suspected: boolean;
  waitingForGracePeriod: boolean;
}

export const EMPTY_BAN_GRACE_MS = 10000;

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
 * Empty-ban detection is intentionally conservative:
 * - it only applies to Ban phases;
 * - the phase must first survive a grace period, because players often think
 *   for several seconds before banning;
 * - a recognizable hero clears empty-ban stability immediately;
 * - the same low-confidence frame must then remain stable for 3 scans;
 * - a caller can suppress the prompt for the rest of the current phase after
 *   the director rejects it.
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
  },
): EmptyBanDetection {
  const fingerprint = input.fingerprint || '';
  const lowConfidence = (input.topConfidence ?? 0) < .35;
  const graceMs = input.graceMs ?? EMPTY_BAN_GRACE_MS;
  const elapsedMs = input.elapsedMs ?? 0;
  const waitingForGracePeriod = input.isBan && elapsedMs < graceMs;

  if (
    !input.isBan
    || input.suppressed
    || waitingForGracePeriod
    || !fingerprint
    || !lowConfidence
  ) {
    return {
      stability: { phaseKey: input.phaseKey, fingerprint: '', count: 0 },
      suspected: false,
      waitingForGracePeriod,
    };
  }

  const samePhase = previous.phaseKey === input.phaseKey;
  const stableFrame = samePhase && previous.fingerprint && fingerprintDistance(previous.fingerprint, fingerprint) <= 8;
  const count = stableFrame ? previous.count + 1 : 1;
  const stability = { phaseKey: input.phaseKey, fingerprint, count };
  return { stability, suspected: count >= 3, waitingForGracePeriod: false };
}
