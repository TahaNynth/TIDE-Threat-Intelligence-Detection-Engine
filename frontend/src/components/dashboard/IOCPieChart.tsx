import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#3B82F6', '#8B5CF6', '#22C55E', '#F59E0B', '#EF4444',
  '#06B6D4', '#EC4899', '#84CC16',
];

interface Props {
  data: Array<{ type: string; count: number }>;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a2235] border border-[#1F2937] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-sm font-medium text-gray-200">{payload[0].name}</p>
        <p className="text-lg font-bold text-white">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function IOCPieChart({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No IOC data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="type"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={45}
          paddingAngle={3}
          strokeWidth={0}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-gray-400">{value}</span>
          )}
          wrapperStyle={{ paddingTop: '12px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
