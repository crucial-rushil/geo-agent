import { useState } from 'react';
import { FileText, Link2, Loader2 } from 'lucide-react';

export function ContentInput({ onAnalyze, isAnalyzing }) {
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [inputMode, setInputMode] = useState('text');

  const handleSubmit = () => {
    if (inputMode === 'text' && content.trim()) {
      onAnalyze(content);
    } else if (inputMode === 'url' && url.trim()) {
      onAnalyze(
        `Content from: ${url}\n\nThis is sample content that would be extracted from the provided URL. In a production environment, this would fetch and parse the actual webpage content.`
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-fit lg:sticky lg:top-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Input Content</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setInputMode('text')}
            className={`p-2 rounded-lg transition-colors ${
              inputMode === 'text'
                ? 'bg-cyan-100 text-cyan-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="Text Input"
          >
            <FileText className="size-5" />
          </button>
          <button
            onClick={() => setInputMode('url')}
            className={`p-2 rounded-lg transition-colors ${
              inputMode === 'url'
                ? 'bg-cyan-100 text-cyan-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title="URL Input"
          >
            <Link2 className="size-5" />
          </button>
        </div>
      </div>

      {inputMode === 'text' ? (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Paste your content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter the content you want to optimize for AI search..."
            className="w-full h-64 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent resize-none"
          />
          <p className="text-xs text-slate-500 mt-2">
            {content.length} characters
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Enter website URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 mt-2">
            We'll analyze the content from this URL
          </p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={
          isAnalyzing ||
          (inputMode === 'text' ? !content.trim() : !url.trim())
        }
        className="w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white py-3 rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          'Analyze & Optimize'
        )}
      </button>

      <div className="mt-6 pt-6 border-t border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          What we analyze:
        </h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="text-cyan-500 mt-0.5">✓</span>
            <span>Content structure and hierarchy</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-500 mt-0.5">✓</span>
            <span>Semantic clarity and entity definitions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-500 mt-0.5">✓</span>
            <span>Keyword relevance and distribution</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-500 mt-0.5">✓</span>
            <span>AI readability and comprehension</span>
          </li>
        </ul>
      </div>
    </div>
  );
}