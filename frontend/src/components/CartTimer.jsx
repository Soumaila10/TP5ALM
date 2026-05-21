import { useState, useEffect } from 'react';

export default function CartTimer({ expiresAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const difference = new Date(expiresAt) - new Date();
      return difference > 0 ? Math.floor(difference / 1000) : 0;
    };

    // Initialize timer
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    if (initialTime <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerClasses = () => {
    if (timeLeft <= 60) {
      return 'text-brand-red animate-pulse font-black scale-105';
    }
    if (timeLeft <= 120) {
      return 'text-brand-red font-bold';
    }
    return 'text-brand-gold font-medium';
  };

  return (
    <div className="flex items-center gap-2 bg-bg-tertiary border border-border-light px-4 py-2 rounded-full shadow-card">
      <svg className={`w-4 h-4 ${timeLeft <= 120 ? 'text-brand-red animate-spin' : 'text-text-secondary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-xs text-text-secondary font-mono uppercase tracking-wider">Temps restant :</span>
      <span className={`text-sm font-mono transition-all duration-300 ${getTimerClasses()}`}>
        {formatTime(timeLeft)}
      </span>
    </div>
  );
}
