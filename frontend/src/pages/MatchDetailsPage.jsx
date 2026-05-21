import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMatchById, getMatchSeats } from '../services/matchService';
import { createCart } from '../services/cartService';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/authService';
import SeatMap from '../components/SeatMap';
import ThemeToggle from '../components/ThemeToggle';

export default function MatchDetailsPage() {
  const { id: matchId } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const loadMatchAndSeats = async (showSubLoader = false) => {
    if (!showSubLoader) setLoading(true);
    setError('');
    try {
      const matchData = await getMatchById(matchId);
      const seatsData = await getMatchSeats(matchId);
      setMatch(matchData);
      setSeats(seatsData);

      // If the currently selected seat is no longer available in the fresh seats list, clear it
      if (selectedSeat) {
        const freshSeat = seatsData.find((s) => s._id === selectedSeat._id);
        if (!freshSeat || freshSeat.status !== 'available') {
          setSelectedSeat(null);
          setActionError('Le siège que vous aviez sélectionné n\'est plus disponible.');
        }
      }
    } catch (err) {
      setError(err.message || 'Impossible de charger les détails du match');
    } finally {
      if (!showSubLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchAndSeats();
  }, [matchId]);

  const handleSelectSeat = (seat) => {
    setSelectedSeat(seat);
    setActionError('');
  };

  const handleBooking = async () => {
    if (!selectedSeat) return;

    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      const cart = await createCart(matchId, selectedSeat._id);
      // Success: redirect to checkout page with cart ID
      navigate('/checkout', { state: { cartId: cart.cartId } });
    } catch (err) {
      setActionError(err.message || 'Erreur lors de la réservation temporaire du siège.');
      // Refresh seat status as it might have been locked by someone else
      await loadMatchAndSeats(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      clearAuth();
      navigate('/login');
    } catch (err) {
      clearAuth();
      navigate('/login');
    }
  };

  const formattedDate = match
    ? new Date(match.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const getRoundLabel = (r) => {
    const rounds = {
      group: 'Phase de Groupes',
      round16: 'Huitième de Finale',
      quarter: 'Quart de Finale',
      semi: 'Demi-Finale',
      final: 'Finale',
    };
    return rounds[r] || r;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-bg-primary text-text-primary">
        <header className="border-b border-border-subtle bg-bg-secondary h-16 flex items-center justify-between px-8">
          <span className="text-brand-gold font-mono text-xl font-black uppercase">FIFA 2026</span>
        </header>
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-text-secondary text-sm">Chargement du match...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-bg-primary text-text-primary">
        <header className="border-b border-border-subtle bg-bg-secondary h-16 flex items-center justify-between px-8">
          <Link to="/" className="text-brand-gold font-mono text-xl font-black uppercase">FIFA 2026</Link>
        </header>
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="bg-bg-secondary p-8 rounded-xl border border-brand-red/20 max-w-md w-full text-center">
            <h3 className="text-brand-red font-bold text-lg mb-2">Erreur</h3>
            <p className="text-text-secondary text-sm mb-6">{error || 'Match introuvable'}</p>
            <Link to="/" className="bg-brand-gold text-black text-sm font-bold px-6 py-2.5 rounded-full hover:bg-brand-gold-light transition-colors">
              Retour au catalogue
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
                  Bonjour, <strong className="text-text-primary">{user?.firstName}</strong>
                </span>
                <Link to="/orders" className="text-xs font-bold text-text-primary border border-border-light px-3 py-1.5 rounded-full hover:bg-bg-tertiary transition-colors">
                  Mes billets
                </Link>
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full flex flex-col items-center">
        {/* Breadcrumbs */}
        <div className="w-full text-left mb-6">
          <Link to="/" className="text-xs text-brand-gold hover:underline flex items-center gap-1">
            &larr; Retour au catalogue des matchs
          </Link>
        </div>

        {/* Match Info Banner */}
        <div className="w-full bg-bg-secondary border border-border-subtle rounded-xl p-6 md:p-8 mb-8 shadow-card flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex-1">
            <span className="text-xs font-mono font-bold text-brand-gold uppercase tracking-wider bg-brand-gold/10 px-3 py-1 rounded-full">
              {getRoundLabel(match.round)}
            </span>
            <h1 className="text-2xl md:text-4xl font-black mt-3 mb-2">
              {match.teamA} <span className="text-text-muted font-normal">VS</span> {match.teamB}
            </h1>
            <p className="text-text-secondary text-sm md:text-base font-medium">{formattedDate}</p>
          </div>
          
          <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-border-subtle pt-6 md:pt-0 md:pl-8 w-full md:w-auto">
            <div>
              <p className="text-xs text-text-muted font-bold uppercase tracking-wider">Stade</p>
              <h3 className="text-base md:text-lg font-bold text-text-primary">{match.stadiumId?.name}</h3>
              <p className="text-xs text-text-secondary">{match.stadiumId?.city}, {match.stadiumId?.country}</p>
            </div>
          </div>
        </div>

        {/* SVG Seat map */}
        <div className="w-full mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">Sélectionnez votre siège</h2>
            <p className="text-xs text-text-secondary mt-1">Le plan ci-dessous montre les places disponibles en temps réel.</p>
          </div>
          
          <SeatMap
            seats={seats}
            selectedSeat={selectedSeat}
            onSelectSeat={handleSelectSeat}
            refreshSeats={() => loadMatchAndSeats(true)}
          />
        </div>

        {/* Action / Selection Summary Drawer */}
        {selectedSeat && (
          <div className="w-full max-w-xl bg-bg-secondary border border-brand-gold/20 rounded-xl p-6 shadow-modal mt-4 animate-fade-in">
            <h3 className="text-lg font-bold mb-3 text-brand-gold">Récapitulatif de la sélection</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm font-mono border-b border-border-subtle pb-4 mb-4">
              <div>
                <span className="text-text-muted block text-xs uppercase">Tribune / Section</span>
                <span className="text-text-primary font-bold">{selectedSeat.section}</span>
              </div>
              <div>
                <span className="text-text-muted block text-xs uppercase">Rangée / Siège</span>
                <span className="text-text-primary font-bold">Rang {selectedSeat.row}, N° {selectedSeat.number}</span>
              </div>
              <div>
                <span className="text-text-muted block text-xs uppercase">Catégorie</span>
                <span className={`font-bold uppercase ${
                  selectedSeat.category === 'A' ? 'text-brand-gold' : selectedSeat.category === 'B' ? 'text-brand-blue' : 'text-brand-green'
                }`}>
                  {selectedSeat.category}
                </span>
              </div>
              <div>
                <span className="text-text-muted block text-xs uppercase">Prix</span>
                <span className="text-brand-gold font-bold text-lg">{selectedSeat.price} €</span>
              </div>
            </div>

            {actionError && (
              <div className="text-xs font-semibold text-brand-red bg-brand-red/10 border border-brand-red/20 px-3 py-2.5 rounded-lg mb-4 text-center">
                {actionError}
              </div>
            )}

            <button
              onClick={handleBooking}
              disabled={actionLoading}
              className={`w-full bg-brand-gold hover:bg-brand-gold-light text-black font-bold py-3 px-6 rounded-full transition-all duration-200 shadow-glow flex items-center justify-center gap-2 ${
                actionLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {actionLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Réservation en cours...
                </>
              ) : isAuthenticated ? (
                'Confirmer la réservation (Verrou 10 min)'
              ) : (
                'Se connecter pour réserver'
              )}
            </button>
            <p className="text-[10px] text-text-muted text-center mt-2.5 italic">
              *En validant, le siège sera verrouillé pour vous pendant 10 minutes pour effectuer le paiement.
            </p>
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
