import type { Metadata } from 'next';
import FeeExperimentPanel from '../../components/FeeExperiment/FeeExperimentPanel';

export const metadata: Metadata = {
  title: 'Fee Experiment Lab — MochaTrade',
  description:
    'Connect your pricing decisions to customer impact and business outcomes. ' +
    'Adjust the platform fee, apply Market Night credits, model demand sensitivity, ' +
    'and compare pricing plans — all using one consistent calculation engine.',
};

export default function PricingPage() {
  return (
    <div className="fee-page-root">
      {/* ── Compact page header ── */}
      <div className="premium-page-heading"><span>PRICING STUDIO</span><h1>Make every fee make sense.</h1><p>Explore customer value and sustainable economics, side by side.</p></div>

      {/* ── Main content ── */}
      <main className="fee-page-main">
        <FeeExperimentPanel />
      </main>
    </div>
  );
}
