import { Loader2, TrendingUp, AlertCircle, Info, CheckCircle2, Globe, Link2, Shield, Zap, SearchX } from 'lucide-react';
import { ScoreCard } from './ScoreCard';
import { SuggestionsList } from './SuggestionsList';
import { KeywordCloud } from './KeywordCloud';
import { OptimizedContent } from './OptimizedContent';
import { RepoAnalysisResults } from './RepoAnalysisResults';
import { AIVisibilityPanel } from './AIVisibilityPanel';

function SeverityBadge({ severity }) {
  const styles = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded uppercase font-medium ${styles[severity] ?? styles.low}`}>
      {severity}
    </span>
  );
}

function SeverityIcon({ severity }) {
  if (severity === 'high') return <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />;
  if (severity === 'medium') return <Info className="size-4 text-yellow-500 shrink-0 mt-0.5" />;
  return <CheckCircle2 className="size-4 text-blue-500 shrink-0 mt-0.5" />;
}

function Card({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-6 ${className}`}>
      {(title || Icon) && (
        <div className="flex items-center gap-2 mb-4">
          {Icon && <Icon className="size-4 text-slate-400" />}
          {title && <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h2>}
        </div>
      )}
      {children}
    </div>
  );
}

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

function SEOAuditResults({ results }) {
  const { score, summary, visibleIssues, linkAnalysis, robotsImplications, crawlEfficiency, dataGaps, suggestions, auditData, aiVisibility } = results;

  const sortedIssues = visibleIssues
    ? [...visibleIssues].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3))
    : [];

  return (
    <div className="space-y-6">

      {/* Row 1: Score + summary + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="SEO Score" icon={Globe} className="lg:col-span-1">
          <ScoreCard score={score} />
          {auditData && (
            <div className="grid grid-cols-3 gap-2 mt-5">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Internal Links</p>
                <p className="text-xl font-bold text-slate-900">{auditData.internalLinkCount}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">Sitemap Pages</p>
                <p className="text-xl font-bold text-slate-900">{auditData.sitemapPageCount ?? '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">HTTP</p>
                <p className={`text-xl font-bold ${auditData.httpStatus === 200 ? 'text-green-600' : 'text-red-600'}`}>
                  {auditData.httpStatus ?? '—'}
                </p>
              </div>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2 flex flex-col justify-between">
          {summary && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="size-2 rounded-full bg-cyan-400" />
                <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Summary</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{summary}</p>
            </div>
          )}
          {auditData && (
            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-slate-400">Title</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5 truncate">{auditData.title ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Schema Markup</p>
                <p className={`text-sm font-medium mt-0.5 ${auditData.hasSchemaMarkup ? 'text-green-600' : 'text-red-500'}`}>
                  {auditData.hasSchemaMarkup ? 'Present' : 'Missing'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Sitemap</p>
                <p className={`text-sm font-medium mt-0.5 ${auditData.sitemapFound ? 'text-green-600' : 'text-red-500'}`}>
                  {auditData.sitemapFound ? 'Found' : 'Not found'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Robots.txt</p>
                <p className={`text-sm font-medium mt-0.5 ${auditData.robotsTxt ? 'text-green-600' : 'text-red-500'}`}>
                  {auditData.robotsTxt ? 'Present' : 'Missing'}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Row 2: Visible Issues */}
      {sortedIssues.length > 0 && (
        <Card title="Visible Issues" icon={AlertCircle}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedIssues.map((item, i) => (
              <div key={i} className={`border-l-4 rounded-r-lg p-3 flex gap-3 ${
                item.severity === 'high' ? 'border-l-red-400 bg-red-50' :
                item.severity === 'medium' ? 'border-l-yellow-400 bg-yellow-50' :
                'border-l-blue-400 bg-blue-50'
              }`}>
                <SeverityIcon severity={item.severity} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-slate-700">{item.issue}</p>
                    <SeverityBadge severity={item.severity} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Row 3: Link + Robots + Crawl */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {linkAnalysis && (
          <Card title="Link Analysis" icon={Link2}>
            <p className="text-sm text-slate-600 leading-relaxed">{linkAnalysis}</p>
          </Card>
        )}
        {robotsImplications && (
          <Card title="Robots.txt" icon={Shield}>
            <p className="text-sm text-slate-600 leading-relaxed">{robotsImplications}</p>
          </Card>
        )}
        {crawlEfficiency && (
          <Card title="Crawl Efficiency" icon={Zap}>
            <p className="text-sm text-slate-600 leading-relaxed">{crawlEfficiency}</p>
          </Card>
        )}
      </div>

      {/* Row 4: Data Gaps */}
      {dataGaps && dataGaps.length > 0 && (
        <Card title="Data Gaps" icon={SearchX}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dataGaps.map((gap, i) => (
              <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2">
                <span className="text-slate-300 mt-0.5 text-lg leading-none">○</span>
                <p className="text-sm text-slate-600">{gap}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Row 5: Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <SuggestionsList suggestions={suggestions} />
      )}

      {/* AI Visibility Analysis */}
      {aiVisibility && <AIVisibilityPanel aiVisibility={aiVisibility} />}
    </div>
  );
}

export function OptimizationResults({ results, isAnalyzing }) {
  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex flex-col items-center max-w-md w-full">
          <Loader2 className="size-12 text-cyan-500 animate-spin mb-4" />
          <p className="text-slate-700 font-medium">Running analysis…</p>
          <p className="text-sm text-slate-400 mt-2 text-center">
            This may take a moment while we gather data and consult Claude.
          </p>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 flex flex-col items-center max-w-md w-full">
          <div className="bg-slate-100 rounded-full p-5 mb-4">
            <TrendingUp className="size-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Ready to Optimize</h3>
          <p className="text-slate-500 text-center text-sm">
            Enter a URL or paste content and click "Analyze & Optimize" to get AI-powered SEO insights.
          </p>
        </div>
      </div>
    );
  }

  if (results.mode === 'url') {
    return <SEOAuditResults results={results} />;
  }

  if (results.mode === 'github') {
    return <RepoAnalysisResults results={results} />;
  }

  // Text mode — original layout
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">Overall Score</h2>
        <ScoreCard score={results.score} />
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1">Readability</p>
            <p className="text-2xl font-bold text-slate-900">{results.readability}%</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-1">Structure</p>
            <p className="text-2xl font-bold text-slate-900">{results.structure}%</p>
          </div>
        </div>
      </div>
      <KeywordCloud keywords={results.keywords} />
      <SuggestionsList suggestions={results.suggestions} />
      <OptimizedContent content={results.optimizedContent} />
    </div>
  );
}
