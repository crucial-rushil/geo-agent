import { useState } from 'react';
import { Link2, Loader2, Github } from 'lucide-react';

export function ContentInput({ onAnalyze, isAnalyzing }) {
  const [url, setUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [inputMode, setInputMode] = useState('url');

  const handleSubmit = () => {
    if (inputMode === 'url' && url.trim()) {
      onAnalyze({ mode: 'url', url });
    } else if (inputMode === 'github' && repoUrl.trim()) {
      onAnalyze({ mode: 'github', url: repoUrl });
    }
  };

  const canSubmit =
    inputMode === 'url'
      ? !!url.trim()
      : !!repoUrl.trim();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-fit lg:sticky lg:top-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">
          {inputMode === 'url' ? 'Site Audit' : 'GitHub Repository'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setInputMode('url')}
            className={`p-2 rounded-lg transition-colors ${
              inputMode === 'url'
                ? 'bg-cyan-100 text-cyan-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Site Audit"
          >
            <Link2 className="size-5" />
          </button>
          <button
            onClick={() => setInputMode('github')}
            className={`p-2 rounded-lg transition-colors ${
              inputMode === 'github'
                ? 'bg-cyan-100 text-cyan-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="GitHub Repository"
          >
            <Github className="size-5" />
          </button>
        </div>
      </div>

      {inputMode === 'url' ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Enter website URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && !isAnalyzing && handleSubmit()}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 mt-2">
            We'll crawl this URL, fetch robots.txt, and run a full SEO audit via Claude
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            GitHub Repository URL
          </label>
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && !isAnalyzing && handleSubmit()}
            placeholder="https://github.com/username/repository"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 mt-2">
            We'll analyze the repo for missing robots.txt and sitemap.xml, then auto-generate them
          </p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isAnalyzing || !canSubmit}
        className="w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            {inputMode === 'github' ? 'Analyzing Repository...' : 'Analyzing...'}
          </>
        ) : inputMode === 'github' ? (
          'Analyze Repository'
        ) : (
          'Analyze & Optimize'
        )}
      </button>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          {inputMode === 'github' ? 'What we check:' : 'What we audit:'}
        </h3>
        {inputMode === 'github' ? (
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-cyan-500 mt-0.5">✓</span>
              <span>robots.txt presence & quality</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-500 mt-0.5">✓</span>
              <span>sitemap.xml presence & completeness</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-500 mt-0.5">✓</span>
              <span>Framework & route detection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-500 mt-0.5">✓</span>
              <span>Auto-generate missing SEO files</span>
            </li>
          </ul>
        ) : (
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-cyan-500 mt-0.5">✓</span>
              <span>Visible issues & HTTP status</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-500 mt-0.5">✓</span>
              <span>Link count vs sitemap page count</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-500 mt-0.5">✓</span>
              <span>Robots.txt rules & implications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-500 mt-0.5">✓</span>
              <span>Crawl efficiency & data gaps</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">✓</span>
              <span>AI chatbot visibility analysis</span>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
