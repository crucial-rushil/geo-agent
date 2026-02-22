import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

export function SuggestionsList({ suggestions }) {
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="size-5 text-red-500" />;
      case 'medium':
        return <Info className="size-5 text-yellow-500" />;
      case 'low':
        return <CheckCircle2 className="size-5 text-blue-500" />;
      default:
        return <Info className="size-5 text-slate-500" />;
    }
  };

  const getPriorityBorder = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'low':
        return 'border-l-blue-500';
      default:
        return 'border-l-slate-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        Optimization Suggestions
      </h2>

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`border-l-4 ${getPriorityBorder(
              suggestion.priority
            )} bg-slate-50 rounded-r-lg p-4`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getPriorityIcon(suggestion.priority)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">
                    {suggestion.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded uppercase font-medium ${
                      suggestion.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : suggestion.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {suggestion.priority}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {suggestion.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}