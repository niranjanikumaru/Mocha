'use client';
import { useState } from 'react';
import type { ModelOutput } from '@/core/growth/model';
type Series = { name: string; color: string; model: ModelOutput };
export default function ProjectionSpace({ series, revenue = false }: { series: Series[]; revenue?: boolean }) {
  const [yaw, setYaw] = useState(-32);
  const [tilt, setTilt] = useState(24);
  const stages = ['Signups','KYC','Deposits','First trade','Active traders'];
  const points = series.flatMap((s, si) => s.model.snapshots.flatMap(m => revenue
    ? [{ x:m.month,y:m.totalRevenue,z:m.contribution,label:`Month ${m.month} · Revenue $${m.totalRevenue.toFixed(0)} · Contribution $${m.contribution.toFixed(0)}`,si }]
    : [m.totalSignups,m.kycPassed,m.deposited,m.firstTraded,m.activeUsers].map((n,i)=>({x:m.month,y:i,z:n,label:`Month ${m.month} · ${stages[i]}: ${Math.round(n)}`,si}))));
  const ymax = Math.max(1,...points.map(p=>p.y));
  const zmin = Math.min(0,...points.map(p=>p.z));
  const zmax = Math.max(1,...points.map(p=>p.z));
  const project = (x:number,y:number,z:number) => {
    const a=yaw*Math.PI/180,b=tilt*Math.PI/180;
    const xx=x*Math.cos(a)-y*Math.sin(a), yy=x*Math.sin(a)+y*Math.cos(a);
    const depth=yy*Math.cos(b)-z*Math.sin(b), scale=650/(800+depth);
    return {x:420+xx*scale,y:235-(z*Math.cos(b)+yy*Math.sin(b))*scale,depth};
  };
  const p=(x:number,y:number,z:number)=>project((x/12-.5)*480,(y/ymax-.5)*280,((z-zmin)/(zmax-zmin)-.5)*240);
  const origin=p(0,0,zmin);
  const axes=[{q:p(12,0,zmin),label:'Month 1–12'},{q:p(0,ymax,zmin),label:revenue?'Revenue (USD)':'Funnel stage'},{q:p(0,0,zmax),label:revenue?'Contribution (USD)':'People'}];
  return <section className="projection-space">
    <div className="space-legend">{series.map((s,i)=><span key={s.name} style={{color:s.color}}>{i===1?'■':'●'} {s.name}</span>)}</div>
    <svg viewBox="0 0 840 460" role="img" aria-label={revenue?'Rotatable 3D monthly revenue and contribution comparison':'Rotatable 3D twelve-month acquisition funnel comparison'}>
      {Array.from({length:13},(_,i)=>{const a=p(i,0,zmin),b=p(i,ymax,zmin);return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#9bbcd52a"/>;})}
      {Array.from({length:5},(_,i)=>{const a=p(0,ymax*i/4,zmin),b=p(12,ymax*i/4,zmin);return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#9bbcd52a"/>;})}
      {axes.map(({q,label})=><g key={label}><line x1={origin.x} y1={origin.y} x2={q.x} y2={q.y} stroke="#9bbcd58a"/><text x={q.x} y={q.y-12} fill="#b8ccde" fontSize="12" textAnchor="middle">{label}</text></g>)}
      {points.map(t=>({...t,q:p(t.x,t.y,t.z)})).sort((a,b)=>b.q.depth-a.q.depth).map((t,i)=><g key={i}><title>{series[t.si].name} · {t.label}</title>{t.si===1?<rect x={t.q.x-4} y={t.q.y-4} width="8" height="8" fill={series[t.si].color}/>:<circle cx={t.q.x} cy={t.q.y} r={t.si===2?4.5:3.5} fill={series[t.si].color}/>}</g>)}
    </svg>
    <div className="camera-controls"><label>Rotate <input aria-label="Rotate 3D chart" type="range" min="-75" max="75" value={yaw} onChange={e=>setYaw(+e.target.value)}/></label><label>Tilt <input aria-label="Tilt 3D chart" type="range" min="5" max="65" value={tilt} onChange={e=>setTilt(+e.target.value)}/></label></div>
    <p className="studio-note">{revenue?'Each point is one month. Axes: month, revenue and contribution (USD).':'Each point is a modelled stage in a month. Stage order: Signups → KYC → Deposits → First trade → Active traders.'} Hover a point for its exact values.</p>
    <details className="data-details"><summary>View exact monthly figures</summary><div className="table-scroll"><table><thead><tr><th>Scenario</th><th>Month</th><th>Signups</th><th>KYC</th><th>Deposits</th><th>First trade</th><th>Active</th><th>Revenue $</th><th>Contribution $</th></tr></thead><tbody>{series.flatMap(s=>s.model.snapshots.map(m=><tr key={s.name+m.month}><td>{s.name}</td>{[m.month,m.totalSignups,m.kycPassed,m.deposited,m.firstTraded,m.activeUsers,m.totalRevenue,m.contribution].map((v,i)=><td key={i}>{v.toFixed(i===0?0:1)}</td>)}</tr>))}</tbody></table></div></details>
  </section>;
}
