import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import heroes from '../components/HeroList';
import { defaultHeroArtCrop, heroArtCrop } from '../data/heroArtFocus';
import { translator } from '../shared/i18n';
import type { Action, HeroArtCrop, HeroArtLayout, HeroArtOverride, MatchState } from '../shared/types';

function frameStyle(crop: HeroArtCrop, layout: HeroArtLayout): CSSProperties {
  const baseWidth = layout === 'panel' ? 30 : 46;
  const baseHeight = layout === 'panel' ? 46 : 29;
  return {
    left: `${crop.x}%`,
    top: `${crop.y}%`,
    width: `${Math.max(12, baseWidth / crop.scale)}%`,
    height: `${Math.max(12, baseHeight / crop.scale)}%`,
  };
}

function CropPreview({
  src,
  crop,
  layout,
  legacy,
  alt,
}: {
  src: string;
  crop: HeroArtCrop;
  layout: HeroArtLayout;
  legacy: boolean;
  alt: string;
}) {
  const position = `${crop.x}% ${crop.y}%`;
  return <div className={`art-editor-preview art-editor-preview-${layout}`}>
    <img
      src={src}
      alt={alt}
      style={{
        objectPosition: legacy ? '50% 50%' : position,
        transform: legacy ? 'none' : `scale(${crop.scale})`,
        transformOrigin: legacy ? '50% 50%' : position,
      }}
    />
  </div>;
}

function CropControls({
  label,
  crop,
  onChange,
}: {
  label: string;
  crop: HeroArtCrop;
  onChange: (crop: HeroArtCrop) => void;
}) {
  const set = (field: keyof HeroArtCrop, value: number) => onChange({ ...crop, [field]: value });
  return <fieldset className="art-editor-crop-controls">
    <legend>{label}</legend>
    <label>X · {Math.round(crop.x)}%
      <input type="range" min={0} max={100} step={1} value={crop.x} onChange={e => set('x', Number(e.target.value))} />
    </label>
    <label>Y · {Math.round(crop.y)}%
      <input type="range" min={0} max={100} step={1} value={crop.y} onChange={e => set('y', Number(e.target.value))} />
    </label>
    <label>Scale · {crop.scale.toFixed(2)}×
      <input type="range" min={0.6} max={3} step={0.01} value={crop.scale} onChange={e => set('scale', Number(e.target.value))} />
    </label>
  </fieldset>;
}

export function HeroArtEditorDialog({
  state,
  disabled,
  send,
  onClose,
}: {
  state: MatchState;
  disabled: boolean;
  send: (action: Action) => void;
  onClose: () => void;
}) {
  const t = translator(state.language);
  const dialog = useRef<HTMLDialogElement>(null);
  const currentPicks = [...state.bluePicks, ...state.redPicks];
  const initialId = currentPicks[0] ?? heroes[0]?.id ?? 1;
  const [heroId, setHeroId] = useState(initialId);

  const makeDraft = (id: number): HeroArtOverride => {
    const runtime = state.heroArtOverrides?.[String(id)];
    return {
      useLegacyImage: runtime?.useLegacyImage ?? false,
      panel: { ...heroArtCrop(id, 'panel', runtime) },
      side: { ...heroArtCrop(id, 'side', runtime) },
    };
  };

  const [draft, setDraft] = useState<HeroArtOverride>(() => makeDraft(initialId));
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);
  useEffect(() => setDraft(makeDraft(heroId)), [heroId]);

  const hero = useMemo(() => heroes.find(item => item.id === heroId) ?? heroes[0], [heroId]);
  if (!hero) return null;

  const panel = draft.panel ?? defaultHeroArtCrop('panel');
  const side = draft.side ?? defaultHeroArtCrop('side');
  const forcedLegacy = state.artSourceMode === 'legacy' || draft.useLegacyImage === true || !hero.artLink;
  const source = forcedLegacy ? hero.imageLink : hero.artLink!;
  const fullSource = hero.artLink || hero.imageLink;
  const heroName = state.language === 'zh' ? hero.chineseName : hero.englishName;

  const resetLayout = (layout: HeroArtLayout) => {
    setDraft(previous => ({ ...previous, [layout]: { ...heroArtCrop(hero.id, layout) } }));
  };

  return createPortal(
    <dialog
      ref={dialog}
      className="hero-art-editor-dialog"
      aria-label={t('heroImageSettings')}
      onCancel={event => { event.preventDefault(); onClose(); }}
    >
      <header className="hero-art-editor-header">
        <div><strong>{t('heroImageSettings')}</strong><small>{heroName}</small></div>
        <button type="button" onClick={onClose}>{t('closeHeroImageSettings')}</button>
      </header>

      <div className="hero-art-editor-body">
        <aside className="hero-art-editor-controls">
          <label>{t('chooseHeroToEdit')}
            <select value={hero.id} onChange={event => setHeroId(Number(event.target.value))}>
              {heroes.map(item => <option key={item.id} value={item.id}>{state.language === 'zh' ? item.chineseName : item.englishName}</option>)}
            </select>
          </label>

          <label className="art-editor-checkbox">
            <input
              type="checkbox"
              checked={draft.useLegacyImage === true}
              disabled={!hero.artLink}
              onChange={event => setDraft(previous => ({ ...previous, useLegacyImage: event.target.checked }))}
            />
            {t('useLegacyForHero')}
          </label>
          {!hero.artLink && <p className="notice">{t('fullArtUnavailable')}</p>}

          <CropControls label={t('cropPanel')} crop={panel} onChange={crop => setDraft(previous => ({ ...previous, panel: crop }))} />
          <button type="button" onClick={() => resetLayout('panel')}>{t('resetCrop')} · {t('panelLayout')}</button>

          <CropControls label={t('cropSide')} crop={side} onChange={crop => setDraft(previous => ({ ...previous, side: crop }))} />
          <button type="button" onClick={() => resetLayout('side')}>{t('resetCrop')} · {t('sideLayout')}</button>

          <div className="art-editor-actions">
            <button
              type="button"
              className="primary"
              disabled={disabled}
              onClick={() => send({ type: 'hero_art_override', heroId: hero.id, override: draft })}
            >{t('saveHeroArt')}</button>
            <button
              type="button"
              className="danger"
              disabled={disabled}
              onClick={() => {
                send({ type: 'reset_hero_art_override', heroId: hero.id });
                setDraft({
                  useLegacyImage: false,
                  panel: { ...heroArtCrop(hero.id, 'panel') },
                  side: { ...heroArtCrop(hero.id, 'side') },
                });
              }}
            >{t('resetHeroArt')}</button>
          </div>
        </aside>

        <section className="hero-art-editor-stage">
          <div>
            <h3>{t('artReference')}</h3>
            <p className="muted">{t('artReferenceHint')}</p>
          </div>
          <div className="art-editor-reference">
            <img src={fullSource} alt={heroName} />
            <div className="art-reference-frame panel-frame" style={frameStyle(panel, 'panel')}><span>{t('panelLayout')}</span></div>
            <div className="art-reference-frame side-frame" style={frameStyle(side, 'side')}><span>{t('sideLayout')}</span></div>
          </div>

          <h3>{t('livePreview')}</h3>
          <div className="art-editor-previews">
            <div><span>{t('panelLayout')}</span><CropPreview src={source} crop={panel} layout="panel" legacy={forcedLegacy} alt={heroName} /></div>
            <div><span>{t('sideLayout')}</span><CropPreview src={source} crop={side} layout="side" legacy={forcedLegacy} alt={heroName} /></div>
          </div>
        </section>
      </div>
    </dialog>,
    document.body,
  );
}
