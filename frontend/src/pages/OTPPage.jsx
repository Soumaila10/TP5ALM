import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { verifyOTP } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import ThemeToggle from '../components/ThemeToggle';

export default function OTPPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const inputsRef = useRef([]);

  const setAuth = useAuthStore((state) => state.setAuth);

  const state = location.state || {};
  const { tempToken, email } = state;

  // Redirect to login if tempToken or email is missing
  useEffect(() => {
    if (!tempToken || !email) {
      navigate('/login');
    }
  }, [tempToken, email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setError('Le code de validation temporaire a expiré. Veuillez vous reconnecter.');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Focus the first input on load
  useEffect(() => {
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index, val) => {
    if (isNaN(Number(val))) return; // numbers only

    const newCode = [...code];
    // Keep only the last character entered
    newCode[index] = val.substring(val.length - 1);
    setCode(newCode);

    // Auto-focus next input
    if (val && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return; // must be exactly 6 digits

    const digits = pastedData.split('');
    setCode(digits);
    // Focus the last input
    inputsRef.current[5].focus();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Veuillez entrer un code à 6 chiffres');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await verifyOTP({ tempToken, code: fullCode });
      setAuth(response.user, response.accessToken);
      // Redirect to catalogue
      navigate('/');
    } catch (err) {
      setError(err.message || 'Code OTP invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  // Trigger verify automatically when 6th digit is entered
  useEffect(() => {
    if (code.every((digit) => digit !== '')) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 max-w-7xl w-full mx-auto">
        <Link to="/" className="text-brand-gold font-mono text-lg font-bold tracking-wider uppercase">
          FIFA TICKETING 2026
        </Link>
        <ThemeToggle />
      </header>

      {/* Main card */}
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6">
        <div className="w-full max-w-md bg-bg-secondary p-8 rounded-xl border border-border-subtle shadow-card transition-all duration-300">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tight text-text-primary mb-2">Vérification 2FA</h2>
            <p className="text-text-secondary text-sm">
              Saisissez le code de sécurité à 6 chiffres envoyé à <strong className="text-text-primary">{email}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-brand-red/10 border border-brand-red/20 rounded-md text-brand-red text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  maxLength={2}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={timeLeft <= 0}
                  className="w-12 h-14 text-center bg-bg-tertiary border border-border-light rounded-lg text-2xl font-bold text-brand-gold focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all duration-150 shadow-sm"
                />
              ))}
            </div>

            <div className="text-center">
              {timeLeft > 0 ? (
                <p className="text-text-secondary text-sm">
                  Le code expire dans :{' '}
                  <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-brand-red animate-pulse-slow' : 'text-brand-gold'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </p>
              ) : (
                <Link to="/login" className="text-brand-gold hover:underline text-sm font-medium">
                  Renvoyer un nouveau code
                </Link>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || timeLeft <= 0 || code.some((digit) => digit === '')}
              className="w-full bg-brand-gold text-black rounded-full font-bold py-3 hover:bg-brand-gold-light focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-bg-primary transition-all duration-150 shadow-glow flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                'Vérifier le code'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-text-secondary font-medium">
            <Link to="/login" className="text-brand-gold hover:underline">
              Retour à la page de connexion
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
