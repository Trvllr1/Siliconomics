import { useMemo } from 'react';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
  LineChart, Line,
} from 'recharts';
import { getTimeProjections } from '../lib/engineAccess';
import ProvenanceStamp from './ProvenanceStamp';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-1 border border-art-ink/15 rounded-lg shadow-[0_24px_60px_rgba(0,0,0,0.45)] p-3 font-mono text-xs">
      <p className="text-art-ink/60 text-[10px] mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-bold">
          {entry.name}: {entry.name === 'D0' ? Number(entry.value).toFixed(3) : `$${Number(entry.value).toFixed(1)}M`}
        </p>
      ))}
    </div>
  );
};

export default function ProgramChart() {
  const projections = getTimeProjections();

  const data = useMemo(() => {
    if (!projections.length) return [];
    return projections.map(q => ({
      quarter: q.label,
      revenue: q.revenueM,
      cogs: q.cogsM,
      cashflow: q.cumulativeCashFlowM,
      profit: q.netProfitM,
      d0: q.d0 ?? null,
    }));
  }, [projections]);

  // Find break-even quarter
  const breakEvenLabel = useMemo(() => {
    if (!data.length) return null;
    const be = data.find(d => d.cashflow >= 0);
    return be?.quarter ?? null;
  }, [data]);

  // D0 data for mini-chart
  const d0Data = useMemo(() => {
    return data.filter(d => d.d0 !== null).map(d => ({ quarter: d.quarter, d0: d.d0 }));
  }, [data]);

  if (!data.length) {
    return (
      <div className="glow-card rounded-lg p-6 text-center">
        <p className="text-sm text-art-ink/60 font-mono">No time model data available</p>
      </div>
    );
  }

  return (
    <div className="glow-card rounded-lg p-6">
      <h3 className="text-sm font-bold text-art-ink mb-1 font-mono">20-Quarter Program View</h3>
      <p className="text-[10px] font-mono text-art-ink/60 mb-4">Cumulative cash flow with break-even marker</p>

      {/* Main cash flow chart */}
      <div className="h-64" role="img" aria-label="20-quarter cumulative cash flow chart with break-even marker">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cfGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00BFA6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00BFA6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(240,246,252,0.06)" />
            <XAxis
              dataKey="quarter"
              tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: 'rgba(240,246,252,0.6)' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(240,246,252,0.12)' }}
              interval={3}
            />
            <YAxis
              tick={{ fontSize: 9, fontFamily: 'JetBrains Mono', fill: 'rgba(240,246,252,0.6)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${v}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            {breakEvenLabel && (
              <ReferenceLine
                x={breakEvenLabel}
                stroke="#34D399"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Break-even ${breakEvenLabel}`,
                  position: 'top',
                  fill: '#34D399',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono',
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="cashflow"
              stroke="#00BFA6"
              fill="url(#cfGradient)"
              strokeWidth={2}
              name="Cash Flow"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* D0 yield-learning mini-chart */}
      {d0Data.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-mono text-art-ink/60 mb-2">D0 Yield Learning Curve</p>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d0Data} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="quarter"
                  tick={{ fontSize: 8, fontFamily: 'JetBrains Mono', fill: 'rgba(240,246,252,0.55)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(240,246,252,0.1)' }}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 8, fontFamily: 'JetBrains Mono', fill: 'rgba(240,246,252,0.55)' }}
                  tickLine={false}
                  axisLine={false}
                  domain={['dataMin - 0.01', 'dataMax + 0.01']}
                  tickFormatter={(v: number) => v.toFixed(2)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="d0"
                  stroke="#FBBF24"
                  strokeWidth={1.5}
                  dot={false}
                  name="D0"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Hidden data table for accessibility */}
      <table className="sr-only" aria-hidden="false">
        <caption className="text-art-ink">20-quarter program cash flow data</caption>
        <thead>
          <tr>
            <th>Quarter</th>
            <th>Cash Flow ($M)</th>
          </tr>
        </thead>
        <tbody>
          {data.map(d => (
            <tr key={d.quarter}>
              <td>{d.quarter}</td>
              <td>{d.cashflow.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-center text-[10px] font-mono text-art-ink/50 mt-3">
        Default Build: {projections.length} quarters · computed from timeEngine
      </p>
      <ProvenanceStamp className="mt-3" />
    </div>
  );
}
