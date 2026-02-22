import { useState } from 'react';
import { Copy, Check, FileText } from 'lucide-react';

export function OptimizedContent({ content }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-900">
            Optimized Content
          </h2>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <Check className="size-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Copied!
              </span>
            </>
          ) : (
            <>
              <Copy className="size-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">
                Copy
              </span>
            </>
          )}
        </button>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
          {content}
        </pre>
      </div>

      <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
        <p className="text-sm text-cyan-800">
          <strong>Tip:</strong> This optimized version includes better structure
          and semantic markers to improve AI comprehension and search visibility.
        </p>
      </div>
    </div>
  );
}