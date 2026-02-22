import { Hash } from 'lucide-react';

export function KeywordCloud({ keywords }) {
  if (!keywords || keywords.length === 0) return null;

  const maxCount = Math.max(...keywords.map((k) => k.count));

  const getSize = (count) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'text-lg';
    if (ratio > 0.4) return 'text-base';
    return 'text-sm';
  };

  const getOpacity = (count) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return 'opacity-100';
    if (ratio > 0.4) return 'opacity-75';
    return 'opacity-60';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="size-5 text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-900">Key Terms</h2>
      </div>

      <div className="flex flex-wrap gap-3">
        {keywords.map((keyword, index) => (
          <div
            key={index}
            className={`px-4 py-2 bg-gradient-to-r from-emerald-50 via-cyan-50 to-blue-50 border border-cyan-200 rounded-lg ${getSize(
              keyword.count
            )} ${getOpacity(
              keyword.count
            )} transition-all hover:scale-105 hover:shadow-md`}
          >
            <span className="font-medium text-slate-700">
              {keyword.word}
            </span>
            <span className="ml-2 text-xs text-slate-500">
              ×{keyword.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}