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
  topic: string;
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
      topic: attempt.topic,
      quizTitle: attempt.quiz_title,
    }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-900">{data.quizTitle}</p>
          <p className="text-sm text-gray-600">Topic: {data.topic}</p>
          <p className="text-sm text-gray-600">Date: {data.date}</p>
          <p className="text-lg font-bold text-brand-600 mt-1">Score: {data.score}%</p>
        </div>
      );
    }
    return null;
  };

  if (attempts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No performance data available yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'Score (%)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#7C3AED"
            strokeWidth={2}
            dot={{ fill: '#7C3AED', r: 4 }}
            activeDot={{ r: 6 }}
            name="Performance"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
