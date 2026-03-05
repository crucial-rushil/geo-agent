import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Clock, LogOut } from 'lucide-react';
import { ContentInput } from '../components/ContentInput';
import { OptimizationResults } from '../components/OptimizationResults';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/geode-logo.png';

export default function OptimizerPage() {
  const { user, logout, authFetch } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [analyzedUrl, setAnalyzedUrl] = useState('');

  const handleAnalyze = async ({ mode, content, url }) => {
    setIsAnalyzing(true);
    setResults(null);
    setError(null);
    if (url) setAnalyzedUrl(url);

    if (mode === 'url') {
      try {
        const response = await authFetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Analysis failed');
        setResults({
          mode: 'url',
          score: data.analysis.score,
          summary: data.analysis.summary,
          visibleIssues: data.analysis.visibleIssues,
          linkAnalysis: data.analysis.linkAnalysis,
          robotsImplications: data.analysis.robotsImplications,
          crawlEfficiency: data.analysis.crawlEfficiency,
          dataGaps: data.analysis.dataGaps,
          suggestions: data.analysis.suggestions,
          auditData: data.auditData,
          aiVisibility: data.aiVisibility,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsAnalyzing(false);
      }
    } else if (mode === 'github') {
      try {
        const response = await authFetch('/api/analyze-repo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repoUrl: url }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Repository analysis failed');
        setResults({
          mode: 'github',
          repoInfo: data.repoInfo,
          findings: data.findings,
          generated: data.generated,
          seoDiffs: data.seoDiffs || [],
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setTimeout(() => {
        setResults({
          mode: 'text',
          score: Math.floor(Math.random() * 30) + 60,
          optimizedContent: generateOptimizedContent(content),
          suggestions: generateSuggestions(),
          keywords: extractKeywords(content),
          readability: Math.floor(Math.random() * 20) + 70,
          structure: Math.floor(Math.random() * 25) + 65,
        });
        setIsAnalyzing(false);
      }, 1500);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
    setAnalyzedUrl('');
  };

  const generateOptimizedContent = (text) => {
    if (!text) return '';
    const sentences = text.split('. ');
    const optimized = sentences
      .map((s, i) => (i === 0 ? `**Key Point**: ${s}` : s))
      .join('. ');
    return `${optimized}\n\n**Summary**: This content has been structured for better AI comprehension.`;
  };

  const generateSuggestions = () => [
    { type: 'structure', priority: 'high', title: 'Add Clear Headings', description: 'Use H1, H2, and H3 tags to create a clear content hierarchy that AI can easily parse.' },
    { type: 'content', priority: 'high', title: 'Include Entity Definitions', description: 'Define key terms and entities early in the content to help AI understand context.' },
    { type: 'semantic', priority: 'medium', title: 'Use Structured Data', description: 'Implement schema.org markup to provide explicit semantic meaning to your content.' },
    { type: 'readability', priority: 'medium', title: 'Simplify Sentence Structure', description: 'Break complex sentences into simpler ones for better AI parsing.' },
    { type: 'keywords', priority: 'low', title: 'Natural Keyword Integration', description: 'Include relevant keywords naturally within the first 100 words of content.' },
  ];

  const extractKeywords = (text) => {
    const words = text.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
    const freq = {};
    words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([word, count]) => ({ word, count }));
  };

  // ─── Full-page results view ───────────────────────────────────────────────
  if (results || isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-sm">
                <ArrowLeft className="size-4" />
                Home
              </Link>
              <div className="w-px h-5 bg-slate-200" />
              <img src={logoImage} alt="Geode" className="h-7" />
            </div>

            {analyzedUrl && (
              <p className="text-xs text-slate-400 truncate max-w-xs hidden sm:block">{analyzedUrl}</p>
            )}

            <div className="flex items-center gap-3">
              <Link to="/history" className="text-slate-500 hover:text-slate-900 transition-colors" title="History">
                <Clock className="size-5" />
              </Link>
              {user?.picture && (
                <img src={user.picture} alt="" className="size-7 rounded-full" referrerPolicy="no-referrer" />
              )}
              <button onClick={logout} className="text-slate-400 hover:text-slate-700 transition-colors" title="Sign out">
                <LogOut className="size-4" />
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all"
              >
                <RotateCcw className="size-4" />
                Analyze Another
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
          <OptimizationResults results={results} isAnalyzing={isAnalyzing} />
        </main>
      </div>
    );
  }

  // ─── Input view ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-sm">
              <ArrowLeft className="size-4" />
              Home
            </Link>
            <div className="w-px h-5 bg-slate-200" />
            <img src={logoImage} alt="Geode" className="h-7" />
            <p className="text-sm text-slate-500">AI Search Optimizer</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/history" className="text-slate-500 hover:text-slate-900 transition-colors" title="History">
              <Clock className="size-5" />
            </Link>
            {user?.picture && (
              <img src={user.picture} alt="" className="size-7 rounded-full" referrerPolicy="no-referrer" />
            )}
            <button onClick={logout} className="text-slate-400 hover:text-slate-700 transition-colors" title="Sign out">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex items-start justify-center px-4 py-16">
        <div className="w-full max-w-xl">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
          <ContentInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </div>
      </main>
    </div>
  );
}
