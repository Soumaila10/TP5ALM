import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { updateProfile } from '../services/userService';
import ThemeToggle from '../components/ThemeToggle';

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAuth = useAuthStore((state) => state.setAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await updateProfile({ firstName, lastName, phone });
      
      // Update global auth store
      setAuth(response.user, accessToken);
      
      setSuccess('Profil mis à jour avec succès !');
    } catch (err) {
      setError(err.message || 'Impossible de mettre à jour le profil.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-secondary sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
              <span className="text-brand-gold">FIFA</span> Ticketing Hub
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link to="/" className="text-text-secondary hover:text-text-primary transition-colors">
                Catalogue
              </Link>
              <Link to="/orders" className="text-text-secondary hover:text-text-primary transition-colors">
                Mes Commandes
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-text-secondary hover:text-text-primary transition-colors">
                  Administration
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text-secondary hidden sm:inline">
                {user.firstName} {user.lastName}
              </span>
              <div className="w-8 h-8 rounded-full bg-brand-gold text-black font-semibold text-sm flex items-center justify-center uppercase">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link to="/" className="text-sm text-brand-gold hover:underline flex items-center gap-1 mb-4">
            &larr; Retour au catalogue
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Mon Profil</h1>
          <p className="text-text-secondary mt-1">Gérez vos informations personnelles et vérifiez vos coordonnées.</p>
        </div>

        <div className="bg-bg-secondary rounded-lg shadow-card border border-border-subtle p-6 sm:p-8">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-text-secondary mb-2">
                  Prénom
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border-light rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold transition-colors duration-150 text-sm"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-text-secondary mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border-light rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold transition-colors duration-150 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                Adresse email (Non modifiable)
              </label>
              <input
                type="email"
                id="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 bg-bg-primary border border-border-subtle rounded-md text-text-muted cursor-not-allowed text-sm"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-secondary mb-2">
                Numéro de téléphone
              </label>
              <input
                type="text"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className="w-full px-4 py-3 bg-bg-tertiary border border-border-light rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold transition-colors duration-150 text-sm"
              />
            </div>

            <div className="pt-4 border-t border-border-subtle flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-brand-gold hover:bg-brand-gold-dark text-black font-semibold rounded-md shadow-glow transition-all duration-150 disabled:opacity-50 text-sm"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
