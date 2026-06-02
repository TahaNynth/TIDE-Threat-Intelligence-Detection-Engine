import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Wifi, WifiOff } from 'lucide-react';
import { healthCheck } from '../../services/api';

export default function TopNav() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const ok = await healthCheck();
      if (mounted) setOnline(ok);
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/iocs?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="h-14 bg-[#111827] border-b border-[#1F2937] flex items-center px-4 gap-4 shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2 shrink-0">
        <Shield size={20} className="text-blue-400" />
        <span className="text-sm font-semibold text-white hidden sm:block">
          <span className="tracking-widest font-bold">TIDE</span>
        </span>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search IOCs, hashes, domains..."
            className="w-full bg-[#0B1220] border border-[#1F2937] rounded-lg pl-9 pr-3 py-1.5
                       text-sm text-gray-300 placeholder-gray-600 focus:outline-none
                       focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </form>

      <div className="flex items-center gap-3 ml-auto">
        {/* Backend status indicator */}
        <div className="flex items-center gap-1.5">
          {online === null ? (
            <span className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
          ) : online ? (
            <>
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-green-400 hidden sm:block">API Online</span>
              <Wifi size={13} className="text-green-400 hidden sm:block" />
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 hidden sm:block">API Offline</span>
              <WifiOff size={13} className="text-red-400 hidden sm:block" />
            </>
          )}
        </div>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600
                        flex items-center justify-center text-xs font-bold text-white shrink-0">
          SOC
        </div>
      </div>
    </header>
  );
}
