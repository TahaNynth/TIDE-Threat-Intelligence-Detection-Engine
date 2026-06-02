import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: string;
  trendUp?: boolean;
  subtitle?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-blue-400',
  trend,
  trendUp,
  subtitle,
}: Props) {
  return (
    <div className="panel card-hover p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            {label}
          </p>
          <p className="text-3xl font-bold text-white tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <p
              className={clsx(
                'text-xs mt-2 font-medium',
                trendUp ? 'text-green-400' : 'text-gray-500'
              )}
            >
              {trend}
            </p>
          )}
        </div>
        <div
          className={clsx(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            'bg-[#1a2235] border border-[#1F2937]'
          )}
        >
          <Icon size={20} className={iconColor} />
        </div>
      </div>
    </div>
  );
}
