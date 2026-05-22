import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getOrderDetails } from '../services/orderService';
import { apiRequest, getAccessToken } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/authService';
import ThemeToggle from '../components/ThemeToggle';

export default function TicketPage() {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [qrCodes, setQrCodes] = useState({}); // ticketId -> qrCodeBase64
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/orders/${orderId}` } });
      return;
    }

    async function loadOrderAndTickets() {
      setLoading(true);
      setError('');
      try {
        const data = await getOrderDetails(orderId);
        setOrder(data.order);
        setTickets(data.tickets);

        // Fetch QR codes for all tickets in the order
        const qrs = {};
        for (const t of data.tickets) {
          try {
            const qrData = await apiRequest(`/tickets/${t._id}/qr`);
            qrs[t._id] = qrData.qrCode;
          } catch (qrErr) {
            console.error('Failed to load QR code for ticket', t._id, qrErr);
          }
        }
        setQrCodes(qrs);
      } catch (err) {
        setError(err.message || 'Impossible de récupérer les détails de la commande.');
      } finally {
        setLoading(false);
      }
    }

    loadOrderAndTickets();
  }, [orderId, isAuthenticated]);

  const handleDownloadPdf = async (ticketId) => {
    setDownloadingId(ticketId);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const token = getAccessToken();
      
      const response = await fetch(`${API_URL}/tickets/${ticketId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération du PDF.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billet-match-${ticketId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Erreur lors du téléchargement du billet PDF.');
    } finally {
      setDownloadingId(null);
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-bg-primary text-text-primary">
        <header className="border-b border-border-subtle bg-bg-secondary h-16 flex items-center justify-between px-8">
          <span className="text-brand-gold font-mono text-xl font-black uppercase">FIFA 2026</span>
        </header>
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-text-secondary text-sm">Récupération de vos billets...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order || tickets.length === 0) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-bg-primary text-text-primary">
        <header className="border-b border-border-subtle bg-bg-secondary h-16 flex items-center justify-between px-8">
          <Link to="/" className="text-brand-gold font-mono text-xl font-black uppercase">FIFA 2026</Link>
        </header>
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="bg-bg-secondary p-8 rounded-xl border border-border-light max-w-md w-full text-center">
            <h3 className="text-brand-red font-bold text-lg mb-2">Commande introuvable</h3>
            <p className="text-text-secondary text-sm mb-6">{error || 'Cette commande n\'existe pas.'}</p>
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
            
            {isAuthenticated && (
              <div className="flex items-center gap-3">
                <span className="hidden md:inline text-sm text-text-secondary">
                  Bonjour, <strong className="text-text-primary">{user?.firstName} {user?.lastName}</strong>
                </span>
                <Link to="/orders" className="text-xs font-bold text-text-primary border border-border-light px-3 py-1.5 rounded-full hover:bg-bg-tertiary transition-colors">
                  Historique
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {/* Navigation Breadcrumbs */}
        <div className="w-full text-left mb-6 flex justify-between items-center">
          <Link to="/orders" className="text-xs text-brand-gold hover:underline">
            &larr; Retour à l&apos;historique
          </Link>
          <span className="text-xs text-text-muted font-mono">
            Réf Commande : {order.stripePaymentIntentId?.slice(0, 16) || order._id}
          </span>
        </div>

        {/* Success Alert Banner if redirected from checkout */}
        {location.state?.status === 'success' && (
          <div className="bg-brand-green/10 border border-brand-green/30 rounded-xl p-4 text-brand-green text-center text-sm font-bold mb-8">
            Félicitations ! Votre paiement a été traité avec succès et votre billet est confirmé. Un email de confirmation contenant votre PDF vous a été envoyé.
          </div>
        )}

        {/* Tickets Grid list */}
        <div className="space-y-8">
          {tickets.map((ticket) => {
            const match = ticket.matchId;
            const stadium = match?.stadiumId;
            const seat = ticket.seatId;
            const qrCodeData = qrCodes[ticket._id];

            const formattedMatchDate = match
              ? new Date(match.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            return (
              <div
                key={ticket._id}
                className="relative bg-gradient-to-br from-bg-secondary via-[#141420] to-bg-elevated border border-brand-gold/30 rounded-2xl overflow-hidden shadow-modal flex flex-col md:flex-row group"
              >
                {/* Visual Ticket Body */}
                <div className="flex-grow p-6 md:p-8 flex flex-col justify-between">
                  {/* FIFA Header */}
                  <div className="flex justify-between items-start border-b border-border-subtle/50 pb-4 mb-4">
                    <div>
                      <span className="text-[10px] font-mono font-black text-brand-gold tracking-widest uppercase bg-brand-gold/10 px-2.5 py-0.5 rounded-full">
                        FIFA World Cup 2026 &trade;
                      </span>
                      <h3 className="text-lg font-black text-text-primary uppercase tracking-tight mt-2">
                        Billet d&apos;Accès Officiel
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ticket.status === 'valid' ? 'bg-brand-green/10 text-brand-green border border-brand-green/20' : 'bg-brand-red/10 text-brand-red'
                      }`}>
                        {ticket.status === 'valid' ? 'VALIDE' : ticket.status === 'used' ? 'UTILISÉ' : 'ANNULÉ'}
                      </span>
                    </div>
                  </div>

                  {/* Match Info */}
                  <div className="my-3">
                    <div className="flex items-center gap-3 font-bold text-xl md:text-2xl text-text-primary">
                      <span>{match?.teamA}</span>
                      <span className="text-text-muted text-sm font-normal">VS</span>
                      <span>{match?.teamB}</span>
                    </div>
                    <p className="text-text-secondary text-xs mt-1 font-medium">{formattedMatchDate}</p>
                  </div>

                  {/* Stadium & Seat Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-bg-primary/40 border border-border-subtle rounded-xl p-4 mt-4 text-xs font-mono">
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase">Stade</span>
                      <span className="text-text-primary font-bold truncate block">{stadium?.name}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase">Section</span>
                      <span className="text-text-primary font-bold">{seat?.section || 'Standard'}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase">Rang / Siège</span>
                      <span className="text-text-primary font-bold">Rang {seat?.row}, N° {seat?.number}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase">Catégorie</span>
                      <span className={`font-bold ${
                        seat?.category === 'A' ? 'text-brand-gold' : seat?.category === 'B' ? 'text-brand-blue' : 'text-brand-green'
                      }`}>
                        Classe {seat?.category || 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ticket Stub (QR Code & Action Area) */}
                <div className="w-full md:w-[220px] bg-bg-primary/20 border-t md:border-t-0 md:border-l border-dashed border-border-subtle/80 flex flex-col items-center justify-between p-6 md:p-8 gap-4">
                  {/* QR code container */}
                  <div className="bg-white p-2 rounded-xl flex items-center justify-center w-[120px] h-[120px] shadow-card">
                    {qrCodeData ? (
                      <img src={qrCodeData} alt="Billet QR Code" className="w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-bg-tertiary animate-pulse rounded"></div>
                    )}
                  </div>

                  <div className="w-full text-center">
                    <span className="text-[10px] font-mono text-text-muted block mb-3">
                      ID: {ticket.qrCode?.slice(0, 8)}...
                    </span>
                    <button
                      onClick={() => handleDownloadPdf(ticket._id)}
                      disabled={downloadingId === ticket._id}
                      className="w-full bg-brand-gold hover:bg-brand-gold-light disabled:bg-bg-tertiary text-black disabled:text-text-muted text-xs font-bold py-2 px-4 rounded-full transition-colors flex items-center justify-center gap-1.5 shadow-glow"
                    >
                      {downloadingId === ticket._id ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-text-muted border-t-transparent rounded-full animate-spin"></div>
                          Téléchargement...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Télécharger le PDF
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-8 text-center text-xs text-text-muted bg-bg-secondary/40">
        <p>&copy; 2026 FIFA Ticketing Hub. Tous droits réservés.</p>
        <p className="mt-2 text-[10px]">Développé dans un cadre pédagogique Master 2 ALM.</p>
      </footer>
    </div>
  );
}
