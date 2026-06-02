import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

const LEVEL_COLOR: Record<string, string> = {
  Low: '#22C55E',
  Medium: '#3B82F6',
  High: '#F59E0B',
  Critical: '#EF4444',
};

interface Props {
  score: number;
  level: string;
}

export default function RiskGauge({ score, level }: Props) {
  const color = LEVEL_COLOR[level] || '#6B7280';
  const data = [{ value: score, fill: color }];

  return (
    <div className="relative flex flex-col items-center">
      <ResponsiveContainer width={180} height={120}>
        <RadialBarChart
          innerRadius="60%"
          outerRadius="90%"
          data={data}
          startAngle={180}
          endAngle={0}
          cy="95%"
        >
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            background={{ fill: '#1a2235' }}
            max={100}
          />
        </RadialBarChart>
      </ResponsiveContainer>

      <div className="absolute bottom-0 inset-x-0 flex flex-col items-center" style={{ bottom: '4px' }}>
        <span className="text-3xl font-bold text-white tabular-nums">{score}</span>
        <span
          className="text-sm font-semibold mt-0.5"
          style={{ color }}
        >
          {level}
        </span>
      </div>
    </div>
  );
}
