import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';
import ThemeToggle from '../components/ThemeToggle';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validations
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
      });

      setSuccess('Inscription réussie ! Redirection vers la page de connexion...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || "Une erreur est survenue lors de l'inscription");
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

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md bg-bg-secondary p-8 rounded-xl border border-border-subtle shadow-card transition-all duration-300">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tight text-text-primary mb-2">Créer un compte</h2>
            <p className="text-text-secondary text-sm">
              Rejoignez le FIFA Ticketing Hub pour réserver vos billets
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-brand-red/10 border border-brand-red/20 rounded-md text-brand-red text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-brand-green/10 border border-brand-green/20 rounded-md text-brand-green text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-text-secondary mb-1">
                  Prénom
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className="w-full bg-bg-tertiary border border-border-light rounded-md px-4 py-2.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-150"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-text-secondary mb-1">
                  Nom
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className="w-full bg-bg-tertiary border border-border-light rounded-md px-4 py-2.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-150"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="nom@exemple.com"
                className="w-full bg-bg-tertiary border border-border-light rounded-md px-4 py-2.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-150"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-1">
                Téléphone (optionnel)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+33 6 12 34 56 78"
                className="w-full bg-bg-tertiary border border-border-light rounded-md px-4 py-2.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-150"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-bg-tertiary border border-border-light rounded-md px-4 py-2.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-150"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-bg-tertiary border border-border-light rounded-md px-4 py-2.5 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-150"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gold text-black rounded-full font-bold py-3 mt-4 hover:bg-brand-gold-light focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150 shadow-glow flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                "S'inscrire"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-text-secondary">
            Déjà inscrit ?{' '}
            <Link to="/login" className="text-brand-gold hover:underline font-medium">
              Se connecter
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
