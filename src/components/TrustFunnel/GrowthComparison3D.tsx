'use client';

import { useMemo, useRef, useState } from 'react';
import { RotateCcw, Box, Move, Minus, Plus, ArrowUpRight } from 'lucide-react';
import { attributeComparison, type ComparisonMetric } from '@/core/growth/comparisonAttribution';
import type { TrustFunnelModelInputs, TrustFunnelModelOutput, TrustFunnelMonthlySnapshot } from '@/core/growth/trustFunnelModel';
import './growth-comparison.css';

const metrics: {key: ComparisonMetric; label: string; formula: string; money?: boolean}[] = [
  {key:'uniqueNewProspects',label:'New prospects',formula:'Event prospects + paid prospects + organic prospects + referrals'},
  {key:'onboardedTraders',label:'Onboarding',formula:'New prospects × effective onboarding rate'},
  {key:'fundedTraders',label:'Funding',formula:'Onboarded traders × effective funding rate'},
  {key:'firstLiveTraders',label:'First live trade',formula:'Funded traders × effective first-trade rate'},
  {key:'activeTraders',label:'Active traders',formula:'Prior-month active traders × effective retention + new first-live traders'},
  {key:'totalRevenueUsd',label:'Revenue',formula:'Active traders × volume per trader × fee / 10,000 + funded traders × deposit × FX spread / 100',money:true},
  {key:'contributionUsd',label:'Contribution',formula:'Trading revenue + FX revenue − all operating and programme costs',money:true},
];
type Props = { selectedInputs: TrustFunnelModelInputs; comparisonInputs: TrustFunnelModelInputs; selectedOutput: TrustFunnelModelOutput; comparisonOutput: TrustFunnelModelOutput; selectedName: string; comparisonName: string; month: number; onMonthChange:(month:number)=>void; currencySymbol: string; currencyMultiplier: number; onOpenIntervention:(id:string)=>void };
export default function GrowthComparison3D({selectedInputs,comparisonInputs,selectedOutput,comparisonOutput,selectedName,comparisonName,month,onMonthChange,currencySymbol,currencyMultiplier,onOpenIntervention}:Props){
 const [metric,setMetric]=useState<ComparisonMetric>('activeTraders');
 const [yaw,setYaw]=useState(-.48),[pitch,setPitch]=useState(.30),[zoom,setZoom]=useState(1);
 const [selection,setSelection]=useState<'A'|'B'|'edge'>('edge');
 const gesture=useRef<{x:number;y:number}|null>(null);
 const def=metrics.find(m=>m.key===metric)!;
 const months=Math.min(selectedOutput.snapshots.length,comparisonOutput.snapshots.length);
 const index=Math.max(0,Math.min(months-1,month-1));
 const a=comparisonOutput.snapshots[index],b=selectedOutput.snapshots[index];
 const factor=def.money?currencyMultiplier:1;
 const format=(value:number,compact=false)=>(def.money?currencySymbol:'')+new Intl.NumberFormat('en-US',{maximumFractionDigits:compact?1:2,notation:compact?'compact':'standard'}).format(value*factor);
 const av=a[metric],bv=b[metric],delta=bv-av;
 const attribution=useMemo(()=>attributeComparison(comparisonInputs,selectedInputs),[comparisonInputs,selectedInputs]);
 const causes=attribution.steps.map(s=>({...s,value:s.after[index][metric]-s.before[index][metric]}));
 const residual=delta-causes.reduce((sum,s)=>sum+s.value,0);
 const values=[...comparisonOutput.snapshots,...selectedOutput.snapshots].map(s=>s[metric]);
 const low=Math.min(0,...values),high=Math.max(1,...values),span=high-low;
 const project=(x:number,y:number,z:number)=>{const xx=x*Math.cos(yaw)+z*Math.sin(yaw),zz=-x*Math.sin(yaw)+z*Math.cos(yaw);const yy=y*Math.cos(pitch)-zz*Math.sin(pitch),depth=y*Math.sin(pitch)+zz*Math.cos(pitch);const scale=700/(850+depth)*zoom;return{x:Number((410+xx*scale).toFixed(4)),y:Number((225-yy*scale).toFixed(4)),depth:Number(depth.toFixed(4))};};
 const position=(m:number,v:number,side:'A'|'B')=>project(((m-1)/Math.max(1,months-1)-.5)*510,((v-low)/span-.5)*280,side==='A'?-125:125);
 const pairs=Array.from({length:months},(_,i)=>({month:i+1,a:position(i+1,comparisonOutput.snapshots[i][metric],'A'),b:position(i+1,selectedOutput.snapshots[i][metric],'B')}));
 const points=pairs.flatMap(p=>[{...p.a,month:p.month,side:'A' as const,value:comparisonOutput.snapshots[p.month-1][metric]},{...p.b,month:p.month,side:'B' as const,value:selectedOutput.snapshots[p.month-1][metric]}]).sort((l,r)=>r.depth-l.depth);
 const select=(m:number,side:'A'|'B'|'edge')=>{onMonthChange(m);setSelection(side);};
 const details=(s:TrustFunnelMonthlySnapshot)=>[
  ['New prospects',s.uniqueNewProspects.toFixed(1)],['Onboarding rate',(s.effectiveOnboardingRate*100).toFixed(2)+'%'],['Funding rate',(s.effectiveFundingRate*100).toFixed(2)+'%'],['First-trade rate',(s.effectiveFirstLiveTradeRate*100).toFixed(2)+'%'],['Retention rate',(s.effectiveRetentionRate*100).toFixed(2)+'%'],['Prior-month retained',s.retainedFromPriorMonth.toFixed(1)]
 ];
 return <section className="growth-universe" aria-label="Interactive two-scenario 3D comparison">
  <div className="gu-heading"><div><span className="gu-eyebrow">THE COMPARISON UNIVERSE</span><h2>Two futures. Every difference explained.</h2><p>Drag to orbit. Select a dot or the bridge between a pair to inspect month {index+1}.</p></div><Box size={28}/></div>
  <div className="gu-features" role="group" aria-label="Comparison feature">{metrics.map(m=><button key={m.key} aria-pressed={metric===m.key} onClick={()=>setMetric(m.key)}>{m.label}</button>)}</div>
  <div className="gu-layout"><div className="gu-chart-panel">
   <div className="gu-legend"><span className="gu-a">● A · {comparisonName}</span><span className="gu-b">● B · {selectedName}</span></div>
   <div className="gu-orbit">
    <svg viewBox="0 0 820 470" aria-label={`${def.label}: ${months} monthly pairs in three dimensions`} role="group"
      onPointerDown={e=>{gesture.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}
      onPointerMove={e=>{if(!gesture.current)return;const dx=e.clientX-gesture.current.x,dy=e.clientY-gesture.current.y;setYaw(v=>v+dx*.007);setPitch(v=>Math.max(-.8,Math.min(.9,v+dy*.005)));gesture.current={x:e.clientX,y:e.clientY};}}
      onPointerUp={()=>{gesture.current=null;}} onPointerCancel={()=>{gesture.current=null;}}>
      <defs><radialGradient id="gu-space"><stop stopColor="#244459" stopOpacity=".3"/><stop offset="1" stopColor="#090e19" stopOpacity="0"/></radialGradient></defs><rect width="820" height="470" fill="url(#gu-space)"/>
      {Array.from({length:months},(_,i)=>{const s=position(i+1,low,'A'),t=position(i+1,low,'B');return <g key={i}><line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#829aba25"/><text x={t.x} y={t.y+18} textAnchor="middle" fontSize="10" fill="#8fa6bd">M{i+1}</text></g>;})}
      {[0,.25,.5,.75,1].map(f=>{const s=position(1,low+span*f,'A'),t=position(months,low+span*f,'A');return <g key={f}><line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#829aba25"/><text x={s.x-12} y={s.y+3} textAnchor="end" fontSize="10" fill="#8fa6bd">{format(low+span*f,true)}</text></g>;})}
      {pairs.map(p=><g key={p.month} className="gu-bridge" role="button" tabIndex={0} aria-label={`Compare scenarios at month ${p.month}`} onPointerDown={e=>e.stopPropagation()} onClick={()=>select(p.month,'edge')} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(p.month,'edge');}}}><line x1={p.a.x} y1={p.a.y} x2={p.b.x} y2={p.b.y} stroke="transparent" strokeWidth="16"/><line className="gu-bridge-visible" x1={p.a.x} y1={p.a.y} x2={p.b.x} y2={p.b.y} stroke={p.month===index+1?'#d4e7f6':'#acc3d149'} strokeWidth={p.month===index+1?2.5:1} strokeDasharray={p.month===index+1?undefined:'4 5'}/><title>{`Month ${p.month}: Δ ${format(selectedOutput.snapshots[p.month-1][metric]-comparisonOutput.snapshots[p.month-1][metric])}`}</title></g>)}
      {points.map(p=><g key={p.side+p.month} role="button" tabIndex={0} className={`gu-dot gu-dot-${p.side}`} aria-label={`${p.side==='A'?comparisonName:selectedName}, month ${p.month}, ${def.label} ${format(p.value)}`} onPointerDown={e=>e.stopPropagation()} onClick={()=>select(p.month,p.side)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(p.month,p.side);}}}><circle cx={p.x} cy={p.y} r="14" fill="transparent"/>{p.month===index+1&&<circle cx={p.x} cy={p.y} r="13" fill="none" stroke={p.side==='A'?'#80d9ff':'#f4b379'} strokeOpacity=".6"/>}<circle className="gu-dot-core" cx={p.x} cy={p.y} r={p.month===index+1?7:4.5} fill={p.side==='A'?'#80d9ff':'#f4b379'}/><title>{`${p.side==='A'?comparisonName:selectedName} · M${p.month} · ${format(p.value)}`}</title></g>)}
    </svg>
   </div>
   <div className="gu-camera"><span><Move size={13}/> Orbit the model</span><button aria-label="Zoom out" onClick={()=>setZoom(v=>Math.max(.6,v-.1))}><Minus size={15}/></button><button aria-label="Zoom in" onClick={()=>setZoom(v=>Math.min(1.5,v+.1))}><Plus size={15}/></button><button aria-label="Reset camera" onClick={()=>{setZoom(1);setYaw(-.48);setPitch(.30);}}><RotateCcw size={14}/></button><label>Rotate<input aria-label="Chart rotation" type="range" min="-180" max="180" value={yaw*180/Math.PI} onChange={e=>setYaw(+e.target.value*Math.PI/180)}/></label></div>
   <p className="gu-caption">X · Month &nbsp; Y · {def.label}{def.money?` (${currencySymbol})`:' (people)'} &nbsp; Z · Scenario A / B<br/>{months*2} model points, not sampled observations. Depth separates scenarios; it is not an extra performance metric.</p>
  </div>
  <aside className="gu-inspector" aria-label="Two-sided scenario comparison cube">
   <div className="gu-inspector-top"><span>MONTH {String(index+1).padStart(2,'0')}</span><span>{selection==='edge'?'BRIDGE SELECTED':`SCENARIO ${selection} SELECTED`}</span></div>
   <h3>{def.label}</h3>
   <div className="gu-cube-stage"><div className="gu-cube"><div className={`gu-face gu-face-a ${selection==='A'?'chosen':''}`}><span>SCENARIO A</span><h4>{comparisonName}</h4><strong>{format(av,true)}</strong><small>{format(av)} {def.money?'':'people'}</small></div><div className={`gu-face gu-face-b ${selection==='B'?'chosen':''}`}><span>SCENARIO B</span><h4>{selectedName}</h4><strong>{format(bv,true)}</strong><small>{format(bv)} {def.money?'':'people'}</small></div><div className="gu-face gu-face-top"/></div></div>
   <div className="gu-delta" aria-live="polite"><span>Difference · B − A</span><strong>{delta>0?'+':''}{format(delta)}</strong><small>{av===0?'Percentage change unavailable: A is zero.':`${(delta/Math.abs(av)*100).toFixed(2)}% relative to |A|`}</small></div>
   <label className="gu-month">Inspect month<select aria-label="Inspect comparison month" value={index+1} onChange={e=>onMonthChange(+e.target.value)}>{pairs.map(p=><option key={p.month} value={p.month}>Month {p.month}</option>)}</select></label>
  </aside></div>
  <div className="gu-explanation"><div><span className="gu-eyebrow">FOLLOW THE DIFFERENCE</span><h3>How did this delta occur?</h3><p className="gu-formula">{def.formula}</p><p>We start with A, replace each input group with B’s assumptions, and rerun the complete monthly model after every replacement.</p></div><div className="gu-attribution">{causes.map((c,i)=><div className="gu-cause" key={c.key}><span className="gu-cause-number">{i+1}</span><span>{c.label}<small>{c.changed?'Inputs changed':'Same inputs'}</small></span><strong>{c.value>0?'+':''}{format(c.value)}</strong></div>)}<div className="gu-cause gu-total"><span>Total explained difference</span><strong>{delta>0?'+':''}{format(causes.reduce((sum,c)=>sum+c.value,0))}</strong></div><small>Reconciliation residual: {format(residual)}. Sequential attribution is order-dependent: interactions are assigned to later groups. These are modelled explanations, not measured causal proof.</small></div></div>
  <details className="gu-audit"><summary>Inspect exact scenario values and evidence</summary><div className="gu-table-scroll"><table><thead><tr><th>Month {index+1}</th><th>A · {comparisonName}</th><th>B · {selectedName}</th></tr></thead><tbody>{details(a).map(([label,v],i)=><tr key={label}><th>{label}</th><td>{v}</td><td>{details(b)[i][1]}</td></tr>)}<tr><th>{def.label}</th><td>{format(av)}</td><td>{format(bv)}</td></tr></tbody></table></div><p>Effective rate = clamp(base rate + Σ(enabled rollout coverage × assumed percentage-point effect), 0, 1). Active traders carry forward from prior months; acquisition changes also propagate into referrals.</p><div className="gu-evidence">{selectedInputs.interventions.map(i=><button key={i.id} onClick={()=>onOpenIntervention(i.id)}><strong>{i.name} <ArrowUpRight size={13}/></strong><span>{i.evidenceStatus} · {i.enabled?'Enabled':'Disabled'} · month coverage {((i.coverageSchedule[index]??0)*100).toFixed(0)}%</span><small>{i.evidenceNote}</small></button>)}</div></details>
 </section>;
}
