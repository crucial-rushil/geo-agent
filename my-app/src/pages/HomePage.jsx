import { Link } from 'react-router-dom'
import { Sparkles, Zap, Target, TrendingUp, BarChart3, Brain, ArrowRight, CheckCircle2, Globe, Search, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/geode-logo.png'

export default function HomePage() {
  const { isAuthenticated, user, logout, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img src={logoImage} alt="Geode" className="h-8 md:h-10" />
            </Link>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition-colors">
                How It Works
              </a>
              {!isLoading && isAuthenticated ? (
                <div className="flex items-center gap-3">
                  {user?.picture && (
                    <img src={user.picture} alt="" className="size-8 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                  )}
                  <Link 
                    to="/optimizer"
                    className="px-6 py-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    Dashboard
                  </Link>
                  <button onClick={logout} className="text-slate-400 hover:text-slate-700 transition-colors" title="Sign out">
                    <LogOut className="size-4" />
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-slate-50" />
        
        {/* Organic blob shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-8">
              <Zap className="size-4" />
              AI-Powered Content Optimization
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Optimize Your Content for{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  AI Search
                </span>
                <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 300 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 10C50 5 100 2 150 5C200 8 250 4 298 8" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="50%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
              Geode helps you transform your website content to rank higher in AI-powered search engines like ChatGPT, Perplexity, and Claude.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to={isAuthenticated ? "/optimizer" : "/login"}
                className="px-8 py-4 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white rounded-lg font-semibold text-lg hover:shadow-xl transition-all flex items-center gap-2 group"
              >
                Start Optimizing
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#how-it-works"
                className="px-8 py-4 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-semibold text-lg hover:border-slate-400 transition-all"
              >
                Learn More
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
              <div>
                <div className="text-4xl font-bold text-slate-900 mb-2">98%</div>
                <div className="text-sm text-slate-600">AI Visibility</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-slate-900 mb-2">3x</div>
                <div className="text-sm text-slate-600">Better Rankings</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-slate-900 mb-2">24/7</div>
                <div className="text-sm text-slate-600">Optimization</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything You Need to Win at AI Search
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed to make your content discoverable by the next generation of search.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - slightly raised */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl border border-blue-200 hover:shadow-xl transition-all transform hover:-translate-y-1 lg:-rotate-1">
              <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Brain className="size-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">AI Analysis</h3>
              <p className="text-slate-700 leading-relaxed">
                Advanced algorithms analyze your content structure, semantics, and readability to ensure AI models can understand and rank it.
              </p>
            </div>

            {/* Feature 2 - normal */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl border border-purple-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Target className="size-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Smart Suggestions</h3>
              <p className="text-slate-700 leading-relaxed">
                Get actionable, prioritized recommendations to improve your content's AI searchability and discoverability.
              </p>
            </div>

            {/* Feature 3 - slightly raised */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl border border-green-200 hover:shadow-xl transition-all transform hover:-translate-y-1 lg:rotate-1">
              <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="size-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Performance Scoring</h3>
              <p className="text-slate-700 leading-relaxed">
                Track your content's optimization score and see exactly how well it's positioned for AI search engines.
              </p>
            </div>

            {/* Feature 4 - slightly lower */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl border border-orange-200 hover:shadow-xl transition-all transform hover:-translate-y-1 lg:rotate-1">
              <div className="bg-orange-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Search className="size-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Keyword Extraction</h3>
              <p className="text-slate-700 leading-relaxed">
                Automatically identify and analyze key terms that AI models will associate with your content.
              </p>
            </div>

            {/* Feature 5 - normal */}
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-8 rounded-2xl border border-pink-200 hover:shadow-xl transition-all transform hover:-translate-y-1">
              <div className="bg-pink-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Zap className="size-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Instant Optimization</h3>
              <p className="text-slate-700 leading-relaxed">
                Get AI-optimized versions of your content instantly, ready to implement on your website.
              </p>
            </div>

            {/* Feature 6 - slightly lower */}
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-8 rounded-2xl border border-teal-200 hover:shadow-xl transition-all transform hover:-translate-y-1 lg:-rotate-1">
              <div className="bg-teal-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <Globe className="size-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Multi-Platform Support</h3>
              <p className="text-slate-700 leading-relaxed">
                Optimize for all major AI search platforms including ChatGPT, Perplexity, Claude, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
        {/* Organic background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              How Geode Works
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Three simple steps to optimize your content for AI search engines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="relative">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 transform hover:scale-105 transition-transform">
                <div className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Input Content</h3>
                <p className="text-slate-600 leading-relaxed">
                  Paste your website content or enter a URL. Geode will automatically extract and analyze your content.
                </p>
              </div>
              {/* Curved arrow connector */}
              <svg className="hidden md:block absolute top-1/2 -right-8 w-16 h-16 text-cyan-300" viewBox="0 0 100 100" fill="none">
                <path d="M10 50 Q 50 20, 90 50" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" markerEnd="url(#arrowhead)"/>
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
                  </marker>
                </defs>
              </svg>
            </div>

            <div className="relative md:mt-12">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 transform hover:scale-105 transition-transform">
                <div className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">AI Analysis</h3>
                <p className="text-slate-600 leading-relaxed">
                  Our AI engine analyzes structure, semantics, keywords, and readability to score your content.
                </p>
              </div>
              <svg className="hidden md:block absolute top-1/2 -right-8 w-16 h-16 text-cyan-300" viewBox="0 0 100 100" fill="none">
                <path d="M10 50 Q 50 80, 90 50" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" markerEnd="url(#arrowhead2)"/>
                <defs>
                  <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                    <polygon points="0 0, 10 3, 0 6" fill="currentColor" />
                  </marker>
                </defs>
              </svg>
            </div>

            <div>
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 transform hover:scale-105 transition-transform">
                <div className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Get Results</h3>
                <p className="text-slate-600 leading-relaxed">
                  Receive actionable suggestions and optimized content ready to boost your AI search visibility.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Why Choose Geode?
              </h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                The future of search is AI-powered. Traditional SEO is no longer enough. Geode ensures your content is ready for the next generation of search technology.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Stay Ahead of the Curve</h4>
                    <p className="text-slate-600">AI search is growing exponentially. Be prepared for the future of search today.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Increase Visibility</h4>
                    <p className="text-slate-600">Optimized content ranks higher in AI responses, driving more qualified traffic to your site.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Save Time</h4>
                    <p className="text-slate-600">Automated analysis and optimization means less manual work and faster results.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-6 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Data-Driven Insights</h4>
                    <p className="text-slate-600">Get concrete metrics and actionable recommendations based on AI analysis.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Hand-drawn style circle accent */}
              <div className="absolute -top-8 -right-8 w-32 h-32 border-4 border-cyan-300 rounded-full opacity-30" style={{ borderStyle: 'dashed' }} />
              
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 border border-slate-200 transform rotate-1">
                <div className="bg-white rounded-xl p-6 shadow-lg mb-4 transform -rotate-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-600">Optimization Score</span>
                    <span className="text-sm font-bold text-green-600">Excellent</span>
                  </div>
                  <div className="text-4xl font-bold text-slate-900 mb-3">87/100</div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full" style={{ width: '87%' }} />
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-lg transform rotate-1">
                  <h4 className="font-semibold text-slate-900 mb-3">Top Improvements</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-slate-700">Added structured headings</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-slate-700">Enhanced semantic clarity</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-slate-700">Optimized keyword placement</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Adding human touch */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              What People Are Saying
            </h2>
            <p className="text-xl text-slate-600">Real results from real users</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 transform rotate-1 hover:rotate-0 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Maria Chen</p>
                  <p className="text-sm text-slate-500">Content Strategist</p>
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed italic">
                "Finally, a tool that actually helps me understand how AI sees my content. The suggestions are practical and I've seen real improvements in how our content appears in AI search results."
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 transform -rotate-1 hover:rotate-0 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                  J
                </div>
                <div>
                  <p className="font-semibold text-slate-900">James Rodriguez</p>
                  <p className="text-sm text-slate-500">SaaS Founder</p>
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed italic">
                "Geode is refreshingly straightforward. No BS, just clear analysis and actionable steps. Our product pages now rank way better in ChatGPT searches."
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-200 transform rotate-1 hover:rotate-0 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Sarah Kim</p>
                  <p className="text-sm text-slate-500">Marketing Director</p>
                </div>
              </div>
              <p className="text-slate-700 leading-relaxed italic">
                "This is the edge we needed. While competitors are still optimizing for Google, we're already winning in AI search. Worth every penny."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Dominate AI Search?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join the content creators and businesses optimizing for the future of search.
          </p>
          <Link 
            to={isAuthenticated ? "/optimizer" : "/login"}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-cyan-600 rounded-lg font-semibold text-lg hover:shadow-2xl transition-all group"
          >
            Start Optimizing for Free
            <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <Link to="/" className="flex items-center mb-4 md:mb-0">
              <img src={logoImage} alt="Geode" className="h-8" />
            </Link>
            <p className="text-sm text-slate-400">
              © 2026 Geode. Optimizing content for AI search.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}