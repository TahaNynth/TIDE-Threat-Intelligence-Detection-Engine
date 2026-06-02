import { clsx } from 'clsx';

interface Props {
  level: string;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

const STYLES: Record<string, string> = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Low: 'bg-green-500/15 text-green-400 border-green-500/30',
};

const DOTS: Record<string, string> = {
  Critical: 'bg-red-400',
  High: 'bg-amber-400',
  Medium: 'bg-blue-400',
  Low: 'bg-green-400',
};

export default function RiskBadge({ level, score, size = 'sm' }: Props) {
  const style = STYLES[level] || STYLES['Low'];
  const dot = DOTS[level] || DOTS['Low'];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 border rounded-full font-medium',
        style,
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'md' && 'text-sm px-3 py-1',
        size === 'lg' && 'text-base px-4 py-1.5'
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', dot)} />
      {level}
      {score !== undefined && <span className="opacity-70">({score})</span>}
    </span>
  );
}
