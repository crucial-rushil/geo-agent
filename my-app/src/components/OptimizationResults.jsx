import { Loader2, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { ScoreCard } from './ScoreCard';
import { SuggestionsList } from './SuggestionsList';
import { KeywordCloud } from './KeywordCloud';
import { OptimizedContent } from './OptimizedContent';

export function OptimizationResults({ results, isAnalyzing }) {
  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 flex flex-col items-center justify-center min-h-96">
        <Loader2 className="size-12 text-cyan-500 animate-spin mb-4" />
        <p className="text-slate-600">Analyzing your content...</p>
        <p className="text-sm text-slate-500 mt-2">
          This may take a few moments
        </p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 flex flex-col items-center justify-center min-h-96">
        <div className="bg-slate-100 rounded-full p-6 mb-4">
          <TrendingUp className="size-12 text-slate-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Ready to Optimize
        </h3>
        <p className="text-slate-600 text-center max-w-md">
          Enter your content on the left and click "Analyze & Optimize" to get
          AI search optimization insights
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Overall Score
        </h2>
        <ScoreCard score={results.score} />

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Readability</p>
            <p className="text-2xl font-bold text-slate-900">
              {results.readability}%
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Structure</p>
            <p className="text-2xl font-bold text-slate-900">
              {results.structure}%
            </p>
          </div>
        </div>
      </div>

      <KeywordCloud keywords={results.keywords} />

      <SuggestionsList suggestions={results.suggestions} />

      <OptimizedContent content={results.optimizedContent} />
    </div>
  );
}