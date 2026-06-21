"use client";

import { motion } from "framer-motion";

interface TrendPoint {
  label: string;
  ppi: number;
  mpi: number;
  cpi: number;
}

interface PerformanceTrendChartProps {
  data: TrendPoint[];
}

export default function PerformanceTrendChart({ data }: PerformanceTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 border border-zinc-900 bg-zinc-950/40 rounded-3xl p-6 text-zinc-500 font-bold uppercase text-xs tracking-wider">
        No assessment data logged yet
      </div>
    );
  }

  // Dimension setup for standard mobile screen ratio
  const width = 500;
  const height = 240;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // X coordinate mapper
  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index * chartWidth) / (data.length - 1);
  };

  // Y coordinate mapper (Score 0 to 10)
  const getY = (value: number) => {
    const val = Math.max(0, Math.min(10, value));
    return paddingTop + chartHeight - (val * chartHeight) / 10;
  };

  // Helper to build line path string
  const buildPath = (key: "ppi" | "mpi" | "cpi") => {
    if (data.length <= 1) return "";
    return data
      .map((point, index) => {
        const x = getX(index);
        const y = getY(point[key]);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  const ppiPath = buildPath("ppi");
  const mpiPath = buildPath("mpi");
  const cpiPath = buildPath("cpi");

  // Grid line values
  const yGridLines = [2, 4, 6, 8, 10];

  return (
    <div className="bg-zinc-950/60 border border-zinc-900 rounded-3xl p-5 shadow-2xl relative overflow-hidden select-none">
      {/* Subtle Glow Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
          Performance Trends
        </h4>
        
        {/* Legend */}
        <div className="flex items-center gap-3 text-[9px] font-black tracking-wider uppercase">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-orange-500 rounded-full inline-block shadow-[0_0_8px_#f97316]" />
            <span className="text-white">CPI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-t border-dashed border-zinc-400 inline-block" />
            <span className="text-zinc-400">PPI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-500 inline-block" />
            <span className="text-zinc-500">MPI</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            {/* Smooth Premium Orange Glow Filter */}
            <filter id="glow-cpi" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Subtle light glow for secondary metrics */}
            <filter id="glow-subtle" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines & Y Axis Labels */}
          {yGridLines.map((val) => {
            const y = getY(val);
            return (
              <g key={val} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1f2937"
                  strokeWidth={0.8}
                  strokeDasharray="2 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#6b7280"
                  className="text-[9px] font-bold font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X Axis Line */}
          <line
            x1={paddingLeft}
            y1={getY(0)}
            x2={width - paddingRight}
            y2={getY(0)}
            stroke="#111827"
            strokeWidth={1.5}
          />

          {/* X Axis Labels */}
          {data.map((point, index) => {
            const x = getX(index);
            return (
              <text
                key={index}
                x={x}
                y={height - paddingBottom + 18}
                textAnchor="middle"
                fill="#4b5563"
                className="text-[9px] font-black uppercase tracking-tight"
              >
                {point.label}
              </text>
            );
          })}

          {/* Trend lines with drawing animations */}
          {data.length > 1 && (
            <>
              {/* MPI Line (Amber/Orange) */}
              <motion.path
                d={mpiPath}
                fill="none"
                stroke="#d97706"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />

              {/* PPI Line (Zinc/White - Dashed) */}
              <motion.path
                d={ppiPath}
                fill="none"
                stroke="#9ca3af"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />

              {/* CPI Line (Solid Premium Orange with glow) */}
              <motion.path
                d={cpiPath}
                fill="none"
                stroke="#f97316"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow-cpi)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </>
          )}

          {/* Data Points Dots */}
          {data.map((point, index) => {
            const x = getX(index);
            const yCpi = getY(point.cpi);
            const yPpi = getY(point.ppi);
            const yMpi = getY(point.mpi);

            return (
              <g key={index}>
                {/* PPI Dot */}
                <circle
                  cx={x}
                  cy={yPpi}
                  r={3}
                  fill="#111827"
                  stroke="#9ca3af"
                  strokeWidth={1.5}
                />
                {/* MPI Dot */}
                <circle
                  cx={x}
                  cy={yMpi}
                  r={3}
                  fill="#111827"
                  stroke="#d97706"
                  strokeWidth={1.5}
                />
                {/* CPI Glow ring */}
                <circle
                  cx={x}
                  cy={yCpi}
                  r={5}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth={1}
                  className="animate-pulse"
                />
                {/* CPI Main Dot */}
                <circle
                  cx={x}
                  cy={yCpi}
                  r={3.5}
                  fill="#fff"
                  stroke="#f97316"
                  strokeWidth={2}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
