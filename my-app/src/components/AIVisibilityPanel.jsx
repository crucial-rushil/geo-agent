import { useState } from 'react';
import {
  Bot,
  ShieldCheck,
  ShieldOff,
  Eye,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const BREAKDOWN_LABELS = {
  botAccess: { label: 'Bot Access', max: 25, description: 'Are AI crawlers allowed in robots.txt?' },
  contentAccessibility: { label: 'Content Accessibility', max: 20, description: 'Is content in raw HTML (not JS-only)?' },
  structuredData: { label: 'Structured Data', max: 20, description: 'JSON-LD, Open Graph, meta tags present?' },
  aiMentions: { label: 'AI Knowledge', max: 25, description: 'Do AI models recognize this site?' },
  citationReadiness: { label: 'Citation Readiness', max: 10, description: 'Title, canonical, authorship signals' },
};

const BOT_ICONS = {
  claude: '🟣',
  chatgpt: '🟢',
  perplexity: '🔵',
  gemini: '🔴',
};

const BOT_NAMES = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  perplexity: 'Perplexity',
  gemini: 'Gemini',
};

function ConfidenceBadge({ confidence }) {
  const styles = {
    high: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-orange-100 text-orange-700',
    none: 'bg-red-100 text-red-700',
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded font-medium ${styles[confidence] ?? styles.none}`}
    >
      {confidence}
    </span>
  );
}

function ScoreRing({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <p className="text-xs text-slate-400">/ 100</p>
      </div>
    </div>
  );
}

function AIKnowledgeCard({ botKey, mention }) {
  const [expanded, setExpanded] = useState(false);
  const name = BOT_NAMES[botKey] ?? botKey;
  const icon = BOT_ICONS[botKey] ?? '⬜';

  if (!mention.checked) {
    return (
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{icon}</span>
          <span className="font-medium text-slate-700">{name}</span>
          <span className="ml-auto text-xs text-slate-400">Not checked</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">{mention.reason || 'API key not configured'}</p>
      </div>
    );
  }

  return (
    <div
      className={`border rounded-lg p-4 ${
        mention.known ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="font-medium text-slate-700">{name}</span>
        <ConfidenceBadge confidence={mention.confidence} />
        <span
          className={`ml-auto text-xs font-medium ${
            mention.known ? 'text-green-600' : 'text-red-500'
          }`}
        >
          {mention.known ? '✓ Recognized' : '✗ Unknown'}
        </span>
      </div>

      {mention.rawResponse && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mt-2"
        >
          {expanded ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
          {expanded ? 'Hide response' : 'Show AI response'}
        </button>
      )}

      {expanded && mention.rawResponse && (
        <div className="mt-2 p-3 bg-white/70 rounded border border-slate-200 text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
          {mention.rawResponse}
        </div>
      )}

      {mention.domainCited !== undefined && (
        <p
          className={`text-xs mt-2 ${
            mention.domainCited ? 'text-green-600' : 'text-orange-500'
          }`}
        >
          {mention.domainCited
            ? '✓ Your domain appears in Perplexity citations'
            : '✗ Domain not found in Perplexity citations'}
        </p>
      )}
    </div>
  );
}

export function AIVisibilityPanel({ aiVisibility }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!aiVisibility) return null;

  const {
    score,
    botAccess,
    jsRendering,
    mentions,
    findings,
    recommendations,
    breakdown,
  } = aiVisibility;

  return (
    <div className="space-y-6 mt-8 pt-8 border-t-2 border-purple-200">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between group cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 rounded-lg p-2">
            <Bot className="size-5 text-purple-600" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold text-slate-900">AI Visibility Analysis</h2>
            <p className="text-sm text-slate-500">How visible is your site to AI chatbots?</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {score !== undefined && (
            <span className={`text-sm font-bold ${
              score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'
            }`}>{score}/100</span>
          )}
          {isOpen ? (
            <ChevronUp className="size-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          ) : (
            <ChevronDown className="size-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          )}
        </div>
      </button>

      {!isOpen ? null : <div className="space-y-6">
      {/* Score + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-6 flex flex-col items-center justify-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
            AI Visibility Score
          </p>
          <ScoreRing score={score} />
          <p className="text-sm text-slate-500 mt-3">
            {score >= 80
              ? 'Excellent'
              : score >= 60
                ? 'Good'
                : score >= 40
                  ? 'Needs Improvement'
                  : 'Poor'}{' '}
            AI visibility
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
            Score Breakdown
          </p>
          <div className="space-y-3">
            {breakdown &&
              Object.entries(BREAKDOWN_LABELS).map(([key, meta]) => {
                const value = breakdown[key] ?? 0;
                const pct = Math.round((value / meta.max) * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium">{meta.label}</span>
                      <span className="text-slate-400">
                        {value}/{meta.max}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          pct >= 70
                            ? 'bg-green-400'
                            : pct >= 40
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{meta.description}</p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Bot Access Grid */}
      {botAccess && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="size-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              AI Crawler Access (robots.txt)
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(botAccess).map(([ua, info]) => (
              <div
                key={ua}
                className={`rounded-lg p-3 border ${
                  info.status === 'allowed'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <p className="text-sm font-medium text-slate-700">{info.name}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{ua}</p>
                <div
                  className={`flex items-center gap-1 mt-2 text-xs font-medium ${
                    info.status === 'allowed' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {info.status === 'allowed' ? (
                    <>
                      <CheckCircle2 className="size-3" /> Allowed
                    </>
                  ) : (
                    <>
                      <ShieldOff className="size-3" /> Blocked
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JS Rendering Check */}
      {jsRendering && jsRendering.isJsHeavy !== null && (
        <div
          className={`rounded-xl border p-4 flex items-start gap-3 ${
            jsRendering.isJsHeavy
              ? 'bg-amber-50 border-amber-200'
              : 'bg-green-50 border-green-200'
          }`}
        >
          {jsRendering.isJsHeavy ? (
            <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="size-5 text-green-500 shrink-0 mt-0.5" />
          )}
          <div>
            <p
              className={`text-sm font-medium ${
                jsRendering.isJsHeavy ? 'text-amber-700' : 'text-green-700'
              }`}
            >
              {jsRendering.isJsHeavy
                ? 'Page content requires JavaScript to render'
                : 'Page content is available in raw HTML'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {(jsRendering.textContentLength ?? 0).toLocaleString()} chars of text content
              &middot; {jsRendering.scriptCount ?? 0} script tags
              {jsRendering.hasSPARoot && ' · SPA framework detected'}
            </p>
          </div>
        </div>
      )}

      {/* AI Knowledge Check */}
      {mentions && Object.keys(mentions).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="size-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              AI Knowledge Check
            </p>
            <span className="text-xs text-slate-400 ml-auto">
              Do AI models know about your site?
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(mentions).map(([key, mention]) => (
              <AIKnowledgeCard key={key} botKey={key} mention={mention} />
            ))}
          </div>
        </div>
      )}

      {/* Findings */}
      {findings && findings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="size-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              AI Visibility Issues
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {findings.map((f, i) => (
              <div
                key={i}
                className={`border-l-4 rounded-r-lg p-3 flex gap-3 ${
                  f.severity === 'high'
                    ? 'border-l-red-400 bg-red-50'
                    : f.severity === 'medium'
                      ? 'border-l-yellow-400 bg-yellow-50'
                      : 'border-l-blue-400 bg-blue-50'
                }`}
              >
                {f.severity === 'high' ? (
                  <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                ) : f.severity === 'medium' ? (
                  <Info className="size-4 text-yellow-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="size-4 text-blue-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{f.issue}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded uppercase font-medium shrink-0 ${
                    f.severity === 'high'
                      ? 'bg-red-100 text-red-700'
                      : f.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {f.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="size-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              AI Visibility Recommendations
            </p>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex gap-3 items-start p-3 bg-purple-50/50 rounded-lg border border-purple-100"
              >
                <span
                  className={`text-xs px-2 py-0.5 rounded uppercase font-medium shrink-0 mt-0.5 ${
                    rec.priority === 'high'
                      ? 'bg-red-100 text-red-700'
                      : rec.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {rec.priority}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{rec.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>}
    </div>
  );
}
