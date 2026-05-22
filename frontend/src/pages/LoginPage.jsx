import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { login, getGoogleAuthUrl, getGithubAuthUrl } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import ThemeToggle from '../components/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('error');
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleGoogleLogin = () => {
    window.location.href = getGoogleAuthUrl();
  };

  const handleGithubLogin = () => {
    window.location.href = getGithubAuthUrl();
  };

  const getErrorMessage = () => {
    if (error) return error;
    if (oauthError) {
      switch (oauthError) {
        case 'OAUTH_FAILED':
          return "L'authentification avec le fournisseur tiers a échoué.";
        case 'OAUTH_NOT_CONFIGURED':
          return "Ce mode d'authentification n'est pas configuré sur le serveur.";
        case 'access_denied':
          return "L'accès a été refusé par l'utilisateur.";
        default:
          return "Une erreur est survenue lors de l'authentification.";
      }
    }
    return '';
  };

  const displayError = getErrorMessage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login({ email, password });
      if (response.accessToken) {
        setAuth(response.user, response.accessToken);
        navigate('/');
      } else {
        setError('Erreur inattendue, jeton manquant');
      }
    } catch (err) {
      setError(err.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 max-w-7xl w-full mx-auto">
        <Link to="/" className="text-brand-gold font-mono text-lg font-bold tracking-wider uppercase">
          FIFA TICKETING 2026
        </Link>
        <ThemeToggle />
      </header>

      {/* Main card container */}
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md bg-bg-secondary p-8 rounded-xl border border-border-subtle shadow-card transition-all duration-300">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tight text-text-primary mb-2">Connexion</h2>
            <p className="text-text-secondary text-sm">
              Entrez vos identifiants pour recevoir votre code OTP
            </p>
          </div>

          {displayError && (
            <div className="mb-6 p-4 bg-brand-red/10 border border-brand-red/20 rounded-md text-brand-red text-sm">
              {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@exemple.com"
                className="w-full bg-bg-tertiary border border-border-light rounded-md px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-150"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                  Mot de passe
                </label>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-tertiary border border-border-light rounded-md px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-150"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gold text-black rounded-full font-bold py-3 hover:bg-brand-gold-light focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150 shadow-glow flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'Continuer'
              )}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border-light"></div>
              <span className="flex-shrink mx-4 text-text-muted text-xs uppercase">ou</span>
              <div className="flex-grow border-t border-border-light"></div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 bg-bg-tertiary border border-border-light hover:border-text-secondary text-text-primary rounded-full py-3 text-sm font-semibold transition-all duration-150 hover:bg-bg-elevated cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={handleGithubLogin}
                className="flex items-center justify-center gap-2 bg-bg-tertiary border border-border-light hover:border-text-secondary text-text-primary rounded-full py-3 text-sm font-semibold transition-all duration-150 hover:bg-bg-elevated cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                <span>GitHub</span>
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-text-secondary">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-brand-gold hover:underline font-medium">
              S&apos;inscrire
            </Link>
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
