import { useEffect, useRef, type ReactNode } from 'react';

export function SettingsDialog({ children, label, closeLabel, onClose }: { children: ReactNode; label: string; closeLabel: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element = dialog.current!; element.showModal(); return () => element.close(); }, []);
  return <dialog ref={dialog} className="settings-dialog" aria-label={label} onCancel={onClose}>
    <header><strong>{label}</strong><button type="button" onClick={onClose}>{closeLabel}</button></header>
    {children}
  </dialog>;
}
