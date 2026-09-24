export interface EmptyBanStability {
  phaseKey: string;
  fingerprint: string;
  count: number;
}

export interface EmptyBanDetection {
  stability: EmptyBanStability;
  suspected: boolean;
}

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
 * Empty ban is deliberately conservative:
 * - only a Ban phase may trigger it;
 * - a recognizable hero always clears suspicion;
 * - the same low-confidence frame must remain visually stable for 3 scans.
 *
 * It returns a suspicion for human review; it never submits a skip by itself.
 */
export function detectEmptyBan(
  previous: EmptyBanStability,
  input: {
    phaseKey: string;
    isBan: boolean;
    fingerprint?: string;
    topConfidence?: number;
  },
): EmptyBanDetection {
  const fingerprint = input.fingerprint || '';
  const lowConfidence = (input.topConfidence ?? 0) < .35;
  if (!input.isBan || !fingerprint || !lowConfidence) {
    return { stability: { phaseKey: input.phaseKey, fingerprint: '', count: 0 }, suspected: false };
  }

  const samePhase = previous.phaseKey === input.phaseKey;
  const stableFrame = samePhase && previous.fingerprint && fingerprintDistance(previous.fingerprint, fingerprint) <= 8;
  const count = stableFrame ? previous.count + 1 : 1;
  const stability = { phaseKey: input.phaseKey, fingerprint, count };
  return { stability, suspected: count >= 3 };
}
