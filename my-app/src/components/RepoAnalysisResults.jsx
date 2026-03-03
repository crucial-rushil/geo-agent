import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Copy, Check, Download, Github, FileCode, Globe, GitPullRequest, ChevronDown, ChevronRight } from 'lucide-react';

function FileViewer({ title, content, filename, exists }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileCode className="size-5 text-slate-500" />
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {exists ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Exists</span>
          ) : (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Generated</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="size-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>
      <pre className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 overflow-x-auto whitespace-pre-wrap font-mono max-h-80 overflow-y-auto">
        {content}
      </pre>
    </div>
  );
}

function DiffLine({ line }) {
  if (line.startsWith('+++') || line.startsWith('---')) {
    return <div className="text-slate-500 font-bold bg-slate-100 px-3 py-0.5">{line}</div>;
  }
  if (line.startsWith('@@')) {
    return <div className="text-cyan-700 bg-cyan-50 px-3 py-0.5">{line}</div>;
  }
  if (line.startsWith('+')) {
    return <div className="text-green-800 bg-green-50 px-3 py-0.5">{line}</div>;
  }
  if (line.startsWith('-')) {
    return <div className="text-red-800 bg-red-50 px-3 py-0.5">{line}</div>;
  }
  return <div className="text-slate-600 px-3 py-0.5">{line}</div>;
}

function DiffCard({ diff }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const lines = diff.diff.split('\n');

  const severityStyles = {
    high: 'border-l-red-400 bg-red-50',
    medium: 'border-l-yellow-400 bg-yellow-50',
    low: 'border-l-blue-400 bg-blue-50',
  };
  const severityBadge = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(diff.diff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`border-l-4 rounded-r-xl bg-white shadow-sm border border-slate-100 overflow-hidden ${severityStyles[diff.severity] || severityStyles.low}`}>
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {expanded ? <ChevronDown className="size-4 text-slate-400 shrink-0" /> : <ChevronRight className="size-4 text-slate-400 shrink-0" />}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-sm font-mono font-semibold text-slate-800">{diff.filePath}</code>
              <span className={`text-xs px-2 py-0.5 rounded uppercase font-medium ${severityBadge[diff.severity] || severityBadge.low}`}>
                {diff.severity}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5 truncate">{diff.description}</p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); handleCopy(); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0 ml-3"
        >
          {copied ? (
            <><Check className="size-3.5 text-green-600" /><span className="text-green-600">Copied!</span></>
          ) : (
            <><Copy className="size-3.5" /><span>Copy</span></>
          )}
        </button>
      </div>
      {expanded && (
        <div className="border-t border-slate-200 font-mono text-xs leading-relaxed overflow-x-auto max-h-96 overflow-y-auto">
          {lines.map((line, i) => <DiffLine key={i} line={line} />)}
        </div>
      )}
    </div>
  );
}

export function RepoAnalysisResults({ results }) {
  const { repoInfo, findings, generated, seoDiffs = [] } = results;

  return (
    <div className="space-y-6">
      {/* Repo Info Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-start gap-4">
          <div className="bg-slate-900 rounded-xl p-3">
            <Github className="size-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">
              {repoInfo.owner}/{repoInfo.repo}
            </h2>
            {repoInfo.description && (
              <p className="text-sm text-slate-500 mt-1">{repoInfo.description}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-full font-medium">
                <FileCode className="size-3" />
                {repoInfo.framework}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                <Globe className="size-3" />
                {repoInfo.homepage}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-xl p-5 border ${findings.hasRobots ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-3">
            {findings.hasRobots ? (
              <CheckCircle2 className="size-6 text-green-500" />
            ) : (
              <AlertTriangle className="size-6 text-amber-500" />
            )}
            <div>
              <h3 className="font-semibold text-slate-900">robots.txt</h3>
              <p className="text-sm text-slate-600">
                {findings.hasRobots ? 'Found in repository' : 'Missing — generated below'}
              </p>
            </div>
          </div>
        </div>
        <div className={`rounded-xl p-5 border ${findings.hasSitemap ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-3">
            {findings.hasSitemap ? (
              <CheckCircle2 className="size-6 text-green-500" />
            ) : (
              <AlertTriangle className="size-6 text-amber-500" />
            )}
            <div>
              <h3 className="font-semibold text-slate-900">sitemap.xml</h3>
              <p className="text-sm text-slate-600">
                {findings.hasSitemap ? 'Found in repository' : 'Missing — generated below'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      {generated.explanation && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Agent Analysis</h3>
          <div className="space-y-2 text-sm text-slate-600">
            {generated.explanation.robots && (
              <p><span className="font-medium text-slate-700">robots.txt:</span> {generated.explanation.robots}</p>
            )}
            {generated.explanation.sitemap && (
              <p><span className="font-medium text-slate-700">sitemap.xml:</span> {generated.explanation.sitemap}</p>
            )}
          </div>
        </div>
      )}

      {/* File Viewers */}
      {findings.hasRobots && findings.existingRobots && (
        <FileViewer
          title="robots.txt"
          content={findings.existingRobots}
          filename="robots.txt"
          exists={true}
        />
      )}
      {!findings.hasRobots && generated.robotsTxt && (
        <FileViewer
          title="robots.txt"
          content={generated.robotsTxt}
          filename="robots.txt"
          exists={false}
        />
      )}

      {findings.hasSitemap && findings.existingSitemap && (
        <FileViewer
          title="sitemap.xml"
          content={findings.existingSitemap}
          filename="sitemap.xml"
          exists={true}
        />
      )}
      {!findings.hasSitemap && generated.sitemapXml && (
        <FileViewer
          title="sitemap.xml"
          content={generated.sitemapXml}
          filename="sitemap.xml"
          exists={false}
        />
      )}

      {/* All good message */}
      {findings.hasRobots && findings.hasSitemap && seoDiffs.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle2 className="size-10 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-800">All SEO files present!</h3>
          <p className="text-sm text-green-600 mt-1">
            This repository already has both robots.txt and sitemap.xml configured.
          </p>
        </div>
      )}

      {/* SEO Improvement Diffs */}
      {seoDiffs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <GitPullRequest className="size-5 text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900">Suggested SEO Fixes</h3>
            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {seoDiffs.length} {seoDiffs.length === 1 ? 'change' : 'changes'}
            </span>
          </div>
          <p className="text-sm text-slate-500 -mt-2">
            Apply these diffs to your repository files to improve SEO. Each diff shows the exact lines to add or modify.
          </p>
          {seoDiffs.map((diff, i) => <DiffCard key={i} diff={diff} />)}
        </div>
      )}
    </div>
  );
}
