import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMatches } from '../services/matchService';
import { logout } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import MatchCard from '../components/MatchCard';
import ThemeToggle from '../components/ThemeToggle';

export default function CataloguePage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedStadium, setSelectedStadium] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Fetch matches on mount and when filters change
  useEffect(() => {
    async function loadMatches() {
      setLoading(true);
      setError('');
      try {
        const filters = {};
        if (teamSearch) {
          // If searching, we search either teamA or teamB, we will filter locally or via query
          // Let's pass it and let the backend filter or we filter locally for double-team search
        }
        if (selectedStadium) {
          filters.stadiumId = selectedStadium;
        }
        if (selectedDate) {
          filters.date = selectedDate;
        }
        
        const data = await getMatches(filters);
        
        // Local search filter for team names to allow searching both teamA/teamB in one input
        let filteredData = Array.isArray(data) ? data : [];
        if (teamSearch && Array.isArray(data)) {
          const searchLower = teamSearch.toLowerCase();
          filteredData = data.filter(
            (m) =>
              m.teamA?.toLowerCase().includes(searchLower) ||
              m.teamB?.toLowerCase().includes(searchLower)
          );
        }

        setMatches(filteredData);
      } catch (err) {
        setError(err.message || 'Impossible de charger les matchs');
      } finally {
        setLoading(false);
      }
    }

    // Debounce search input
    const delayDebounce = setTimeout(() => {
      loadMatches();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [teamSearch, selectedStadium, selectedDate]);

  // Extract unique stadiums from fetched matches (when unfiltered by stadium)
  const [allStadiums, setAllStadiums] = useState([]);
  useEffect(() => {
    async function fetchAllStadiums() {
      try {
        // Fetch all active matches once to extract unique stadiums
        const data = await getMatches();
        const stadiumsMap = {};
        if (Array.isArray(data)) {
          data.forEach((m) => {
            if (m.stadiumId) {
              stadiumsMap[m.stadiumId._id] = m.stadiumId;
            }
          });
        }
        setAllStadiums(Object.values(stadiumsMap));
      } catch (err) {
        // Ignore errors for stadium list extraction
      }
    }
    fetchAllStadiums();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      clearAuth();
      navigate('/login');
    } catch (err) {
      // Clear local auth anyway
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-secondary/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-brand-gold font-mono text-xl font-black tracking-wider uppercase">
            FIFA 2026
          </Link>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="hidden md:inline text-sm text-text-secondary">
                  Bonjour, <strong className="text-text-primary">{user?.firstName} {user?.lastName}</strong>
                </span>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="text-xs font-bold text-brand-gold border border-brand-gold/30 px-3 py-1.5 rounded-full hover:bg-brand-gold/10 transition-colors">
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-bg-tertiary text-text-primary text-sm font-semibold px-4 py-2 rounded-full hover:bg-bg-elevated transition-colors border border-border-light"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-text-primary text-sm font-semibold px-4 py-2 rounded-full hover:bg-bg-tertiary transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-gold text-black text-sm font-bold px-4 py-2 rounded-full hover:bg-brand-gold-light transition-colors shadow-glow"
                >
                  S&apos;inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {/* Hero Section */}
        <div className="text-center my-8 md:my-12">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-4">
            FIFA WORLD CUP <span className="text-brand-gold">2026</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Réservez vos places officielles pour la plus grande compétition de football de l&apos;histoire aux États-Unis, Canada et Mexique.
          </p>
        </div>

        {/* Filters Panel */}
        <div className="bg-bg-secondary p-6 rounded-xl border border-border-subtle shadow-card mb-8">
          <h2 className="text-lg font-bold mb-4 text-text-primary">Rechercher des matchs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Team search input */}
            <div>
              <label htmlFor="teamSearch" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                Équipe
              </label>
              <div className="relative">
                <input
                  id="teamSearch"
                  type="text"
                  placeholder="Ex: France, Brésil..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-light rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-gold transition-colors"
                />
                <svg className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Stadium selector */}
            <div>
              <label htmlFor="stadium" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                Stade / Ville
              </label>
              <select
                id="stadium"
                value={selectedStadium}
                onChange={(e) => setSelectedStadium(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-light rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-gold transition-colors appearance-none"
              >
                <option value="">Tous les stades</option>
                {allStadiums.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Date filter */}
            <div>
              <label htmlFor="date" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-light rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-gold transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6 bg-brand-red/10 border border-brand-red/20 rounded-xl text-brand-red text-center my-6">
            <h3 className="font-bold mb-1">Erreur de chargement</h3>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Matches Grid */}
        {loading ? (
          // Loading skeletons
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-bg-secondary border border-border-subtle rounded-xl h-[300px] animate-pulse flex flex-col justify-between p-6">
                <div className="h-4 bg-bg-tertiary rounded w-1/3"></div>
                <div className="space-y-3 my-4">
                  <div className="h-6 bg-bg-tertiary rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-bg-tertiary rounded w-1/2 mx-auto"></div>
                </div>
                <div className="h-10 bg-bg-tertiary rounded-full w-full"></div>
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          // Empty State
          <div className="bg-bg-secondary p-12 rounded-xl border border-border-subtle text-center shadow-card">
            <svg className="w-12 h-12 text-text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold mb-1 text-text-primary">Aucun match trouvé</h3>
            <p className="text-text-secondary text-sm max-w-md mx-auto">
              Nous n&apos;avons trouvé aucun match correspondant à vos critères de recherche. Essayez de réinitialiser vos filtres.
            </p>
          </div>
        ) : (
          // Matches grid list
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((m) => (
              <MatchCard key={m._id} match={m} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8 text-center text-xs text-text-muted bg-bg-secondary/40">
        <p>&copy; 2026 FIFA Ticketing Hub. Tous droits réservés.</p>
        <p className="mt-2 text-[10px]">Développé dans un cadre pédagogique Master 2 ALM.</p>
      </footer>
    </div>
  );
}
