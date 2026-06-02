import { clsx } from 'clsx';

const STYLES: Record<string, string> = {
  High: 'bg-green-500/15 text-green-400 border-green-500/30',
  Medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Low: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

export default function ConfidenceBadge({ level }: { level: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border',
        STYLES[level] || STYLES['Low']
      )}
    >
      {level}
    </span>
  );
}
