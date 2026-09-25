'use client';

/**
 * ScatterPlot3D.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * An interactive 3D scatter plot rendered on an HTML Canvas element using a
 * perspective-projection approach. No WebGL dependency — degrades gracefully.
 *
 * Axes:
 *   X = Year-one executed trading volume (USD)
 *   Y = Year-one contribution (USD) — can be negative
 *   Z = Month-12 active traders
 *
 * Interactions: drag to rotate, scroll/pinch to zoom, click to select.
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import type { ScenarioPoint, AxisRanges } from '../../core/growth/strategyMap';

export interface ScatterPlot3DProps {
  points: ScenarioPoint[];
  ranges: AxisRanges;
  selectedPairId: string | null;
  onSelect: (point: ScenarioPoint) => void;
  /** Show all pair connector edges */
  showAllEdges?: boolean;
  width?: number;
  height?: number;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Proj2D { sx: number; sy: number; depth: number; pointIdx: number }

// ─── Perspective projection math ─────────────────────────────────────────────

function rotatePoint(
  x: number, y: number, z: number,
  rotX: number, rotY: number
): [number, number, number] {
  // Rotate around Y axis
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;

  // Rotate around X axis
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  return [x1, y2, z2];
}

function project(
  x: number, y: number, z: number,
  fov: number, cx: number, cy: number
): [number, number] {
  const scale = fov / (fov + z);
  return [cx + x * scale, cy - y * scale];
}

