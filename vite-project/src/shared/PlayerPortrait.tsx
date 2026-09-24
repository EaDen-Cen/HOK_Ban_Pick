import { useState } from 'react';
import { portraitAssetURL } from './config';

/** Failed portraits also fall back to the team logo, then a numbered slot. */
export function PlayerPortrait({ portrait, logo = '', label, slot }: { portrait: string; logo?: string; label: string; slot: number }) {
  const [failed, setFailed] = useState<string[]>([]);
  const source = [portrait, logo].find(value => value && !failed.includes(value));
  return source ? <img className="player-portrait" src={portraitAssetURL(source)} alt={label} onError={() => setFailed(previous => [...previous, source])} /> : <span className="empty portrait-placeholder">{String(slot + 1).padStart(2, '0')}</span>;
}
