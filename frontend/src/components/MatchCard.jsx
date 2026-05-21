import { Link } from 'react-router-dom';

export default function MatchCard({ match }) {
  const { _id, teamA, teamB, round, date, stadiumId, availableSeats } = match;

  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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

  const isAvailable = availableSeats > 0;

  return (
    <div className="bg-bg-secondary border border-border-subtle rounded-xl overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-card flex flex-col justify-between group">
      {/* Match Header with Round & Status */}
      <div className="p-5 pb-3 flex justify-between items-center border-b border-border-subtle/50 bg-bg-tertiary/20">
        <span className="text-xs font-mono font-bold text-brand-gold tracking-wider uppercase">
          {getRoundLabel(round)}
        </span>
        
        {/* Animated availability badge */}
        <div className="flex items-center gap-1.5">
          <span className={`relative flex h-2.5 w-2.5`}>
            {isAvailable && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isAvailable ? 'bg-brand-green' : 'bg-brand-red'}`}></span>
          </span>
          <span className={`text-xs font-semibold ${isAvailable ? 'text-brand-green' : 'text-brand-red'}`}>
            {isAvailable ? `${availableSeats} dispo.` : 'Complet'}
          </span>
        </div>
      </div>

      {/* Match Body: Teams */}
      <div className="p-6 flex-grow flex flex-col justify-center">
        <div className="flex justify-between items-center gap-4 my-2">
          <div className="flex-1 text-center font-bold text-lg text-text-primary group-hover:text-brand-gold transition-colors duration-200">
            {teamA}
          </div>
          <div className="text-xs font-black px-2.5 py-1 bg-bg-tertiary text-text-secondary rounded font-mono">VS</div>
          <div className="flex-1 text-center font-bold text-lg text-text-primary group-hover:text-brand-gold transition-colors duration-200">
            {teamB}
          </div>
        </div>

        {/* Stadium Info */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-text-secondary text-sm">
          <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{stadiumId?.name ? `${stadiumId.name}, ${stadiumId.city}` : 'Stade inconnu'}</span>
        </div>
      </div>

      {/* Match Footer: Date & Action */}
      <div className="p-5 border-t border-border-subtle/50 flex flex-col gap-4 bg-bg-tertiary/10">
        <div className="text-center text-xs text-text-muted font-medium">
          {formattedDate}
        </div>
        
        <Link
          to={`/matches/${_id}`}
          className={`w-full text-center rounded-full font-bold py-2.5 text-sm transition-all duration-200 flex items-center justify-center ${
            isAvailable 
              ? 'bg-brand-gold text-black hover:bg-brand-gold-light shadow-glow' 
              : 'bg-bg-tertiary text-text-muted cursor-not-allowed border border-border-subtle'
          }`}
          onClick={(e) => !isAvailable && e.preventDefault()}
        >
          {isAvailable ? 'Réserver des places' : 'Complet'}
        </Link>
      </div>
    </div>
  );
}
