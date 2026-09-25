'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import AppDock from './AppDock';

export default function MochaShell({ children }: { children: ReactNode }) {
  const [intro, setIntro] = useState(true);
  const reduced = useReducedMotion();
  useEffect(() => {
    const timer = window.setTimeout(() => setIntro(false), reduced ? 150 : 2400);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIntro(false); };
    window.addEventListener('keydown', escape);
    return () => { window.clearTimeout(timer); window.removeEventListener('keydown', escape); };
  }, [reduced]);
  useEffect(() => {
    if (!intro) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [intro]);
  return (
    <>
      <div inert={intro} className="premium-app">
        <a className="premium-skip" href="#mocha-content">Skip to content</a>
        <AppDock />
        <div id="mocha-content" tabIndex={-1} className="mocha-page-content">{children}</div>
      </div>
      <AnimatePresence>
        {intro && (
          <motion.div className="mocha-intro" role="dialog" aria-modal="true" aria-label="Welcome to MochaTrade"
            initial={false} exit={{ opacity: 0, filter: reduced ? 'none' : 'blur(12px)' }} transition={{ duration: reduced ? 0 : 0.5 }}>
            <div className="intro-orbit" aria-hidden="true" />
            <div className="intro-lockup">
              <svg className="intro-symbol" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="78" height="78" rx="24" stroke="currentColor" strokeOpacity=".3" />
                <path className="intro-path" d="M19 51L33 37L43 47L61 27M46 27H61V42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />
              </svg>
              <h1 aria-label="MochaTrade">{'mochatrade'.split('').map((letter, i) => <span key={i} aria-hidden="true" style={{ animationDelay: `${0.25 + i * 0.055}s` }}>{letter}</span>)}<span className="brand-period">.</span></h1>
              <p>CLARITY. CONFIDENCE. CONNECTION.</p>
              <div className="intro-progress" aria-hidden="true"><span /></div>
            </div>
            <button autoFocus className="intro-skip" onClick={() => setIntro(false)}>Skip intro <span>↗</span></button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