function normalise(val: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (val - min) / (max - min);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScatterPlot3D({
  points,
  ranges,
  selectedPairId,
  onSelect,
  showAllEdges = false,
  width = 720,
  height = 480,
}: ScatterPlot3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotX, setRotX] = useState(-0.35);
  const [rotY, setRotY] = useState(0.5);
  const [zoom, setZoom] = useState(1.0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ScenarioPoint | null>(null);

  // Stable projected positions for hit-testing
  const projections = useRef<Proj2D[]>([]);

  const fov = 400 * zoom;
  const cx = width / 2;
  const cy = height / 2;
  const S = 140 * zoom; // scale for normalised coords [-0.5, 0.5] → pixels

  // ── Build projections and render ──────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, width, height);

    const proj2d: Proj2D[] = [];

    // Project all points
    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const nx = normalise(pt.volumeUsd12m, ranges.xMin, ranges.xMax) - 0.5;
      const ny = normalise(pt.contribution12m, ranges.yMin, ranges.yMax) - 0.5;
      const nz = normalise(pt.activeM12, ranges.zMin, ranges.zMax) - 0.5;

      const [rx, ry, rz] = rotatePoint(nx * S, ny * S, nz * S, rotX, rotY);
      const [sx, sy] = project(rx, ry, rz, fov, cx, cy);
      proj2d.push({ sx, sy, depth: rz, pointIdx: i });
    }

    // Sort by depth (painter's algo)
    proj2d.sort((a, b) => a.depth - b.depth);
    projections.current = proj2d;

    // ── Zero-contribution plane (y=0) ─────────────────────────────────────
    const y0norm = normalise(0, ranges.yMin, ranges.yMax) - 0.5;
    if (y0norm >= -0.5 && y0norm <= 0.5) {
      const corners: Array<[number, number, number]> = [
        [-0.5, y0norm, -0.5], [0.5, y0norm, -0.5], [0.5, y0norm, 0.5], [-0.5, y0norm, 0.5],
      ];
      const projected = corners.map(([x, y, z]) => {
        const [rx, ry, rz] = rotatePoint(x * S, y * S, z * S, rotX, rotY);
        return project(rx, ry, rz, fov, cx, cy);
      });
      ctx.beginPath();
      ctx.moveTo(projected[0][0], projected[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(projected[i][0], projected[i][1]);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Label
      const [lx, ly] = project(...rotatePoint(0.55 * S, y0norm * S, 0, rotX, rotY), fov, cx, cy);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '9px monospace';
      ctx.fillText('Break-even', lx, ly);
    }

    // ── Pair edges ────────────────────────────────────────────────────────
    if (showAllEdges || selectedPairId) {
      const pairMap = new Map<string, { base?: Proj2D; prop?: Proj2D }>();
      for (const p2 of proj2d) {
        const pt = points[p2.pointIdx];
        if (!pairMap.has(pt.pairId)) pairMap.set(pt.pairId, {});
        const entry = pairMap.get(pt.pairId)!;
        if (pt.variant === 'baseline') entry.base = p2;
        else entry.prop = p2;
      }

      for (const [pid, { base, prop }] of pairMap) {
        if (!base || !prop) continue;
        const isSelected = pid === selectedPairId;
        if (!showAllEdges && !isSelected) continue;

        ctx.beginPath();
        ctx.moveTo(base.sx, base.sy);
        ctx.lineTo(prop.sx, prop.sy);
        ctx.strokeStyle = isSelected ? 'rgba(245,158,11,0.8)' : 'rgba(255,255,255,0.08)';
        ctx.lineWidth = isSelected ? 1.5 : 0.5;
        ctx.setLineDash(isSelected ? [] : [4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Midpoint marker for selected pair
        if (isSelected) {
          const mx = (base.sx + prop.sx) / 2;
          const my = (base.sy + prop.sy) / 2;
          ctx.beginPath();
          ctx.arc(mx, my, 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245,158,11,0.9)';
          ctx.fill();
        }
      }
    }

    // ── Axes ─────────────────────────────────────────────────────────────
    const axisLen = S * 0.6;
    const drawAxis = (dx: number, dy: number, dz: number, colour: string, label: string) => {
      const [ox, oy] = project(...rotatePoint(0, 0, 0, rotX, rotY), fov, cx, cy);
      const [ex, ey] = project(...rotatePoint(dx * axisLen, dy * axisLen, dz * axisLen, rotX, rotY), fov, cx, cy);
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = colour;
      ctx.font = 'bold 9px Inter, sans-serif';
      ctx.fillText(label, ex + 4, ey + 3);
    };
    drawAxis(1, 0, 0, '#60a5fa', 'Volume');
    drawAxis(0, 1, 0, '#4ade80', 'Contribution');
    drawAxis(0, 0, 1, '#f59e0b', 'Active M12');

    // ── Points ────────────────────────────────────────────────────────────
    for (const p2 of proj2d) {
      const pt = points[p2.pointIdx];
      const isBaseline = pt.variant === 'baseline';
      const isPairSelected = pt.pairId === selectedPairId;
      const isHovered = pt.id === hovered;

      const r = isHovered ? 8 : isPairSelected ? 7 : 5;
      const colour = isBaseline ? '#60a5fa' : '#f59e0b';

      // Shadow glow for selected
      if (isPairSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(p2.sx, p2.sy, r + 4, 0, Math.PI * 2);
        ctx.fillStyle = isBaseline ? 'rgba(96,165,250,0.2)' : 'rgba(245,158,11,0.2)';
        ctx.fill();
      }

      ctx.beginPath();
      if (isBaseline) {
        // Circle for baseline
        ctx.arc(p2.sx, p2.sy, r, 0, Math.PI * 2);
      } else {
        // Diamond for proposal
        ctx.moveTo(p2.sx, p2.sy - r * 1.3);
        ctx.lineTo(p2.sx + r, p2.sy);
        ctx.lineTo(p2.sx, p2.sy + r * 1.3);
        ctx.lineTo(p2.sx - r, p2.sy);
        ctx.closePath();
      }
      ctx.fillStyle = colour;
      ctx.globalAlpha = isPairSelected || isHovered ? 1.0 : 0.65;
      ctx.fill();
      ctx.globalAlpha = 1;

      if (isPairSelected || isHovered) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // ── Legend ────────────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(13,17,23,0.7)';
    ctx.fillRect(10, 10, 160, 48);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(10, 10, 160, 48);

    // Baseline circle
    ctx.beginPath();
    ctx.arc(24, 27, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#60a5fa';
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Baseline (paid-led)', 34, 31);

    // Proposal diamond
    ctx.beginPath();
    ctx.moveTo(24, 44 - 6);
    ctx.lineTo(24 + 5, 44);
    ctx.lineTo(24, 44 + 6);
    ctx.lineTo(24 - 5, 44);
    ctx.closePath();
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Proposal (community)', 34, 48);

    // Disclaimer
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '8px monospace';
    ctx.fillText('SCENARIO GRID · NOT A PROBABILITY DISTRIBUTION', 10, height - 6);

  }, [points, ranges, rotX, rotY, zoom, selectedPairId, showAllEdges, hovered, width, height, fov, cx, cy, S]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ── Hit testing ──────────────────────────────────────────────────────────

  function hitTest(mx: number, my: number): ScenarioPoint | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const cx2 = (mx - rect.left) * scaleX;
    const cy2 = (my - rect.top) * scaleY;

    // Reverse order (front to back)
    const projs = [...projections.current].reverse();
    for (const p2 of projs) {
      const dx = p2.sx - cx2;
      const dy = p2.sy - cy2;
      if (Math.sqrt(dx * dx + dy * dy) <= 10) {
        return points[p2.pointIdx];
      }
    }
    return null;
  }

  // ── Mouse handlers ────────────────────────────────────────────────────────

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, rx: rotX, ry: rotY };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (dragging && dragStart.current) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setRotY(dragStart.current.ry + dx * 0.01);
      setRotX(dragStart.current.rx + dy * 0.01);
    } else {
      const hit = hitTest(e.clientX, e.clientY);
      if (hit) {
        setHovered(hit.id);
        setHoveredPoint(hit);
        const rect = canvasRef.current!.getBoundingClientRect();
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      } else {
        setHovered(null);
        setHoveredPoint(null);
        setTooltipPos(null);
      }
    }
  }

  function onMouseUp(e: React.MouseEvent) {
    if (!dragging) return;
    const dx = Math.abs(e.clientX - (dragStart.current?.x ?? e.clientX));
    const dy = Math.abs(e.clientY - (dragStart.current?.y ?? e.clientY));
    if (dx < 4 && dy < 4) {
      const hit = hitTest(e.clientX, e.clientY);
      if (hit) onSelect(hit);
    }
    setDragging(false);
    dragStart.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(3.0, z - e.deltaY * 0.001)));
  }

  const handleReset = () => { setRotX(-0.35); setRotY(0.5); setZoom(1.0); };

  // ─── Tooltip ──────────────────────────────────────────────────────────────

  function fmtUsd(n: number): string {
    if (!isFinite(n)) return '—';
    if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  }

  return (
    <div className="relative select-none" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-xl cursor-crosshair"
        style={{ width: '100%', height: '100%' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { setDragging(false); setHovered(null); setHoveredPoint(null); setTooltipPos(null); }}
        onWheel={onWheel}
      />

      {/* Reset / Fit controls */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        <button
          onClick={handleReset}
          className="px-2 py-1 text-[9px] font-mono bg-[rgba(13,17,23,0.85)] border border-white/10 rounded text-white/60 hover:text-white/90 transition-colors"
        >
          Reset View
        </button>
      </div>

      {/* Tooltip */}
      {hoveredPoint && tooltipPos && (
        <div
          className="absolute pointer-events-none z-20 rounded-lg border border-white/10 bg-[rgba(13,17,23,0.95)] p-3 text-[10px] leading-relaxed shadow-2xl"
          style={{
            left: Math.min(tooltipPos.x + 14, width - 200),
            top: Math.max(tooltipPos.y - 10, 0),
            minWidth: 180,
          }}
        >
          <div className="font-bold text-white/90 mb-1 text-[11px]">{hoveredPoint.label}</div>
          <div className="flex gap-2 mb-1">
            <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${hoveredPoint.variant === 'baseline' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {hoveredPoint.variant === 'baseline' ? '● BASELINE' : '◆ PROPOSAL'}
            </span>
          </div>
          <div className="space-y-0.5 text-white/70">
            <div>Fee: <span className="text-white font-mono">{hoveredPoint.feeBps} bps</span></div>
            <div>Community: <span className="text-white font-mono">{(hoveredPoint.communityFraction * 100).toFixed(0)}%</span></div>
            <div>Volume Y1: <span className="text-white font-mono">{fmtUsd(hoveredPoint.volumeUsd12m)}</span></div>
            <div>Contribution: <span className={`font-mono ${hoveredPoint.contribution12m >= 0 ? 'text-green-400' : 'text-red-400'}`}>{fmtUsd(hoveredPoint.contribution12m)}</span></div>
            <div>Active M12: <span className="text-white font-mono">{Math.round(hoveredPoint.activeM12)}</span></div>
          </div>
          <div className="mt-1.5 text-[8px] text-white/30 font-mono">ASSUMED MODEL OUTPUT</div>
        </div>
      )}
    </div>
  );
}
