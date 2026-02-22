import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { ContentInput } from '../components/ContentInput';
import { OptimizationResults } from '../components/OptimizationResults';
import logoImage from '../assets/geode-logo.png';

export default function OptimizerPage() {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const handleAnalyze = async (inputContent) => {
    setContent(inputContent);
    setIsAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      const analysisResults = {
        score: Math.floor(Math.random() * 30) + 60,
        optimizedContent: generateOptimizedContent(inputContent),
        suggestions: generateSuggestions(inputContent),
        keywords: extractKeywords(inputContent),
        readability: Math.floor(Math.random() * 20) + 70,
        structure: Math.floor(Math.random() * 25) + 65,
      };
      setResults(analysisResults);
      setIsAnalyzing(false);
    }, 1500);
  };

  const generateOptimizedContent = (text) => {
    if (!text) return '';
    
    const sentences = text.split('. ');
    const optimized = sentences.map((sentence, idx) => {
      if (idx === 0) {
        return `**Key Point**: ${sentence}`;
      }
      return sentence;
    }).join('. ');
    
    return `${optimized}\n\n**Summary**: This content has been structured for better AI comprehension with clear key points and improved semantic clarity.`;
  };

  const generateSuggestions = (text) => {
    const suggestions = [
      {
        type: 'structure',
        priority: 'high',
        title: 'Add Clear Headings',
        description: 'Use H1, H2, and H3 tags to create a clear content hierarchy that AI can easily parse.'
      },
      {
        type: 'content',
        priority: 'high',
        title: 'Include Entity Definitions',
        description: 'Define key terms and entities early in the content to help AI understand context.'
      },
      {
        type: 'semantic',
        priority: 'medium',
        title: 'Use Structured Data',
        description: 'Implement schema.org markup to provide explicit semantic meaning to your content.'
      },
      {
        type: 'readability',
        priority: 'medium',
        title: 'Simplify Sentence Structure',
        description: 'Break complex sentences into simpler ones for better AI parsing and comprehension.'
      },
      {
        type: 'keywords',
        priority: 'low',
        title: 'Natural Keyword Integration',
        description: 'Include relevant keywords naturally within the first 100 words of content.'
      }
    ];
    
    return suggestions;
  };

  const extractKeywords = (text) => {
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 4);
    const frequency = {};
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word, count]) => ({ word, count }));
    
    return sorted;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/"
                className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="size-5" />
                Back
              </Link>
              <div className="w-px h-6 bg-slate-300" />
              <div className="flex items-center gap-3">
                <img src={logoImage} alt="Geode" className="h-8" />
                <div>
                  <p className="text-sm text-slate-600">AI Search Optimizer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ContentInput 
            onAnalyze={handleAnalyze} 
            isAnalyzing={isAnalyzing}
          />
          
          <OptimizationResults 
            results={results}
            isAnalyzing={isAnalyzing}
          />
        </div>
      </main>
    </div>
  );
}