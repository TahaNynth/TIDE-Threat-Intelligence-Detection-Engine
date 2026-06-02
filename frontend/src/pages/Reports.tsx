import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Trash2, Download, ExternalLink, RefreshCw, Search,
} from 'lucide-react';
import { listAnalyses, deleteAnalysis, exportIOCsCSVUrl, exportJSONUrl } from '../services/api';
import RiskBadge from '../components/ui/RiskBadge';
import toast from 'react-hot-toast';

export default function Reports() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAnalyses();
      setAnalyses(data);
      setFiltered(data);
    } catch { setAnalyses([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(analyses.filter((a) => a.title.toLowerCase().includes(q) || a.risk_level?.toLowerCase().includes(q)));
  }, [search, analyses]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete analysis "${title}"? This cannot be undone.`)) return;
    try {
      await deleteAnalysis(id);
      toast.success('Analysis deleted');
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="p-6 max-w-[1400px] space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-sm text-gray-400 mt-1">
            Full history of threat intelligence analyses
          </p>
        </div>
        <button onClick={() => navigate('/analyze')} className="btn-primary">
          + New Analysis
        </button>
      </div>

      <div className="panel p-4 flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or risk level…"
            className="input-field pl-9"
          />
        </div>
        <button onClick={load} className="btn-ghost">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="panel overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 gap-3">
            <RefreshCw size={18} className="animate-spin" /> Loading reports…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <FileText size={36} className="mb-4 opacity-30" />
            <p className="text-sm font-medium">No reports found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1F2937]">
                  {['Report Title', 'Date', 'Risk', 'IOCs', 'Techniques', 'Rules', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-t border-[#1F2937] hover:bg-[#1a2235] transition-colors">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/analyze?id=${a.id}`)}
                        className="text-sm font-medium text-gray-200 hover:text-blue-400 text-left truncate max-w-xs transition-colors"
                      >
                        {a.title}
                      </button>
                      <p className="text-xs text-gray-600 font-mono mt-0.5">{a.id.slice(0, 8)}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(a.created_at)}</td>
                    <td className="px-4 py-3"><RiskBadge level={a.risk_level} score={a.risk_score} /></td>
                    <td className="px-4 py-3 text-sm text-gray-300 tabular-nums">{a.ioc_count ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 tabular-nums">{a.technique_count ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 tabular-nums">{a.rule_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <a
                          href={exportJSONUrl(a.id)}
                          download
                          className="btn-ghost text-xs px-2 py-1"
                          title="Export JSON"
                        >
                          <Download size={13} />
                        </a>
                        <a
                          href={exportIOCsCSVUrl(a.id)}
                          download
                          className="btn-ghost text-xs px-2 py-1"
                          title="Export IOCs CSV"
                        >
                          CSV
                        </a>
                        <button
                          onClick={() => navigate(`/analyze?id=${a.id}`)}
                          className="btn-ghost text-xs px-2 py-1"
                          title="View analysis"
                        >
                          <ExternalLink size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(a.id, a.title)}
                          className="btn-ghost text-xs px-2 py-1 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 text-center">
        {filtered.length} report{filtered.length !== 1 ? 's' : ''}
        {search && ` matching "${search}"`}
      </p>
    </div>
  );
}
