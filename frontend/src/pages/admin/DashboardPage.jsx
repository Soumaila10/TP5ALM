import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getAdminStats, downloadAdminCSV } from '../../services/adminService';
import ThemeToggle from '../../components/ThemeToggle';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);

  // Guard routing: must be authenticated and admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await getAdminStats();
        setStats(data);
      } catch (err) {
        setError(err.message || 'Impossible de charger les statistiques.');
      } finally {
        setLoading(false);
      }
    }
    if (user?.role === 'admin') {
      loadStats();
    }
  }, [user]);

  const handleExportCSV = async () => {
    try {
      setCsvLoading(true);
      await downloadAdminCSV();
    } catch (err) {
      alert(err.message || 'Erreur lors du téléchargement du CSV');
    } finally {
      setCsvLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') return null;

  // Calculate highest revenue match to scale SVG chart
  const maxRevenue = stats?.statsPerMatch?.reduce((max, m) => Math.max(max, m.revenue), 0) || 1;
  const maxSold = stats?.statsPerMatch?.reduce((max, m) => Math.max(max, m.ticketsSold), 0) || 1;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-secondary sticky top-0 z-45">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
              <span className="text-brand-gold">FIFA</span> Admin
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link to="/admin" className="text-text-primary hover:text-text-primary transition-colors border-b-2 border-brand-gold pb-5 mt-5">
                Dashboard
              </Link>
              <Link to="/admin/matches" className="text-text-secondary hover:text-text-primary transition-colors pb-5 mt-5">
                Gérer les Matchs
              </Link>
              <Link to="/" className="text-text-secondary hover:text-text-primary transition-colors pb-5 mt-5">
                Retour Catalogue
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text-secondary hidden sm:inline">
                {user.firstName} {user.lastName} (Admin)
              </span>
              <div className="w-8 h-8 rounded-full bg-brand-gold text-black font-semibold text-sm flex items-center justify-center uppercase">
                {user.firstName[0]}{user.lastName[0]}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Page Title & CSV Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Tableau de bord</h1>
            <p className="text-text-secondary mt-1">
              Visualisez le chiffre d&apos;affaires global et les statistiques de ventes en temps réel.
            </p>
          </div>
          <div>
            <button
              onClick={handleExportCSV}
              disabled={csvLoading || !stats?.ticketsSold}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-semibold rounded-md shadow-glow transition-all duration-150 disabled:opacity-50"
            >
              {csvLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Exportation...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Exporter les ventes (CSV)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-brand-red/10 border border-brand-red/20 rounded-md text-brand-red text-sm">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-bg-secondary h-32 rounded-lg border border-border-subtle animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {/* Total Revenue KPI */}
              <div className="bg-bg-secondary p-6 rounded-lg border border-border-subtle shadow-card flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Revenu Total (Stripe)
                  </p>
                  <h3 className="text-4xl font-extrabold mt-2 text-brand-green">
                    {(stats?.totalRevenue || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </h3>
                </div>
                <div className="mt-4 text-xs text-text-muted flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-green inline-block"></span>
                  Paiements confirmés et validés
                </div>
              </div>

              {/* Tickets Sold KPI */}
              <div className="bg-bg-secondary p-6 rounded-lg border border-border-subtle shadow-card flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Billets Vendus
                  </p>
                  <h3 className="text-4xl font-extrabold mt-2">
                    {stats?.ticketsSold || 0}
                  </h3>
                </div>
                <div className="mt-4 text-xs text-text-muted flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-gold inline-block"></span>
                  Tickets générés avec QR unique
                </div>
              </div>

              {/* Active Matches KPI */}
              <div className="bg-bg-secondary p-6 rounded-lg border border-border-subtle shadow-card flex flex-col justify-between">
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                    Taux Moyen de Remplissage
                  </p>
                  <h3 className="text-4xl font-extrabold mt-2 text-brand-blue">
                    {stats?.statsPerMatch?.length
                      ? Math.round(
                          (stats.statsPerMatch.reduce((sum, m) => sum + m.ticketsSold, 0) /
                            (stats.statsPerMatch.length * 50)) *
                            100
                        )
                      : 0}
                    %
                  </h3>
                </div>
                <div className="mt-4 text-xs text-text-muted flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-blue inline-block"></span>
                  Sur la base des ventes effectives
                </div>
              </div>
            </div>

            {/* Graphics & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Revenue SVG Chart */}
              <div className="bg-bg-secondary p-6 rounded-lg border border-border-subtle shadow-card">
                <h3 className="text-lg font-bold mb-6">Revenus par Match (Top 5)</h3>
                {stats?.statsPerMatch && stats.statsPerMatch.length > 0 ? (
                  <div className="space-y-4">
                    {stats.statsPerMatch
                      .slice(0, 5)
                      .map((m) => {
                        const pct = (m.revenue / maxRevenue) * 100;
                        return (
                          <div key={m.matchId} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{m.teamA} vs {m.teamB}</span>
                              <span className="text-brand-green">{m.revenue} €</span>
                            </div>
                            <div className="w-full bg-bg-tertiary h-2.5 rounded-full overflow-hidden">
                              <div
                                className="bg-brand-green h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(pct, 4)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-10">Aucune donnée disponible</p>
                )}
              </div>

              {/* Tickets Sold SVG Chart */}
              <div className="bg-bg-secondary p-6 rounded-lg border border-border-subtle shadow-card">
                <h3 className="text-lg font-bold mb-6">Billets vendus par Match (Top 5)</h3>
                {stats?.statsPerMatch && stats.statsPerMatch.length > 0 ? (
                  <div className="space-y-4">
                    {stats.statsPerMatch
                      .slice(0, 5)
                      .map((m) => {
                        const pct = (m.ticketsSold / maxSold) * 100;
                        return (
                          <div key={m.matchId} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{m.teamA} vs {m.teamB}</span>
                              <span className="text-brand-gold">{m.ticketsSold} vendus</span>
                            </div>
                            <div className="w-full bg-bg-tertiary h-2.5 rounded-full overflow-hidden">
                              <div
                                className="bg-brand-gold h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(pct, 4)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted text-center py-10">Aucune donnée disponible</p>
                )}
              </div>
            </div>

            {/* Sales Table */}
            <div className="bg-bg-secondary rounded-lg border border-border-subtle shadow-card overflow-hidden">
              <div className="p-6 border-b border-border-subtle flex justify-between items-center">
                <h3 className="text-lg font-bold">Performances par match</h3>
                <span className="text-xs bg-bg-tertiary text-text-secondary px-3 py-1 rounded-full border border-border-light font-mono">
                  {stats?.statsPerMatch?.length || 0} matchs enregistrés
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-bg-tertiary text-xs font-bold text-text-secondary uppercase tracking-wider border-b border-border-subtle">
                      <th className="p-4">Match</th>
                      <th className="p-4">Stade / Ville</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-center">Tickets Vendus</th>
                      <th className="p-4 text-right">Revenu</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-border-subtle">
                    {stats?.statsPerMatch && stats.statsPerMatch.length > 0 ? (
                      stats.statsPerMatch.map((m) => (
                        <tr key={m.matchId} className="hover:bg-bg-tertiary/50 transition-colors">
                          <td className="p-4 font-semibold">
                            {m.teamA} <span className="text-text-muted mx-1">vs</span> {m.teamB}
                          </td>
                          <td className="p-4 text-text-secondary">{m.stadiumName}</td>
                          <td className="p-4 text-text-secondary">
                            {new Date(m.date).toLocaleDateString('fr-FR')} {new Date(m.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-4 text-center font-semibold text-brand-gold">
                            {m.ticketsSold}
                          </td>
                          <td className="p-4 text-right font-semibold text-brand-green">
                            {m.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-text-muted">
                          Aucune vente enregistrée pour le moment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
