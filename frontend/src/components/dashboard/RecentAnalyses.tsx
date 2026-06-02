import { useNavigate } from 'react-router-dom';
import { ExternalLink, Clock } from 'lucide-react';
import RiskBadge from '../ui/RiskBadge';
import type { AnalysisSummary } from '../../types';

interface Props {
  analyses: AnalysisSummary[];
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function RecentAnalyses({ analyses }: Props) {
  const navigate = useNavigate();

  if (!analyses || analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Clock size={32} className="mb-3 opacity-40" />
        <p className="text-sm">No analyses yet. Run your first threat analysis.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {['Report Title', 'Date', 'Risk', 'IOCs', 'Techniques', 'Rules', ''].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-[#1F2937]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {analyses.map((a) => (
            <tr
              key={a.id}
              className="border-t border-[#1F2937] hover:bg-[#1a2235] transition-colors cursor-pointer"
              onClick={() => navigate(`/analyze?id=${a.id}`)}
            >
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-gray-200 truncate max-w-xs">
                  {a.title}
                </p>
              </td>
              <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                {fmtDate(a.created_at)}
              </td>
              <td className="px-4 py-3">
                <RiskBadge level={a.risk_level} score={a.risk_score} />
              </td>
              <td className="px-4 py-3 text-sm text-gray-300 tabular-nums">
                {a.ioc_count ?? 0}
              </td>
              <td className="px-4 py-3 text-sm text-gray-300 tabular-nums">
                {a.technique_count ?? 0}
              </td>
              <td className="px-4 py-3 text-sm text-gray-300 tabular-nums">
                {a.rule_count ?? 0}
              </td>
              <td className="px-4 py-3">
                <ExternalLink size={14} className="text-gray-500 hover:text-blue-400 transition-colors" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
