import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const COLORS = [
  '#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444',
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#A78BFA',
];

interface Props {
  data: Array<{ tactic: string; count: number }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a2235] border border-[#1F2937] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-base font-bold text-white">{payload[0].value} technique{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    );
  }
  return null;
};

export default function TacticsBarChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No tactic data available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    tactic: d.tactic.length > 12 ? d.tactic.substring(0, 11) + '…' : d.tactic,
    fullTactic: d.tactic,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <XAxis
          dataKey="tactic"
          tick={{ fontSize: 10, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6B7280' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
