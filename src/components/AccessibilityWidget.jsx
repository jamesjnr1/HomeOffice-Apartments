import { useEffect, useRef, useState } from 'react';
import { Accessibility, Minus, Plus, X } from 'lucide-react';

/**
 * AccessibilityWidget
 * Floating site-wide control for text size, high contrast, and reduce
 * motion. Preferences persist to localStorage and are re-applied on
 * every load, before the user has to touch anything.
 */
const SCALE_LEVELS = [100, 112, 125, 137];
const STORAGE_KEY = 'hoa-accessibility';
const DEFAULT_PREFS = { scale: 100, contrast: false, reduceMotion: false };

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      scale: SCALE_LEVELS.includes(parsed.scale) ? parsed.scale : 100,
      contrast: !!parsed.contrast,
      reduceMotion: !!parsed.reduceMotion,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function applyPrefs(prefs) {
  const root = document.documentElement;
  SCALE_LEVELS.forEach((n) => root.classList.remove(`a11y-scale-${n}`));
  if (prefs.scale !== 100) root.classList.add(`a11y-scale-${prefs.scale}`);
  root.classList.toggle('a11y-contrast', prefs.contrast);
  root.classList.toggle('a11y-reduce-motion', prefs.reduceMotion);
}

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(loadPrefs);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    applyPrefs(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Private browsing / storage disabled — preference just won't persist.
    }
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const scaleIndex = SCALE_LEVELS.indexOf(prefs.scale);
  const decrease = () => setPrefs((p) => ({ ...p, scale: SCALE_LEVELS[Math.max(scaleIndex - 1, 0)] }));
  const increase = () => setPrefs((p) => ({ ...p, scale: SCALE_LEVELS[Math.min(scaleIndex + 1, SCALE_LEVELS.length - 1)] }));
  const toggleContrast = () => setPrefs((p) => ({ ...p, contrast: !p.contrast }));
  const toggleMotion = () => setPrefs((p) => ({ ...p, reduceMotion: !p.reduceMotion }));
  const reset = () => setPrefs(DEFAULT_PREFS);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="a11y-toggle"
        aria-label="Accessibility options"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Accessibility size={24} />
      </button>

      {open && (
        <div className="a11y-panel" role="dialog" aria-label="Accessibility options" ref={panelRef}>
          <div className="a11y-panel-head">
            <h2>Accessibility</h2>
            <button type="button" className="a11y-close" aria-label="Close" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <p className="a11y-sub">Adjust the site to read comfortably.</p>

          <div className="a11y-row">
            <span className="a11y-row-label">Text size</span>
            <div className="a11y-stepper">
              <button type="button" onClick={decrease} disabled={scaleIndex === 0} aria-label="Decrease text size">
                <Minus size={14} />
              </button>
              <span className="a11y-stepper-value">{prefs.scale}%</span>
              <button
                type="button"
                onClick={increase}
                disabled={scaleIndex === SCALE_LEVELS.length - 1}
                aria-label="Increase text size"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="a11y-row">
            <span className="a11y-row-label">High contrast</span>
            <button
              type="button"
              className="a11y-switch"
              role="switch"
              aria-checked={prefs.contrast}
              onClick={toggleContrast}
            />
          </div>

          <div className="a11y-row">
            <span className="a11y-row-label">Reduce motion</span>
            <button
              type="button"
              className="a11y-switch"
              role="switch"
              aria-checked={prefs.reduceMotion}
              onClick={toggleMotion}
            />
          </div>

          <button type="button" className="a11y-reset" onClick={reset}>Reset to default</button>
        </div>
      )}
    </>
  );
}
