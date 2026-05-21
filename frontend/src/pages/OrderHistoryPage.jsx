import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOrders } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/authService';
import ThemeToggle from '../components/ThemeToggle';

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/orders' } });
      return;
    }

    async function loadOrders() {
      setLoading(true);
      setError('');
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (err) {
        setError(err.message || 'Impossible de récupérer l\'historique des commandes.');
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [isAuthenticated]);

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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-brand-green/10 text-brand-green border border-brand-green/20';
      case 'pending':
        return 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20';
      case 'cancelled':
        return 'bg-brand-red/10 text-brand-red border border-brand-red/20';
      default:
        return 'bg-bg-tertiary text-text-secondary';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmée';
      case 'pending': return 'En attente';
      case 'cancelled': return 'Annulée';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-bg-primary text-text-primary">
        <header className="border-b border-border-subtle bg-bg-secondary h-16 flex items-center justify-between px-8">
          <span className="text-brand-gold font-mono text-xl font-black uppercase">FIFA 2026</span>
        </header>
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-text-secondary text-sm">Chargement de votre historique...</p>
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
            
            {isAuthenticated && (
              <div className="flex items-center gap-3">
                <span className="hidden md:inline text-sm text-text-secondary">
                  Bonjour, <strong className="text-text-primary">{user?.firstName}</strong>
                </span>
                <Link to="/" className="text-xs font-bold text-brand-gold border border-brand-gold/30 px-3 py-1.5 rounded-full hover:bg-brand-gold/10 transition-colors">
                  Acheter des billets
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-bg-tertiary text-text-primary text-sm font-semibold px-4 py-2 rounded-full hover:bg-bg-elevated transition-colors border border-border-light"
                >
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2">Historique des Commandes</h1>
          <p className="text-text-secondary text-sm">Retrouvez tous vos billets officiels achetés pour la Coupe du Monde FIFA 2026.</p>
        </div>

        {error && (
          <div className="p-6 bg-brand-red/10 border border-brand-red/20 rounded-xl text-brand-red text-center mb-8">
            <h3 className="font-bold mb-1">Erreur de chargement</h3>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          /* Empty State */
          <div className="bg-bg-secondary p-12 rounded-xl border border-border-subtle text-center shadow-card max-w-xl mx-auto my-8">
            <svg className="w-12 h-12 text-text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Vous n&apos;avez pas encore de billets</h3>
            <p className="text-text-secondary text-sm mb-6">
              Vos réservations et confirmations d&apos;achats s&apos;afficheront ici. Explorez notre catalogue des matchs pour réserver votre place !
            </p>
            <Link to="/" className="bg-brand-gold text-black text-sm font-bold px-6 py-2.5 rounded-full hover:bg-brand-gold-light transition-colors shadow-glow inline-block">
              Voir les matchs
            </Link>
          </div>
        ) : (
          /* Table of Orders */
          <div className="bg-bg-secondary border border-border-subtle rounded-xl overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-tertiary/20 text-xs font-bold text-text-muted uppercase tracking-wider">
                    <th className="px-6 py-4">Commande ID</th>
                    <th className="px-6 py-4">Date d&apos;achat</th>
                    <th className="px-6 py-4">Montant total</th>
                    <th className="px-6 py-4">Statut</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-sm">
                  {orders.map((o) => {
                    const formattedDate = new Date(o.createdAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    });

                    return (
                      <tr key={o._id} className="hover:bg-bg-tertiary/10 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-text-primary">
                          {o.stripePaymentIntentId?.slice(0, 16) || o._id}
                        </td>
                        <td className="px-6 py-4 text-text-secondary">{formattedDate}</td>
                        <td className="px-6 py-4 font-bold text-brand-gold">{o.totalAmount} €</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeClass(o.status)}`}>
                            {getStatusLabel(o.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/orders/${o._id}`}
                            className="text-xs bg-bg-tertiary text-text-primary border border-border-light font-bold px-4 py-1.5 rounded-full hover:bg-bg-elevated transition-colors inline-block"
                          >
                            Afficher le Billet
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
