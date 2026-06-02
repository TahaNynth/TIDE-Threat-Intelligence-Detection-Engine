import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Activity, FileCode2, Target,
  ShieldAlert, TrendingUp, RefreshCw,
} from 'lucide-react';
import { getDashboardStats } from '../services/api';
import type { DashboardStats } from '../types';
import StatCard from '../components/ui/StatCard';
import IOCPieChart from '../components/dashboard/IOCPieChart';
import TacticsBarChart from '../components/dashboard/TacticsBarChart';
import RecentAnalyses from '../components/dashboard/RecentAnalyses';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <RefreshCw size={20} className="animate-spin" />
          <span>Loading dashboard…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="panel p-6 text-center space-y-4">
          <ShieldAlert size={40} className="text-red-400 mx-auto" />
          <div>
            <p className="text-gray-200 font-medium">Backend Unavailable</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <p className="text-xs text-gray-600 mt-2">
              Make sure the Flask backend is running: <code className="text-blue-400">python app.py</code>
            </p>
          </div>
          <button onClick={load} className="btn-primary mx-auto">
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const riskDist = ['Critical', 'High', 'Medium', 'Low'].map((level) => ({
    level,
    count: stats?.risk_distribution.find((r) => r.risk_level === level)?.count || 0,
  }));

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Overview</h1>
          <p className="text-sm text-gray-400 mt-1">
            Threat intelligence analysis platform — real-time detection pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="btn-ghost">
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            onClick={() => navigate('/analyze')}
            className="btn-primary"
          >
            <ShieldAlert size={16} />
            New Analysis
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Threat Reports Analyzed"
          value={stats?.total_analyses ?? 0}
          icon={BarChart3}
          iconColor="text-blue-400"
          subtitle="All time"
        />
        <StatCard
          label="IOCs Extracted"
          value={stats?.total_iocs ?? 0}
          icon={Activity}
          iconColor="text-green-400"
          subtitle="Network + file indicators"
        />
        <StatCard
          label="ATT&CK Techniques"
          value={stats?.total_techniques ?? 0}
          icon={Target}
          iconColor="text-amber-400"
          subtitle="Mapped across all analyses"
        />
        <StatCard
          label="Detection Rules"
          value={stats?.total_rules ?? 0}
          icon={FileCode2}
          iconColor="text-purple-400"
          subtitle="Sigma + YARA + Snort"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* IOC Distribution */}
        <div className="panel p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200">IOC Distribution</h2>
            <Activity size={16} className="text-gray-500" />
          </div>
          <IOCPieChart data={stats?.ioc_types ?? []} />
        </div>

        {/* Tactic coverage */}
        <div className="panel p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200">ATT&CK Tactic Coverage</h2>
            <Target size={16} className="text-gray-500" />
          </div>
          <TacticsBarChart data={stats?.tactic_counts ?? []} />
        </div>
      </div>

      {/* Risk distribution & Quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="panel p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Risk Distribution</h2>
          <div className="space-y-3">
            {riskDist.map(({ level, count }) => {
              const pct = stats?.total_analyses
                ? Math.round((count / stats.total_analyses) * 100)
                : 0;
              const colors: Record<string, string> = {
                Critical: 'bg-red-500',
                High: 'bg-amber-500',
                Medium: 'bg-blue-500',
                Low: 'bg-green-500',
              };
              return (
                <div key={level}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{level}</span>
                    <span className="text-gray-300 tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 bg-[#1a2235] rounded-full">
                    <div
                      className={`h-full rounded-full ${colors[level]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top IOC types */}
        <div className="panel p-5 lg:col-span-3">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Top Indicator Types</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(stats?.ioc_types ?? []).slice(0, 6).map(({ type, count }) => (
              <div
                key={type}
                className="bg-[#0B1220] border border-[#1F2937] rounded-lg px-3 py-2.5"
              >
                <p className="text-xs text-gray-500">{type}</p>
                <p className="text-xl font-bold text-white tabular-nums mt-0.5">
                  {count.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent analyses */}
      <div className="panel">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F2937]">
          <h2 className="text-sm font-semibold text-gray-200">Recent Analyses</h2>
          <button
            onClick={() => navigate('/reports')}
            className="btn-ghost text-xs"
          >
            View all <TrendingUp size={12} />
          </button>
        </div>
        <RecentAnalyses analyses={stats?.recent_analyses ?? []} />
      </div>
    </div>
  );
}
