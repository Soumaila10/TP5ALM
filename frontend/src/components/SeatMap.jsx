import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function SeatMap({ seats = [], onSelectSeat, selectedSeat = null, loading = false, refreshSeats }) {
  const [hoveredSeat, setHoveredSeat] = useState(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  // Polling every 10 seconds to update seats availability
  useEffect(() => {
    if (!refreshSeats) return;
    const interval = setInterval(() => {
      refreshSeats();
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshSeats]);

  // Determine coordinate for each seat based on Category, Row and Number
  const getSeatCoords = (seat) => {
    const { category, number } = seat;
    const num = parseInt(number, 10) || 1;

    // Center of the SVG is (400, 300)
    // Pitch is at center (300, 225) to (500, 375) - size 200x150
    if (category === 'A') {
      // Category A (Gold) - Below the pitch
      const x = 310 + (num - 1) * 20;
      const y = 390;
      return { x, y };
    } else if (category === 'B') {
      // Category B (Blue) - Above the pitch
      const x = 260 + (num - 1) * 20;
      const y = 205;
      return { x, y };
    } else {
      // Category C (Green) - Sides
      if (num <= 13) {
        // Left Side
        const x = 200;
        const y = 160 + (num - 1) * 23;
        return { x, y };
      } else {
        // Right Side
        const x = 600;
        const y = 160 + (num - 14) * 23;
        return { x, y };
      }
    }
  };

  const handleSeatClick = (seat) => {
    if (seat.status !== 'available') return;
    
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    onSelectSeat(seat);
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'A': return 'var(--brand-gold)';
      case 'B': return 'var(--brand-blue)';
      case 'C': return 'var(--brand-green)';
      default: return '#FFF';
    }
  };

  const getSeatStyle = (seat) => {
    const isSelected = selectedSeat && selectedSeat._id === seat._id;
    const categoryColor = getCategoryColor(seat.category);

    if (seat.status === 'sold') {
      return {
        fill: 'var(--text-muted)',
        opacity: 0.3,
        cursor: 'not-allowed',
      };
    }

    if (seat.status === 'locked') {
      return {
        fill: 'var(--brand-red)',
        opacity: 0.4,
        cursor: 'not-allowed',
      };
    }

    if (isSelected) {
      return {
        fill: categoryColor,
        stroke: '#FFFFFF',
        strokeWidth: 2,
        cursor: 'pointer',
        filter: 'drop-shadow(0px 0px 8px ' + categoryColor + ')',
      };
    }

    return {
      fill: categoryColor,
      cursor: 'pointer',
      opacity: 0.8,
    };
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Stadium seating map SVG wrapper */}
      <div className="w-full max-w-4xl bg-bg-secondary border border-border-subtle rounded-xl p-4 md:p-6 shadow-card relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-bg-secondary/70 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-text-secondary">Mise à jour des places...</p>
            </div>
          </div>
        )}

        <div className="aspect-[4/3] w-full relative">
          <svg
            viewBox="0 0 800 600"
            className="w-full h-full select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* STADIUM BACKDROP & TRACK */}
            <rect x="50" y="50" width="700" height="500" rx="200" fill="none" stroke="var(--border-light)" strokeWidth="4" />
            <rect x="75" y="75" width="650" height="450" rx="175" fill="none" stroke="var(--border-subtle)" strokeWidth="2" strokeDasharray="5,5" />

            {/* SOCCER FIELD (CENTRAL PITCH) */}
            <g transform="translate(10, 0)">
              {/* Pitch grass */}
              <rect x="290" y="240" width="200" height="120" fill="#1b4332" stroke="#2d6a4f" strokeWidth="3" rx="4" />
              {/* Markings */}
              <line x1="390" y1="240" x2="390" y2="360" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
              <circle cx="390" cy="300" r="25" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
              <circle cx="390" cy="300" r="3" fill="rgba(255,255,255,0.4)" />
              {/* Penalty boxes */}
              <rect x="290" y="270" width="25" height="60" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
              <rect x="465" y="270" width="25" height="60" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
            </g>

            {/* GRANDSTAND LABELS */}
            <text x="390" y="160" textAnchor="middle" fill="var(--text-muted)" fontSize="12" fontWeight="bold" letterSpacing="2" className="uppercase">Tribune Nord (B)</text>
            <text x="390" y="445" textAnchor="middle" fill="var(--text-muted)" fontSize="12" fontWeight="bold" letterSpacing="2" className="uppercase">Tribune Sud (A)</text>
            <text x="140" y="305" textAnchor="middle" fill="var(--text-muted)" fontSize="12" fontWeight="bold" letterSpacing="2" className="uppercase" transform="rotate(-90 140 305)">Tribune Ouest (C)</text>
            <text x="640" y="305" textAnchor="middle" fill="var(--text-muted)" fontSize="12" fontWeight="bold" letterSpacing="2" className="uppercase" transform="rotate(90 640 305)">Tribune Est (C)</text>

            {/* SEATS RENDER */}
            {seats.map((seat) => {
              const { x, y } = getSeatCoords(seat);
              const isSelected = selectedSeat && selectedSeat._id === seat._id;
              const isAvailable = seat.status === 'available';

              return (
                <g key={seat._id}>
                  {/* Selected pulsating ring */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r="12"
                      fill="none"
                      stroke={getCategoryColor(seat.category)}
                      strokeWidth="2"
                      className="animate-ping origin-center"
                      style={{ transformOrigin: `${x}px ${y}px` }}
                    />
                  )}

                  {/* Seat Interactive circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 7 : 6}
                    style={getSeatStyle(seat)}
                    onClick={() => handleSeatClick(seat)}
                    onMouseEnter={() => isAvailable && setHoveredSeat(seat)}
                    onMouseLeave={() => setHoveredSeat(null)}
                    className="transition-all duration-150 hover:r-8"
                  />
                </g>
              );
            })}

            {/* SCREEN OVERLAY OR SCOREBOARD EFFECT */}
            <rect x="340" y="80" width="100" height="30" rx="4" fill="var(--bg-elevated)" stroke="var(--border-light)" />
            <text x="390" y="100" textAnchor="middle" fill="var(--brand-gold)" fontSize="11" fontFamily="monospace" fontWeight="bold">FIFA 2026</text>
          </svg>
        </div>

        {/* Dynamic Seat Tooltip / Hover details */}
        <div className="h-10 mt-2 flex items-center justify-center">
          {hoveredSeat ? (
            <p className="text-xs font-mono bg-bg-elevated px-4 py-1.5 rounded-full border border-border-light text-text-primary">
              {hoveredSeat.section} — Rang {hoveredSeat.row}, Siège {hoveredSeat.number} | <strong className="text-brand-gold">{hoveredSeat.price} €</strong>
            </p>
          ) : selectedSeat ? (
            <p className="text-xs font-mono bg-brand-gold/10 px-4 py-1.5 rounded-full border border-brand-gold/30 text-brand-gold">
              Sélectionné : {selectedSeat.section} — Rang {selectedSeat.row}, Siège {selectedSeat.number} ({selectedSeat.price} €)
            </p>
          ) : (
            <p className="text-xs text-text-muted italic">Survolez un siège pour voir les détails, cliquez pour le sélectionner.</p>
          )}
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6 max-w-xl w-full text-xs font-semibold px-4">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[var(--brand-gold)]"></span>
          <span className="text-text-secondary">Catégorie A (250 €)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[var(--brand-blue)]"></span>
          <span className="text-text-secondary">Catégorie B (150 €)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[var(--brand-green)]"></span>
          <span className="text-text-secondary">Catégorie C (80 €)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#FFFFFF] border border-border-light"></span>
          <span className="text-text-secondary">Sélectionné</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-brand-red opacity-50"></span>
          <span className="text-text-secondary">Réservé (TTL)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-text-muted opacity-30"></span>
          <span className="text-text-secondary">Vendu</span>
        </div>
      </div>
    </div>
  );
}
