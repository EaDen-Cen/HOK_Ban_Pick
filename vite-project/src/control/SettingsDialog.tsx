import type { ReactNode } from 'react';
export function SettingsDialog({ children, label, closeLabel, onClose }: { children: ReactNode; label: string; closeLabel: string; onClose: () => void }) {
  return <section id="match-settings" className="settings-inline" aria-label={label} onKeyDown={event => { if (event.key === 'Escape') onClose(); }}>
    <header><strong>{label}</strong><button type="button" onClick={onClose}>{closeLabel}</button></header>{children}
  </section>;
}
