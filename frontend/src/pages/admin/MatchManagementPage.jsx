import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  getAdminMatches,
  createAdminMatch,
  updateAdminMatch,
  deleteAdminMatch,
  getStadiums,
} from '../../services/adminService';
import ThemeToggle from '../../components/ThemeToggle';

export default function MatchManagementPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [matches, setMatches] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  // Form states
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [round, setRound] = useState('group');
  const [group, setGroup] = useState('');
  const [date, setDate] = useState('');
  const [stadiumId, setStadiumId] = useState('');
  const [totalSeats, setTotalSeats] = useState(50);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Guard routing: must be authenticated and admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.role !== 'admin') {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  async function loadData() {
    try {
      setLoading(true);
      setError('');
      const [matchesData, stadiumsData] = await Promise.all([
        getAdminMatches(),
        getStadiums(),
      ]);
      setMatches(matchesData);
      setStadiums(stadiumsData);
    } catch (err) {
      setError(err.message || 'Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedMatchId(null);
    setTeamA('');
    setTeamB('');
    setRound('group');
    setGroup('');
    setDate('');
    setStadiumId(stadiums[0]?._id || '');
    setTotalSeats(50);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (match) => {
    setModalMode('edit');
    setSelectedMatchId(match._id);
    setTeamA(match.teamA);
    setTeamB(match.teamB);
    setRound(match.round);
    setGroup(match.group || '');
    
    // Format date string for input type="datetime-local" (YYYY-MM-DDTHH:MM)
    if (match.date) {
      const d = new Date(match.date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      setDate(`${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
      setDate('');
    }
    
    setStadiumId(match.stadiumId?._id || match.stadiumId || '');
    setTotalSeats(match.totalSeats);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    if (!teamA || !teamB || !round || !date || !stadiumId || !totalSeats) {
      setFormError('Veuillez remplir tous les champs obligatoires.');
      setFormLoading(false);
      return;
    }

    const payload = {
      teamA,
      teamB,
      round,
      group: round === 'group' ? group : undefined,
      date: new Date(date).toISOString(),
      stadiumId,
      totalSeats: Number(totalSeats),
    };

    try {
      if (modalMode === 'create') {
        await createAdminMatch(payload);
        setSuccess('Match créé avec succès.');
      } else {
        await updateAdminMatch(selectedMatchId, payload);
        setSuccess('Match modifié avec succès.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setFormError(err.message || 'Erreur lors de l’enregistrement du match.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir désactiver ce match ? Les utilisateurs ne pourront plus réserver de billets.')) {
      return;
    }

    try {
      await deleteAdminMatch(id);
      setSuccess('Match désactivé avec succès.');
      loadData();
    } catch (err) {
      setError(err.message || 'Erreur lors de la désactivation.');
    }
  };

  if (!isAuthenticated || user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-border-subtle bg-bg-secondary sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2">
              <span className="text-brand-gold">FIFA</span> Admin
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link to="/admin" className="text-text-secondary hover:text-text-primary transition-colors pb-5 mt-5">
                Dashboard
              </Link>
              <Link to="/admin/matches" className="text-text-primary hover:text-text-primary transition-colors border-b-2 border-brand-gold pb-5 mt-5">
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
        {/* Page Title & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Gestion des Matchs</h1>
            <p className="text-text-secondary mt-1">
              Créez, modifiez ou désactivez les matchs du tournoi FIFA 2026.
            </p>
          </div>
          <div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-semibold rounded-md shadow-glow transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un Match
            </button>
          </div>
        </div>

        {/* Global Messages */}
        {error && (
          <div className="mb-6 p-4 bg-brand-red/10 border border-brand-red/20 rounded-md text-brand-red text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-brand-green/10 border border-brand-green/20 rounded-md text-brand-green text-sm flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-brand-green font-bold text-xs uppercase hover:underline">
              Fermer
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-bg-secondary border border-border-subtle rounded-lg p-10 flex justify-center items-center">
            <svg className="animate-spin h-8 w-8 text-brand-gold" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          </div>
        ) : (
          /* Vercel-style Dense Table */
          <div className="bg-bg-secondary rounded-lg border border-border-subtle shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-tertiary text-xs font-bold text-text-secondary uppercase tracking-wider border-b border-border-subtle">
                    <th className="p-4">Match</th>
                    <th className="p-4">Stade / Ville</th>
                    <th className="p-4">Date & Heure</th>
                    <th className="p-4">Phase</th>
                    <th className="p-4 text-center">Places Restantes</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-border-subtle">
                  {matches.length > 0 ? (
                    matches.map((m) => {
                      const stadiumName = m.stadiumId?.name || 'Inconnu';
                      const city = m.stadiumId?.city || '';
                      return (
                        <tr key={m._id} className={`hover:bg-bg-tertiary/30 transition-colors ${!m.isActive ? 'opacity-50' : ''}`}>
                          <td className="p-4 font-semibold">
                            <span className="text-text-primary">{m.teamA}</span>
                            <span className="text-text-muted mx-1.5">vs</span>
                            <span className="text-text-primary">{m.teamB}</span>
                            {m.group && (
                              <span className="ml-2 text-xs bg-bg-tertiary px-2 py-0.5 rounded text-text-secondary border border-border-light font-mono">
                                Gr. {m.group}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="text-text-primary">{stadiumName}</div>
                            {city && <div className="text-xs text-text-muted">{city}</div>}
                          </td>
                          <td className="p-4 text-text-secondary">
                            <div>{new Date(m.date).toLocaleDateString('fr-FR')}</div>
                            <div className="text-xs text-text-muted">
                              {new Date(m.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="p-4 capitalize text-text-secondary">
                            {m.round === 'group' ? 'Phase de groupes' :
                             m.round === 'round16' ? '8ème de finale' :
                             m.round === 'quarter' ? 'Quart de finale' :
                             m.round === 'semi' ? 'Demi-finale' : 'Finale'}
                          </td>
                          <td className="p-4 text-center">
                            <div className="font-semibold text-text-primary">
                              {m.availableSeats} / {m.totalSeats}
                            </div>
                            <div className="w-20 bg-bg-tertiary h-1.5 rounded-full mx-auto mt-1.5 overflow-hidden">
                              <div
                                className="bg-brand-gold h-full"
                                style={{ width: `${(m.availableSeats / m.totalSeats) * 100}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-4">
                            {m.isActive ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full border border-brand-green/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
                                Actif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-red bg-brand-red/10 px-2 py-0.5 rounded-full border border-brand-red/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-red"></span>
                                Inactif
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(m)}
                                className="p-1.5 text-text-secondary hover:text-brand-gold hover:bg-bg-tertiary rounded transition-colors"
                                title="Modifier le match"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              {m.isActive && (
                                <button
                                  onClick={() => handleDeactivate(m._id)}
                                  className="p-1.5 text-text-secondary hover:text-brand-red hover:bg-bg-tertiary rounded transition-colors"
                                  title="Désactiver le match"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-text-muted">
                        Aucun match trouvé.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-bg-secondary w-full max-w-lg rounded-lg border border-border-subtle shadow-modal overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-border-subtle flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {modalMode === 'create' ? 'Créer un Match' : 'Modifier le Match'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-secondary hover:text-text-primary transition-colors text-sm font-semibold uppercase"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-brand-red/10 border border-brand-red/20 rounded text-brand-red text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="teamA" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    Équipe A
                  </label>
                  <input
                    id="teamA"
                    type="text"
                    value={teamA}
                    onChange={(e) => setTeamA(e.target.value)}
                    required
                    className="w-full bg-bg-tertiary border border-border-light rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label htmlFor="teamB" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    Équipe B
                  </label>
                  <input
                    id="teamB"
                    type="text"
                    value={teamB}
                    onChange={(e) => setTeamB(e.target.value)}
                    required
                    className="w-full bg-bg-tertiary border border-border-light rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="round" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    Phase
                  </label>
                  <select
                    id="round"
                    value={round}
                    onChange={(e) => setRound(e.target.value)}
                    className="w-full bg-bg-tertiary border border-border-light rounded px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-gold appearance-none"
                  >
                    <option value="group">Groupe</option>
                    <option value="round16">8ème de finale</option>
                    <option value="quarter">Quart de finale</option>
                    <option value="semi">Demi-finale</option>
                    <option value="final">Finale</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="group" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                    Groupe (Optionnel)
                  </label>
                  <input
                    id="group"
                    type="text"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    disabled={round !== 'group'}
                    placeholder="Ex: A, B, C..."
                    className="w-full bg-bg-tertiary border border-border-light rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-gold disabled:opacity-40"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="date" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                  Date & Heure
                </label>
                <input
                  id="date"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-bg-tertiary border border-border-light rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div>
                <label htmlFor="stadium" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                  Stade
                </label>
                <select
                  id="stadium"
                  value={stadiumId}
                  onChange={(e) => setStadiumId(e.target.value)}
                  className="w-full bg-bg-tertiary border border-border-light rounded px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-brand-gold appearance-none"
                >
                  {stadiums.map((stadium) => (
                    <option key={stadium._id} value={stadium._id}>
                      {stadium.name} ({stadium.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="totalSeats" className="block text-xs font-bold text-text-secondary uppercase mb-1.5">
                  Nombre total de sièges
                </label>
                <input
                  id="totalSeats"
                  type="number"
                  min="1"
                  max="100000"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(Number(e.target.value))}
                  required
                  disabled={modalMode === 'edit'}
                  className="w-full bg-bg-tertiary border border-border-light rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-gold disabled:opacity-40"
                />
                {modalMode === 'edit' && (
                  <p className="text-xs text-text-muted mt-1">Le nombre total de sièges ne peut pas être modifié après création.</p>
                )}
              </div>

              <div className="pt-4 border-t border-border-subtle flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border-light rounded text-sm text-text-primary hover:bg-bg-tertiary transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-brand-gold hover:bg-brand-gold-dark text-black text-sm font-semibold rounded shadow-glow transition-all duration-150 disabled:opacity-50"
                >
                  {formLoading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
