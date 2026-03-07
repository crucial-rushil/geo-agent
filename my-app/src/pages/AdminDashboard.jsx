import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Users, BarChart3, TrendingUp, Globe, Github, FileText,
  Lock, Eye, EyeOff, RefreshCw, Activity, Crown, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import logoImage from '../assets/geode-logo.png';

const MODE_COLORS = { url: '#06b6d4', github: '#a855f7', text: '#f59e0b' };
const MODE_LABELS = { url: 'Site Audit', github: 'GitHub Repo', text: 'Text' };
const CHART_COLORS = ['#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#f43f5e'];

function StatCard({ icon: Icon, label, value, color = 'cyan', sub }) {
  const colorMap = {
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-200',
    purple: 'from-purple-500 to-purple-600 shadow-purple-200',
    amber: 'from-amber-500 to-amber-600 shadow-amber-200',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-200',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[color]} shadow-lg`}>
        <Icon className="size-6 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm ${className}`}>
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('geode_admin_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchStats = useCallback(async (key) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/stats?key=${encodeURIComponent(key)}`);
      if (res.status === 401) throw new Error('Invalid admin key');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const json = await res.json();
      setData(json);
      setAuthenticated(true);
      setLastRefresh(new Date());
      localStorage.setItem('geode_admin_key', key);
    } catch (err) {
      setError(err.message);
      setAuthenticated(false);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    fetchStats(adminKey);
  };

  const handleRefresh = () => fetchStats(adminKey);

  // Auto-login if key is stored
  useEffect(() => {
    if (adminKey && !authenticated && !data) fetchStats(adminKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr.includes('T') || dateStr.includes(' ') ? dateStr + 'Z' : dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  const formatChartDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ── Login Screen ──
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <form
          onSubmit={handleLogin}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 w-full max-w-md shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600">
              <Lock className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-slate-400">Enter your admin key to continue</p>
            </div>
          </div>

          <div className="relative mb-6">
            <input
              type={showKey ? 'text' : 'password'}
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin secret key"
              className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              {showKey ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !adminKey}
            className="w-full py-3 px-6 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 transition-all"
          >
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>

          <Link to="/" className="block text-center text-sm text-slate-500 hover:text-slate-300 mt-6 transition-colors">
            ← Back to home
          </Link>
        </form>
      </div>
    );
  }

  // ── Dashboard ──
  const pieData = (data.mode_breakdown || []).map((m) => ({
    name: MODE_LABELS[m.mode] || m.mode,
    value: m.count,
    color: MODE_COLORS[m.mode] || '#94a3b8',
  }));

  // Merge daily_analyses and daily_signups into one timeline
  const dateMap = {};
  (data.daily_analyses || []).forEach((d) => {
    dateMap[d.date] = { ...(dateMap[d.date] || {}), date: d.date, analyses: d.count };
  });
  (data.daily_signups || []).forEach((d) => {
    dateMap[d.date] = { ...(dateMap[d.date] || {}), date: d.date, signups: d.count };
  });
  const timeline = Object.values(dateMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({ ...d, analyses: d.analyses || 0, signups: d.signups || 0, label: formatChartDate(d.date) }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-sm">
              <ArrowLeft className="size-4" />
              Home
            </Link>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Geode" className="h-7" />
              <h1 className="text-lg font-bold text-slate-900">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-xs text-slate-400">
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => { setAuthenticated(false); setData(null); localStorage.removeItem('geode_admin_key'); }}
              className="text-sm text-slate-500 hover:text-red-600 transition-colors"
            >
              Lock
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={Users} label="Total Users" value={data.total_users} color="cyan" />
          <StatCard icon={BarChart3} label="Total Analyses" value={data.total_analyses} color="purple" />
          <StatCard
            icon={TrendingUp}
            label="Avg SEO Score"
            value={data.avg_score || '—'}
            color="emerald"
            sub="across all audits"
          />
          <StatCard
            icon={Activity}
            label="Analyses / User"
            value={data.total_users ? (data.total_analyses / data.total_users).toFixed(1) : '0'}
            color="amber"
            sub="engagement ratio"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Activity Timeline */}
          <ChartCard title="Activity (Last 30 Days)" className="lg:col-span-2">
            {timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="analysesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="signupsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px', border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: '13px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone" dataKey="analyses" stroke="#a855f7"
                    fillOpacity={1} fill="url(#analysesFill)" strokeWidth={2}
                    name="Analyses"
                  />
                  <Area
                    type="monotone" dataKey="signups" stroke="#06b6d4"
                    fillOpacity={1} fill="url(#signupsFill)" strokeWidth={2}
                    name="Sign-ups"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
                No activity data yet
              </div>
            )}
          </ChartCard>

          {/* Mode Breakdown Pie */}
          <ChartCard title="Analysis Types">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                    paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
                No data yet
              </div>
            )}
          </ChartCard>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top Users */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Crown className="size-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700">Top Users</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {(data.top_users || []).map((u, i) => (
                <div key={i} className="px-6 py-3 flex items-center gap-3 hover:bg-slate-50">
                  <span className="text-xs font-bold text-slate-400 w-5">#{i + 1}</span>
                  {u.picture_url ? (
                    <img src={u.picture_url} alt="" className="size-8 rounded-full" />
                  ) : (
                    <div className="size-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {u.name?.[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-purple-600">{u.analysis_count}</p>
                    <p className="text-xs text-slate-400">analyses</p>
                  </div>
                </div>
              ))}
              {(!data.top_users || data.top_users.length === 0) && (
                <p className="px-6 py-8 text-sm text-slate-400 text-center">No users yet</p>
              )}
            </div>
          </div>

          {/* Recent Analyses */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Clock className="size-4 text-cyan-500" />
              <h3 className="text-sm font-semibold text-slate-700">Recent Analyses</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {(data.recent_analyses || []).map((a, i) => {
                const ModeIcon = a.mode === 'github' ? Github : a.mode === 'url' ? Globe : FileText;
                return (
                  <div key={i} className="px-6 py-3 flex items-start gap-3 hover:bg-slate-50">
                    <div
                      className="mt-0.5 p-1.5 rounded-lg"
                      style={{ backgroundColor: (MODE_COLORS[a.mode] || '#94a3b8') + '15' }}
                    >
                      <ModeIcon className="size-3.5" style={{ color: MODE_COLORS[a.mode] || '#94a3b8' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 truncate font-medium">{a.input}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {a.name} · {formatDate(a.created_at)}
                      </p>
                    </div>
                    {a.score != null && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          a.score >= 70
                            ? 'bg-emerald-100 text-emerald-700'
                            : a.score >= 40
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {a.score}
                      </span>
                    )}
                  </div>
                );
              })}
              {(!data.recent_analyses || data.recent_analyses.length === 0) && (
                <p className="px-6 py-8 text-sm text-slate-400 text-center">No analyses yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Signups */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="size-4 text-cyan-500" />
            <h3 className="text-sm font-semibold text-slate-700">Recent Sign-ups</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100">
            {(data.recent_users || []).map((u, i) => (
              <div key={i} className="bg-white px-5 py-3 flex items-center gap-3">
                {u.picture_url ? (
                  <img src={u.picture_url} alt="" className="size-9 rounded-full" />
                ) : (
                  <div className="size-9 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {u.name?.[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  <p className="text-xs text-slate-300 mt-0.5">{formatDate(u.created_at)}</p>
                </div>
              </div>
            ))}
            {(!data.recent_users || data.recent_users.length === 0) && (
              <p className="bg-white col-span-full px-6 py-8 text-sm text-slate-400 text-center">
                No users yet
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
