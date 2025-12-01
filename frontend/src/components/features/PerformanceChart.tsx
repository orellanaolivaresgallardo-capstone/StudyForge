import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { RecentAttempt } from '@/types';

export interface PerformanceChartProps {
  attempts: RecentAttempt[];
  height?: number;
}

interface ChartDataPoint {
  date: string;
  score: number;
  quizTitle: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ attempts, height = 300 }) => {
  // Transform data for chart
  const chartData: ChartDataPoint[] = attempts
    .slice()
    .reverse() // Most recent last
    .map((attempt) => ({
      date: new Date(attempt.completed_at).toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
      }),
      score: Math.round(attempt.score),
      quizTitle: attempt.quiz_title,
    }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-violet-500/50 p-3 rounded-lg shadow-xl backdrop-blur-sm">
          <p className="font-semibold text-white">{data.quizTitle}</p>
          <p className="text-sm text-slate-300">Fecha: {data.date}</p>
          <p className="text-lg font-bold text-violet-400 mt-1">Puntaje: {data.score}%</p>
        </div>
      );
    }
    return null;
  };

  if (attempts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/5 border border-white/10 rounded-lg">
        <p className="text-slate-400">No hay datos de rendimiento disponibles aún.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/30 rounded-xl p-4 border border-white/5">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="#94a3b8"
            style={{ fontSize: '12px', fill: '#cbd5e1' }}
            tick={{ fill: '#cbd5e1' }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#94a3b8"
            style={{ fontSize: '12px', fill: '#cbd5e1' }}
            tick={{ fill: '#cbd5e1' }}
            label={{
              value: 'Puntaje (%)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: '12px', fill: '#cbd5e1' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '14px', color: '#e2e8f0' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#a78bfa"
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', stroke: '#a78bfa', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, fill: '#c4b5fd', stroke: '#a78bfa', strokeWidth: 2 }}
            name="Rendimiento"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
