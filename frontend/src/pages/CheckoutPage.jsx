import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getCart, deleteCart } from '../services/cartService';
import { createPaymentIntent, confirmPayment } from '../services/paymentService';
import { useAuthStore } from '../store/authStore';
import { logout } from '../services/authService';
import CartTimer from '../components/CartTimer';
import ThemeToggle from '../components/ThemeToggle';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Stripe Checkout Form Component
function StripeCheckoutForm({ cartId, clientSecret, onPaymentSuccess, onPaymentError, price }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const cardElement = elements.getElement(CardElement);
      const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        onPaymentError(error.message);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        const confirmResult = await confirmPayment(cartId, paymentIntent.id);
        onPaymentSuccess(confirmResult.orderId);
      } else {
        onPaymentError('Le paiement n\'a pas pu être validé.');
      }
    } catch (err) {
      onPaymentError(err.message || 'Une erreur est survenue lors de la transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-bg-tertiary p-4 rounded-lg border border-border-light">
        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Informations de carte bancaire</label>
        <div className="p-3 bg-bg-primary border border-border-subtle rounded">
          <CardElement
            options={{
              style: {
                base: {
                  color: '#FFFFFF',
                  fontFamily: 'Inter, sans-serif',
                  fontSmoothing: 'antialiased',
                  fontSize: '14px',
                  '::placeholder': {
                    color: '#5A5A72',
                  },
                },
                invalid: {
                  color: '#FF4D4D',
                  iconColor: '#FF4D4D',
                },
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-brand-gold hover:bg-brand-gold-light text-black font-bold py-3 rounded-full shadow-glow flex items-center justify-center gap-2 mt-4"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            Traitement en cours...
          </>
        ) : (
          `Payer ${price} €`
        )}
      </button>
    </form>
  );
}

// Sandbox Mock Checkout Form
function MockCheckoutForm({ cartId, clientSecret, onPaymentSuccess, onPaymentError, price }) {
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [loading, setLoading] = useState(false);

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate latency
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      // For mock intents, we parse the payment intent ID from clientSecret or generate a pi_mock_...
      const paymentIntentId = clientSecret ? clientSecret.split('_secret_')[0] : `pi_mock_${cartId}_${Date.now()}`;
      
      const confirmResult = await confirmPayment(cartId, paymentIntentId);
      onPaymentSuccess(confirmResult.orderId);
    } catch (err) {
      onPaymentError(err.message || 'Le paiement simulé a échoué.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="bg-brand-gold/10 border border-brand-gold/30 rounded-lg p-3 text-xs text-brand-gold mb-2">
        <strong>Mode Sandbox Actif</strong> : Vous pouvez utiliser n&apos;importe quelle carte bancaire fictive pour valider votre commande.
      </div>

      <div className="space-y-3 bg-bg-tertiary p-4 rounded-lg border border-border-light">
        <div>
          <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Numéro de carte</label>
          <input
            type="text"
            className="w-full bg-bg-primary border border-border-subtle rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-gold"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">Expiration</label>
            <input
              type="text"
              className="w-full bg-bg-primary border border-border-subtle rounded px-3 py-2 text-sm text-text-primary focus:outline-none"
              value={expiry}
              placeholder="MM/AA"
              onChange={(e) => setExpiry(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">CVV</label>
            <input
              type="password"
              className="w-full bg-bg-primary border border-border-subtle rounded px-3 py-2 text-sm text-text-primary focus:outline-none"
              value={cvv}
              placeholder="123"
              onChange={(e) => setCvv(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-gold hover:bg-brand-gold-light text-black font-bold py-3 rounded-full shadow-glow flex items-center justify-center gap-2 mt-4"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            Validation de la simulation...
          </>
        ) : (
          `Simuler le paiement de ${price} €`
        )}
      </button>
    </form>
  );
}

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const cartId = location.state?.cartId || queryParams.get('cartId');

  const [cart, setCart] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/checkout?cartId=${cartId}` } });
      return;
    }

    if (!cartId) {
      setError('Aucun panier trouvé.');
      setLoading(false);
      return;
    }

    async function initializeCheckout() {
      try {
        const cartData = await getCart(cartId);
        setCart(cartData);

        const paymentIntentData = await createPaymentIntent(cartId, !stripePromise);
        setClientSecret(paymentIntentData.clientSecret);
      } catch (err) {
        setError(err.message || 'Erreur lors de la récupération des détails de paiement.');
      } finally {
        setLoading(false);
      }
    }

    initializeCheckout();
  }, [cartId, isAuthenticated]);

  const handleExpiration = async () => {
    // Attempt to delete cart/release lock, then navigate away
    try {
      if (cartId) {
        await deleteCart(cartId);
      }
    } catch (err) {
      // Ignore errors during automatic deletion cleanup
    }
    navigate('/', { state: { message: 'Votre panier a expiré (limite de 10 minutes).' } });
  };

  const handlePaymentSuccess = (orderId) => {
    navigate(`/orders/${orderId}`, { state: { status: 'success' } });
  };

  const handlePaymentError = (errMsg) => {
    setPaymentError(errMsg);
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

  const handleCancelCart = async () => {
    if (window.confirm('Voulez-vous vraiment annuler votre réservation ?')) {
      try {
        await deleteCart(cartId);
        navigate('/');
      } catch (err) {
        setError(err.message || 'Impossible d\'annuler le panier.');
      }
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
            <p className="text-text-secondary text-sm">Chargement de votre panier...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-bg-primary text-text-primary">
        <header className="border-b border-border-subtle bg-bg-secondary h-16 flex items-center justify-between px-8">
          <Link to="/" className="text-brand-gold font-mono text-xl font-black uppercase">FIFA 2026</Link>
        </header>
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="bg-bg-secondary p-8 rounded-xl border border-border-light max-w-md w-full text-center">
            <h3 className="text-brand-red font-bold text-lg mb-2">Panier indisponible</h3>
            <p className="text-text-secondary text-sm mb-6">{error || 'Le panier a expiré ou n\'existe pas.'}</p>
            <Link to="/" className="bg-brand-gold text-black text-sm font-bold px-6 py-2.5 rounded-full hover:bg-brand-gold-light transition-colors">
              Retour au catalogue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const mainItem = cart.items[0];
  const totalPrice = cart.items.reduce((sum, item) => sum + item.price, 0);

  // Check if we use real Stripe Elements or Mock
  const isStripeReady = stripePromise && clientSecret && !clientSecret.startsWith('pi_mock_');
  const isSandboxMode = !isStripeReady;

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
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Order Summary */}
          <div className="flex-1 w-full space-y-6">
            <div className="bg-bg-secondary border border-border-subtle rounded-xl p-6 shadow-card">
              <h2 className="text-xl font-bold mb-4 border-b border-border-subtle pb-3">Récapitulatif de la commande</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-bold text-base text-text-primary">
                      Match de Coupe du Monde
                    </h3>
                    <p className="text-xs text-brand-gold font-semibold uppercase tracking-wider mt-0.5">
                      Catégorie {mainItem.category || 'Sélectionnée'}
                    </p>
                    <p className="text-xs text-text-secondary mt-2">
                      Section : <strong>{mainItem.seatId?.section || 'Section Standard'}</strong> | Rang : <strong>{mainItem.seatId?.row || 'B'}</strong> | Siège : <strong>{mainItem.seatId?.number || '1'}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-brand-gold font-bold text-lg">{mainItem.price} €</span>
                  </div>
                </div>

                <div className="border-t border-border-subtle pt-4 flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-brand-gold">{totalPrice} €</span>
                </div>
              </div>
            </div>

            {/* Cart timer & cancellation details */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <CartTimer expiresAt={cart.expiresAt} onExpire={handleExpiration} />
              
              <button
                onClick={handleCancelCart}
                className="text-xs text-brand-red font-semibold hover:underline bg-brand-red/10 border border-brand-red/20 px-4 py-2 rounded-full"
              >
                Annuler la réservation
              </button>
            </div>
          </div>

          {/* Payment Form Panel */}
          <div className="w-full md:w-[380px] bg-bg-secondary border border-border-subtle rounded-xl p-6 shadow-card">
            <h2 className="text-lg font-bold mb-4">Paiement Sécurisé</h2>

            {paymentError && (
              <div className="text-xs font-semibold text-brand-red bg-brand-red/10 border border-brand-red/20 px-3 py-2.5 rounded-lg mb-4 text-center">
                {paymentError}
              </div>
            )}

            {isSandboxMode && (
              <div className="mb-4 rounded-xl border border-brand-gold/30 bg-brand-gold/10 p-3 text-sm text-brand-gold">
                Mode Sandbox activé : ce paiement est simulé. Aucune carte réelle n&apos;est débitée.
                Utilisez la simulation ou configurez une clé Stripe publishable/secret valide pour le mode réel.
              </div>
            )}

            {isStripeReady ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <StripeCheckoutForm
                  cartId={cartId}
                  clientSecret={clientSecret}
                  price={totalPrice}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              </Elements>
            ) : (
              <MockCheckoutForm
                cartId={cartId}
                clientSecret={clientSecret}
                price={totalPrice}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            )}

            <div className="mt-6 text-center">
              <p className="text-[10px] text-text-muted flex items-center justify-center gap-1.5">
                <svg className="w-3 h-3 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Connexion chiffrée SSL Sandbox.
              </p>
            </div>
          </div>
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
