import { useState, useRef, useCallback } from 'react';
import {
  FileText, Upload, Clipboard, X, AlertCircle, Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  onAnalyze: (text: string, title?: string) => void;
  onAnalyzeFile: (file: File) => void;
  loading: boolean;
}

const MAX_CHARS = 500_000;

export default function ReportInput({ onAnalyze, onAnalyzeFile, loading }: Props) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [tab, setTab] = useState<'paste' | 'upload'>('paste');
  const [dragOver, setDragOver] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const [fileError, setFileError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const ALLOWED = ['text/plain', 'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const handleFile = useCallback((file: File) => {
    setFileError('');
    if (!ALLOWED.includes(file.type) && !file.name.match(/\.(txt|pdf|docx)$/i)) {
      setFileError('Unsupported file type. Please upload PDF, TXT, or DOCX.');
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      setFileError('File exceeds 16 MB limit.');
      return;
    }
    const kb = file.size < 1024 ? `${file.size} B` : `${(file.size / 1024).toFixed(1)} KB`;
    setFileInfo({ name: file.name, size: kb });
    onAnalyzeFile(file);
  }, [onAnalyzeFile]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const t = await navigator.clipboard.readText();
      setText(t.slice(0, MAX_CHARS));
    } catch {
      // Browser may not allow clipboard access without user gesture
    }
  };

  const charPercent = Math.min((text.length / MAX_CHARS) * 100, 100);

  return (
    <div className="panel p-6 space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-[#0B1220] p-1 rounded-lg w-fit">
        {(['paste', 'upload'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              tab === t
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200'
            )}
          >
            {t === 'paste' ? <Clipboard size={15} /> : <Upload size={15} />}
            {t === 'paste' ? 'Paste Report' : 'Upload File'}
          </button>
        ))}
      </div>

      {tab === 'paste' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Report title (optional)"
              className="input-field max-w-sm"
              maxLength={120}
            />
            <button
              onClick={handlePasteFromClipboard}
              className="btn-ghost text-xs"
              type="button"
            >
              <Clipboard size={13} /> Paste from clipboard
            </button>
          </div>

          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder={`Paste your threat intelligence report here…\n\nSupports raw text, IOC feeds, blog excerpts, incident reports, and CTI advisories.\nThe engine will automatically extract IOCs, map ATT&CK techniques, and generate detection rules.`}
              className="w-full h-72 bg-[#0B1220] border border-[#1F2937] rounded-xl px-4 py-3
                         text-sm text-gray-300 placeholder-gray-600 resize-none font-mono
                         focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20
                         transition-all duration-150 leading-relaxed"
            />
            {text && (
              <button
                onClick={() => setText('')}
                className="absolute top-3 right-3 text-gray-600 hover:text-gray-400 transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Char counter */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1 bg-[#1a2235] rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all',
                  charPercent > 90 ? 'bg-amber-500' : 'bg-blue-600'
                )}
                style={{ width: `${charPercent}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 tabular-nums shrink-0">
              {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => onAnalyze(text, title || undefined)}
            disabled={loading || text.trim().length < 10}
            className="btn-primary w-full justify-center py-3"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Analyzing report…
              </>
            ) : (
              <>
                <FileText size={16} />
                Run Analysis
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={clsx(
              'border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center',
              'cursor-pointer transition-all duration-200',
              dragOver
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-[#1F2937] hover:border-[#374151] hover:bg-[#1a2235]'
            )}
          >
            <Upload size={36} className="text-gray-600 mb-4" />
            <p className="text-gray-300 font-medium text-base">
              Drop your report here, or click to browse
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Supports PDF, TXT, DOCX — up to 16 MB
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.docx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>

          {fileError && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <AlertCircle size={15} />
              {fileError}
            </div>
          )}

          {fileInfo && (
            <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3">
              <FileText size={16} className="text-blue-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-200 font-medium">{fileInfo.name}</p>
                <p className="text-xs text-gray-500">{fileInfo.size}</p>
              </div>
              {loading && <Loader2 size={16} className="text-blue-400 animate-spin" />}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
