import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Filter, Download, RefreshCw, Activity,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { listIOCs } from '../services/api';
import CopyButton from '../components/ui/CopyButton';

const IOC_TYPES = ['All Types', 'IPv4', 'IPv6', 'Domain', 'URL', 'Email', 'MD5', 'SHA1', 'SHA256'];
const PAGE_SIZE = 50;

export default function IOCExplorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [iocs, setIOCs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [catFilter, setCatFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      };
      if (search.trim()) params.search = search.trim();
      if (typeFilter !== 'All Types') params.type = typeFilter;
      if (catFilter !== 'all') params.category = catFilter;

      const data = await listIOCs(params);
      setIOCs(data.items);
      setTotal(data.total);
    } catch {
      setIOCs([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, catFilter]);

  useEffect(() => { load(); }, [load]);

  // Sync search param
  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearch(q);
  }, []);

  const exportCSV = () => {
    const header = 'Type,Value,Category';
    const rows = iocs.map((i) => `"${i.type}","${i.value}","${i.category}"`);
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'iocs_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 max-w-[1400px] space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">IOC Explorer</h1>
          <p className="text-sm text-gray-400 mt-1">
            Browse, filter and export all extracted indicators of compromise
          </p>
        </div>
        <button onClick={exportCSV} className="btn-secondary" disabled={iocs.length === 0}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="panel p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by value…"
            className="input-field pl-9"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
          className="input-field w-auto"
        >
          {IOC_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>

        <select
          value={catFilter}
          onChange={(e) => { setCatFilter(e.target.value); setPage(0); }}
          className="input-field w-auto"
        >
          <option value="all">All Categories</option>
          <option value="network">Network</option>
          <option value="file">File</option>
        </select>

        <button onClick={() => { setSearch(''); setTypeFilter('All Types'); setCatFilter('all'); setPage(0); }}
          className="btn-ghost">
          <Filter size={14} /> Reset
        </button>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1F2937]">
          <p className="text-sm text-gray-400">
            {loading ? 'Loading…' : `${total.toLocaleString()} indicator${total !== 1 ? 's' : ''}`}
          </p>
          <button onClick={load} className="btn-ghost text-xs">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 gap-3">
            <RefreshCw size={18} className="animate-spin" />
            Loading indicators…
          </div>
        ) : iocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Activity size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No indicators found</p>
            <p className="text-xs mt-1 text-gray-600">Run a threat analysis to populate this view</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1F2937]">
                  {['#', 'Type', 'Indicator', 'Category', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {iocs.map((ioc, idx) => (
                  <tr key={ioc.id ?? idx} className="border-t border-[#1F2937] hover:bg-[#1a2235] transition-colors">
                    <td className="px-4 py-2.5 text-xs text-gray-600 tabular-nums">
                      {page * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        {ioc.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-sm text-gray-200 max-w-sm break-all">
                      {ioc.value}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-500 capitalize">
                      {ioc.category}
                    </td>
                    <td className="px-4 py-2.5">
                      <CopyButton text={ioc.value} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#1F2937]">
            <span className="text-xs text-gray-500">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
