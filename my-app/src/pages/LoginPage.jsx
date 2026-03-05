import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import logoImage from '../assets/geode-logo.png';
import { Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { isAuthenticated, login, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/optimizer', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse.credential);
      navigate('/optimizer');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-slate-50 flex flex-col">
      {/* Simple nav */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src={logoImage} alt="Geode" className="h-8 md:h-10" />
          </Link>
        </div>
      </nav>

      {/* Login card */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 rounded-xl mb-6">
            <Sparkles className="size-7 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign in to Geode</h1>
          <p className="text-slate-500 mb-8">
            Optimize your content for AI search engines.
          </p>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => console.error('Google login error')}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="300"
            />
          </div>

          <p className="text-xs text-slate-400 mt-8">
            By signing in you agree to our Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
