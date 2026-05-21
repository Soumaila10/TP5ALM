const paymentService = require('../services/paymentService');

/**
 * Crée un Payment Intent Stripe.
 */
async function createPaymentIntent(req, res, next) {
  try {
    const userId = req.user.userId;
    const { cartId, mock } = req.body;
    
    const result = await paymentService.createPaymentIntent(cartId, userId, Boolean(mock));
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Confirme le paiement et crée la commande.
 */
async function confirmPayment(req, res, next) {
  try {
    const userId = req.user.userId;
    const { cartId, paymentIntentId } = req.body;
    
    const result = await paymentService.confirmPayment(cartId, paymentIntentId, userId);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Gère le webhook Stripe.
 */
async function handleWebhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];
    // Utilise req.rawBody s'il est dispo, sinon repasse sur req.body (pour faciliter les tests mockés)
    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));
    
    const result = await paymentService.handleStripeWebhook(rawBody, signature);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPaymentIntent,
  confirmPayment,
  handleWebhook,
};
