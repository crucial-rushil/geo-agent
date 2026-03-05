import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Globe, Github, FileText, Trash2, Loader2, Clock, ExternalLink, X } from 'lucide-react';
import { OptimizationResults } from '../components/OptimizationResults';
import logoImage from '../assets/geode-logo.png';

const MODE_ICONS = {
  url: Globe,
  github: Github,
  text: FileText,
};

const MODE_LABELS = {
  url: 'URL Audit',
  github: 'Repo Analysis',
  text: 'Text Analysis',
};

export default function HistoryPage() {
  const { authFetch, user, logout } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [viewingResults, setViewingResults] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  useEffect(() => {
    authFetch('/api/history')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load history');
        return res.json();
      })
      .then((data) => setAnalyses(data.analyses || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [authFetch]);

  const handleView = async (id) => {
    if (viewingId === id) {
      // Toggle off
      setViewingId(null);
      setViewingResults(null);
      return;
    }
    setViewingId(id);
    setViewLoading(true);
    setViewingResults(null);
    try {
      const res = await authFetch(`/api/history/${id}`);
      if (!res.ok) throw new Error('Failed to load analysis');
      const data = await res.json();
      const stored = data.analysis;
      // The stored results blob is the full API response; reshape for OptimizationResults
      const r = stored.results;
      if (stored.mode === 'url') {
        setViewingResults({
          mode: 'url',
          score: r.analysis?.score,
          summary: r.analysis?.summary,
          visibleIssues: r.analysis?.visibleIssues,
          linkAnalysis: r.analysis?.linkAnalysis,
          robotsImplications: r.analysis?.robotsImplications,
          crawlEfficiency: r.analysis?.crawlEfficiency,
          dataGaps: r.analysis?.dataGaps,
          suggestions: r.analysis?.suggestions,
          auditData: r.auditData,
          aiVisibility: r.aiVisibility,
        });
      } else if (stored.mode === 'github') {
        setViewingResults({
          mode: 'github',
          repoInfo: r.repoInfo,
          findings: r.findings,
          generated: r.generated,
          seoDiffs: r.seoDiffs || [],
        });
      } else {
        setViewingResults(r);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setViewLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this analysis?')) return;
    try {
      const res = await authFetch(`/api/history/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'Z');
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/optimizer" className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-sm">
              <ArrowLeft className="size-4" />
              Optimizer
            </Link>
            <div className="w-px h-5 bg-slate-200" />
            <img src={logoImage} alt="Geode" className="h-7" />
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                {user.picture && (
                  <img src={user.picture} alt="" className="size-7 rounded-full" referrerPolicy="no-referrer" />
                )}
                <span className="text-sm text-slate-600 hidden sm:inline">{user.name}</span>
              </div>
            )}
            <button
              onClick={logout}
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Analysis History</h1>
        <p className="text-sm text-slate-500 mb-8">Your past SEO and AI visibility analyses.</p>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 text-cyan-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {!loading && analyses.length === 0 && (
          <div className="text-center py-20">
            <Clock className="size-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No analyses yet</p>
            <p className="text-sm text-slate-400 mt-1">Run your first analysis from the optimizer.</p>
            <Link
              to="/optimizer"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white rounded-lg font-medium text-sm hover:shadow-md transition-all"
            >
              Go to Optimizer
            </Link>
          </div>
        )}

        {!loading && analyses.length > 0 && (
          <div className="space-y-3">
            {analyses.map((a) => {
              const Icon = MODE_ICONS[a.mode] || Globe;
              const label = MODE_LABELS[a.mode] || a.mode;
              const isExpanded = viewingId === a.id;
              return (
                <div key={a.id}>
                  <div
                    onClick={() => handleView(a.id)}
                    className={`bg-white rounded-xl border shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all group cursor-pointer ${
                      isExpanded ? 'border-cyan-300 ring-1 ring-cyan-200' : 'border-slate-100'
                    }`}
                  >
                    <div className={`rounded-lg p-2.5 shrink-0 ${isExpanded ? 'bg-cyan-100' : 'bg-slate-100'}`}>
                      <Icon className={`size-5 ${isExpanded ? 'text-cyan-600' : 'text-slate-500'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{a.input}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400">{label}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-400">{formatDate(a.created_at)}</span>
                      </div>
                    </div>

                    {a.score != null && (
                      <div className={`text-lg font-bold shrink-0 ${
                        a.score >= 70 ? 'text-green-600' : a.score >= 40 ? 'text-yellow-600' : 'text-red-500'
                      }`}>
                        {a.score}
                      </div>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                      className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {/* Expanded results panel */}
                  {isExpanded && (
                    <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Full Results</p>
                        <button
                          onClick={() => { setViewingId(null); setViewingResults(null); }}
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <div className="p-6">
                        {viewLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="size-8 text-cyan-500 animate-spin" />
                          </div>
                        ) : viewingResults ? (
                          <OptimizationResults results={viewingResults} isAnalyzing={false} />
                        ) : (
                          <p className="text-sm text-slate-400 text-center py-8">Failed to load results.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
