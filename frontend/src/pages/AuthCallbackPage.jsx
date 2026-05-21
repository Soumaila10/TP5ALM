import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAccessToken } from '../services/api';
import { getProfile } from '../services/userService';
import { useAuthStore } from '../store/authStore';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      if (!token) {
        navigate('/login?error=OAUTH_FAILED');
        return;
      }

      try {
        // 1. Save access token globally in api requests config
        setAccessToken(token);
        
        // 2. Fetch profile info
        const user = await getProfile();
        
        // 3. Update auth store
        setAuth(user, token);
        
        // 4. Navigate back home
        navigate('/');
      } catch (err) {
        console.error('Error handling OAuth callback:', err);
        navigate('/login?error=OAUTH_FAILED');
      }
    };

    processCallback();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-bg-primary text-text-primary">
      {/* Header spacing */}
      <div className="h-16"></div>

      {/* Main loading view */}
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md bg-bg-secondary p-8 rounded-xl border border-border-subtle shadow-card text-center transition-all duration-300">
          <div className="mb-6 flex justify-center">
            <svg className="animate-spin h-10 w-10 text-brand-gold" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-text-primary mb-2">
            Connexion en cours
          </h2>
          <p className="text-text-secondary text-sm">
            Veuillez patienter pendant que nous récupérons les informations de votre profil...
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-text-muted">
        &copy; 2026 FIFA Ticketing Hub. Tous droits réservés.
      </footer>
    </div>
  );
}
