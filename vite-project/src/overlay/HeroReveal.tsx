import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { OverlayLayout } from '../shared/types';

interface Transition { sequence: number; kind: 'panel' | 'left' | 'right'; fromId?: number }

/** Only a changed hero ID starts a transition. Scores, language and snapshots cannot replay it. */
export function HeroReveal({ heroId, layout, position, renderArt, caption }: {
  heroId?: number; layout: OverlayLayout; position: 'left' | 'right';
  renderArt: (id: number | undefined) => ReactNode; caption: ReactNode;
}) {
  const previous = useRef(heroId);
  const sequence = useRef(0);
  const [shownHeroId, setShownHeroId] = useState(heroId);
  const [transition, setTransition] = useState<Transition | null>(null);
  // Keep presentation options current without making them animation triggers.
  const options = useRef({ layout, position });
  options.current = { layout, position };
  useLayoutEffect(() => {
    if (previous.current === heroId) return;
    const fromId = previous.current;
    previous.current = heroId;
    if (!heroId || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShownHeroId(heroId); setTransition(null); return;
    }
    const kind = options.current.layout === 'panel' ? 'panel' : options.current.position;
    setTransition({ sequence: ++sequence.current, kind, fromId });
    // Panel art changes only once the white cover is fully opaque, after its 180 ms fade.
    const switchTimer = setTimeout(() => setShownHeroId(heroId), kind === 'panel' ? 210 : 0);
    const finishTimer = setTimeout(() => setTransition(null), kind === 'panel' ? 680 : 430);
    return () => { clearTimeout(switchTimer); clearTimeout(finishTimer); };
  }, [heroId]);
  return <div className={transition ? `hero-reveal reveal-${transition.kind}` : 'hero-reveal'} data-reveal-sequence={sequence.current} data-showing-hero={shownHeroId ?? ''}>
    {transition && transition.kind !== 'panel' && <div className="hero-slot broadcast-art reveal-underlay">{renderArt(transition.fromId)}</div>}
    <div key={`art-${transition?.sequence ?? 'idle'}`} className="hero-slot broadcast-art" data-hero-id={heroId ?? ''}>{renderArt(shownHeroId)}</div>
    {transition && <div className="reveal-white" key={transition.sequence} aria-hidden="true" />}
    <div key={`caption-${transition?.sequence ?? 'idle'}`} className="card-caption">{caption}</div>
  </div>;
}

