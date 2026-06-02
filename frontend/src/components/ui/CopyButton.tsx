import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  text: string;
  className?: string;
}

export default function CopyButton({ text, className }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200',
        copied
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : 'bg-[#1a2235] text-gray-400 hover:text-gray-200 border border-[#1F2937] hover:border-[#374151]',
        className
      )}
      title="Copy to clipboard"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}
