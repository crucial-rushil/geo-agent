import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, BarChart3, TrendingUp, TrendingDown, Globe, Github,
  Activity, Target, Zap, RefreshCw, ExternalLink, Minus, ChevronDown,
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, Cell,
} from 'recharts';
import logoImage from '../assets/geode-logo.png';

const CYAN = '#06b6d4';
const PURPLE = '#a855f7';
const EMERALD = '#10b981';
const AMBER = '#f59e0b';
const RED = '#f43f5e';

function ScoreRing({ score, label, color, size = 80 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score != null ? score / 100 : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="#e2e8f0" strokeWidth="6" fill="none" />
        {score != null && (
          <circle
            cx={size/2} cy={size/2} r={radius}
            stroke={color} strokeWidth="6" fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        )}
        <text
          x={size/2} y={size/2}
          textAnchor="middle" dominantBaseline="central"
          className="rotate-90 origin-center"
          fill="#1e293b" fontSize="16" fontWeight="bold"
        >
          {score ?? '—'}
        </text>
      </svg>
      <span className="text-xs font-medium text-slate-500">{label}</span>
    </div>
  );
}

function DeltaBadge({ delta }) {
  if (delta == null) return null;
  const isPos = delta > 0;
  const isZero = delta === 0;
  const Icon = isPos ? TrendingUp : isZero ? Minus : TrendingDown;
  const color = isPos ? 'text-emerald-600 bg-emerald-50' : isZero ? 'text-slate-500 bg-slate-50' : 'text-red-600 bg-red-50';
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${color}`}>
      <Icon className="size-3" />
      {isPos ? '+' : ''}{delta}
    </span>
  );
}

export default function MyDashboard() {
  const { authFetch, user, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSite, setSelectedSite] = useState('__all__');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/my-dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard');
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d.includes('T') || d.includes(' ') ? d + 'Z' : d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (d) => {
    if (!d) return '';
    const date = new Date(d.includes('T') || d.includes(' ') ? d + 'Z' : d);
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  };

  // All unique site domains for dropdown
  const siteOptions = useMemo(() => {
    if (!data?.sites) return [];
    return data.sites.map(s => s.domain);
  }, [data]);

  // The selected site summary from API data
  const selectedSiteData = useMemo(() => {
    if (!data?.sites || selectedSite === '__all__') return null;
    return data.sites.find(s => s.domain === selectedSite) || null;
  }, [data, selectedSite]);

  // Build chart data filtered by selected site
  const chartData = useMemo(() => {
    if (!data?.timeline) return [];
    let filtered = data.timeline;
    if (selectedSite !== '__all__') {
      filtered = filtered.filter(e => e.site === selectedSite);
    }
    return filtered
      .filter(e => e.seo_score != null || e.ai_score != null)
      .map((e, i) => ({
        name: formatDate(e.datetime),
        seo: e.seo_score,
        ai: e.ai_score,
        site: e.site,
        input: e.input,
        idx: i,
      }));
  }, [data, selectedSite]);

  // Score distribution for scatter
  const scatterData = chartData.filter(e => e.seo != null && e.ai != null);

  // KPI values — per-site or global depending on selection
  const kpis = useMemo(() => {
    if (!data) return {};
    if (selectedSite === '__all__') {
      return {
        bestSeo: data.best_seo,
        bestAi: data.avg_ai != null ? Math.max(...(data.sites || []).filter(s => s.best_ai != null).map(s => s.best_ai), 0) || null : null,
        avgSeo: data.avg_seo,
        avgAi: data.avg_ai,
        totalAnalyses: data.total_analyses,
        seoLabel: 'Best SEO',
        aiLabel: 'Best AI',
      };
    }
    if (selectedSiteData) {
      return {
        bestSeo: selectedSiteData.best_seo,
        bestAi: selectedSiteData.best_ai,
        avgSeo: selectedSiteData.latest_seo,
        avgAi: selectedSiteData.latest_ai,
        totalAnalyses: selectedSiteData.analysis_count,
        seoDelta: selectedSiteData.seo_delta,
        aiDelta: selectedSiteData.ai_delta,
        seoLabel: 'Best SEO',
        aiLabel: 'Best AI',
      };
    }
    return {};
  }, [data, selectedSite, selectedSiteData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/optimizer" className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-sm">
              <ArrowLeft className="size-4" />
              Optimizer
            </Link>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Geode" className="h-7" />
              <h1 className="text-lg font-bold text-slate-900">My Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {user && (
              <div className="flex items-center gap-2">
                {user.picture && <img src={user.picture} alt="" className="size-8 rounded-full" />}
                <span className="text-sm font-medium text-slate-700 hidden sm:block">{user.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="size-8 text-cyan-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Site Selector + KPI Row */}
            <div className="space-y-4">
              {/* Dropdown */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600">Viewing:</label>
                <div className="relative">
                  <select
                    value={selectedSite}
                    onChange={e => setSelectedSite(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-400 transition-all cursor-pointer min-w-[220px]"
                  >
                    <option value="__all__">All Sites (Overview)</option>
                    {siteOptions.map(domain => (
                      <option key={domain} value={domain}>{domain}</option>
                    ))}
                  </select>
                  <ChevronDown className="size-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Best SEO */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{kpis.seoLabel || 'Best SEO'}</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.bestSeo ?? '—'}</p>
                      {kpis.seoDelta != null && (
                        <div className="mt-1.5"><DeltaBadge delta={kpis.seoDelta} /></div>
                      )}
                      {selectedSite !== '__all__' && kpis.avgSeo != null && (
                        <p className="text-xs text-slate-400 mt-1">Latest: {kpis.avgSeo}</p>
                      )}
                    </div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-200">
                      <Target className="size-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Best AI */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{kpis.aiLabel || 'Best AI'}</p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.bestAi ?? '—'}</p>
                      {kpis.aiDelta != null && (
                        <div className="mt-1.5"><DeltaBadge delta={kpis.aiDelta} /></div>
                      )}
                      {selectedSite !== '__all__' && kpis.avgAi != null && (
                        <p className="text-xs text-slate-400 mt-1">Latest: {kpis.avgAi}</p>
                      )}
                    </div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-200">
                      <Zap className="size-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Total Analyses */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {selectedSite === '__all__' ? 'Total Analyses' : 'Analyses'}
                      </p>
                      <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.totalAnalyses ?? '—'}</p>
                      {selectedSite === '__all__' && (
                        <p className="text-xs text-slate-400 mt-1">
                          {data.url_count} audits · {data.github_count} repos
                        </p>
                      )}
                    </div>
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-200">
                      <BarChart3 className="size-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Score Overview Ring */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Score Overview</p>
                  <div className="flex items-center justify-center gap-4">
                    <ScoreRing
                      score={selectedSite === '__all__' ? data.avg_seo : kpis.avgSeo}
                      label="SEO" color={CYAN} size={64}
                    />
                    <ScoreRing
                      score={selectedSite === '__all__' ? data.avg_ai : kpis.avgAi}
                      label="AI" color={PURPLE} size={64}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Score Trend Chart */}
            {chartData.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Score Trends Over Time</h3>
                <p className="text-xs text-slate-400 mb-4">
                  {selectedSite === '__all__'
                    ? 'SEO and AI Visibility scores across all your analyses'
                    : `Performance history for ${selectedSite}`
                  }
                </p>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="seoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CYAN} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={CYAN} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={PURPLE} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
                            <p className="font-medium text-slate-800 mb-1 truncate max-w-[200px]">{d?.input}</p>
                            <p className="text-xs text-slate-400 mb-2">{d?.name}</p>
                            {d?.seo != null && (
                              <p className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ background: CYAN }} />
                                SEO: <span className="font-semibold">{d.seo}</span>
                              </p>
                            )}
                            {d?.ai != null && (
                              <p className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ background: PURPLE }} />
                                AI Visibility: <span className="font-semibold">{d.ai}</span>
                              </p>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone" dataKey="seo" name="SEO Score"
                      stroke={CYAN} strokeWidth={2.5}
                      fill="url(#seoGrad)" fillOpacity={1}
                      dot={{ r: 4, fill: CYAN, strokeWidth: 0 }}
                      connectNulls
                    />
                    <Area
                      type="monotone" dataKey="ai" name="AI Visibility"
                      stroke={PURPLE} strokeWidth={2.5}
                      fill="url(#aiGrad)" fillOpacity={1}
                      dot={{ r: 4, fill: PURPLE, strokeWidth: 0 }}
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 shadow-sm text-center">
                <Activity className="size-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">
                  {selectedSite === '__all__' ? 'No analysis data yet' : `No data for ${selectedSite}`}
                </p>
                <p className="text-xs text-slate-400 mt-1">Run a Site Audit to start seeing score trends</p>
                <Link to="/optimizer" className="inline-block mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors">
                  Run Analysis
                </Link>
              </div>
            )}

            {/* SEO vs AI scatter + Per-site table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Scatter: SEO vs AI */}
              {scatterData.length > 1 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">SEO vs AI Visibility</h3>
                  <p className="text-xs text-slate-400 mb-4">Each dot is one analysis — aim for the top-right corner</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" dataKey="seo" name="SEO" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" label={{ value: 'SEO Score', position: 'bottom', fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis type="number" dataKey="ai" name="AI" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#94a3b8" label={{ value: 'AI Score', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0]?.payload;
                          return (
                            <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
                              <p className="font-medium text-slate-800 truncate max-w-[180px]">{d?.site}</p>
                              <p className="text-slate-500">SEO: {d?.seo} · AI: {d?.ai}</p>
                            </div>
                          );
                        }}
                      />
                      <Scatter data={scatterData}>
                        {scatterData.map((entry, i) => {
                          const avg = ((entry.seo || 0) + (entry.ai || 0)) / 2;
                          const color = avg >= 70 ? EMERALD : avg >= 40 ? AMBER : RED;
                          return <Cell key={i} fill={color} opacity={0.8} />;
                        })}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Per-site table */}
              {(data.sites || []).length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700">Your Sites</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Click a site to filter the dashboard</p>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                    {data.sites.map((site, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSite(site.domain === selectedSite ? '__all__' : site.domain)}
                        className={`w-full px-6 py-4 flex items-center gap-4 transition-colors text-left ${
                          site.domain === selectedSite
                            ? 'bg-cyan-50 border-l-4 border-l-cyan-500'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Globe className="size-4 text-cyan-500 shrink-0" />
                            <p className="text-sm font-medium text-slate-800 truncate">{site.domain}</p>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {site.analysis_count} {site.analysis_count === 1 ? 'analysis' : 'analyses'} · Last: {formatFullDate(site.last_analyzed)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-center">
                            <ScoreRing score={site.latest_seo} label="SEO" color={CYAN} size={56} />
                          </div>
                          <div className="text-center">
                            <ScoreRing score={site.latest_ai} label="AI" color={PURPLE} size={56} />
                          </div>
                          {site.seo_delta != null && (
                            <DeltaBadge delta={site.seo_delta} />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
