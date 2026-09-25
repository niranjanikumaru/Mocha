'use client';

import { usePathname } from 'next/navigation';
import { BarChart3, Layers, TrendingUp, Users, ShieldCheck, Beaker } from 'lucide-react';
import { MagneticDock } from './ui/magnetic-dock';

const destinations = [
  { href: '/', label: 'Decision Cockpit', icon: BarChart3, aliases: [] },
  { href: '/trust-funnel', label: 'Trust Funnel', icon: Layers, aliases: [] },
  { href: '/proof/terminal', label: 'Trading Terminal', icon: TrendingUp, aliases: [] },
  { href: '/market-night', label: 'Market Night', icon: Users, aliases: ['/proof/market-night'] },
  { href: '/contract-rules', label: 'Contract Rules', icon: ShieldCheck, aliases: ['/proof/contracts'] },
  { href: '/pricing', label: 'Fee Lab', icon: Beaker, aliases: [] },
];

export default function AppDock() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="mocha-dock-shell">
      <MagneticDock
        key={pathname}
        className="mocha-app-dock"
        iconSize={44}
        maxScale={1.35}
        magneticDistance={120}
        items={destinations.map(({ href, label, icon: Icon, aliases }) => ({
          id: href,
          href,
          label,
          icon: <Icon className="h-full w-full" strokeWidth={1.7} />,
          isActive: pathname === href || aliases.some((alias) => pathname === alias),
        }))}
      />
    </nav>
  );
}
