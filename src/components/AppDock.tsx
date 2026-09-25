'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, type MotionValue } from 'framer-motion';
import { BarChart3, Layers, TrendingUp, Users, ShieldCheck, Beaker } from 'lucide-react';

const destinations = [
  { href: '/', label: 'Overview', icon: BarChart3, aliases: [] },
  { href: '/trust-funnel', label: 'Growth', icon: Layers, aliases: [] },
  { href: '/proof/terminal', label: 'Terminal', icon: TrendingUp, aliases: [] },
  { href: '/market-night', label: 'Market Night', icon: Users, aliases: ['/proof/market-night'] },
  { href: '/contract-rules', label: 'Contracts', icon: ShieldCheck, aliases: ['/proof/contracts'] },
  { href: '/pricing', label: 'Pricing', icon: Beaker, aliases: [] },
];

function DockLink({ href, label, active, children, pointer }: {
  href: string; label: string; active: boolean; children: ReactNode; pointer: MotionValue<number>;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const reduced = useReducedMotion();
  // Measure stable slots, so scaling never moves the distance calculation.
  const distance = useTransform(pointer, (x) => {
    const rect = ref.current?.getBoundingClientRect();
    return rect ? x - rect.left - rect.width / 2 : Infinity;
  });
  const target = useTransform(distance, [-110, 0, 110], [1, 1.18, 1]);
  const scale = useSpring(target, { stiffness: 280, damping: 24 });
  return (
    <li ref={ref} className="top-dock-slot">
      <Link href={href} aria-label={label} aria-current={active ? 'page' : undefined} className="top-dock-link">
        <motion.span className="top-dock-icon" style={{ scale: reduced ? 1 : scale }} aria-hidden="true">{children}</motion.span>
        <span className="top-dock-label">{label === 'Market Night' ? 'Night' : label}</span>
        <span className="top-dock-tooltip" aria-hidden="true">{label}</span>
        {active && <span className="top-dock-active" />}
      </Link>
    </li>
  );
}

export default function AppDock() {
  const pathname = usePathname();
  const pointer = useMotionValue(Infinity);
  return (
    <header className="premium-topbar">
      <Link href="/" className="premium-brand" aria-label="MochaTrade home">
        <span className="brand-mark"><TrendingUp size={21} strokeWidth={2} /></span>
        <span>mocha<span className="brand-light">trade</span><span className="brand-period">.</span></span>
      </Link>
      <nav className="top-dock" aria-label="Main navigation"
        onPointerMove={(event) => {
          if (event.pointerType !== 'mouse') return;
          pointer.set(event.clientX);
          const bounds = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty('--spotlight-x', `${event.clientX - bounds.left}px`);
        }}
        onPointerLeave={() => pointer.set(Infinity)}>
        <ul>{destinations.map(({ href, label, icon: Icon, aliases }) => (
          <DockLink key={href} href={href} label={label} active={pathname === href || aliases.includes(pathname)} pointer={pointer}>
            <Icon size={19} strokeWidth={1.7} />
          </DockLink>
        ))}</ul>
      </nav>
      <span className="premium-mode"><i />Interactive prototype</span>
    </header>
  );
}
