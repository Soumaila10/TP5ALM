const Stripe = require('stripe');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { createTicketsForOrder } = require('./ticketService');
const { getCart } = require('./cartService');
const AppError = require('../utils/AppError');
const { loadEnv } = require('../config/env');
const { logger } = require('../utils/logger');

const env = loadEnv();
const stripeKey = env.STRIPE_SECRET_KEY;
const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2023-10-16' }) : null;

/**
 * Crée un Payment Intent Stripe pour le panier spécifié.
 * Calcule automatiquement le montant total du panier en centimes.
 * @param {string} cartId - L'ID du panier.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<object>} - Le client secret et les détails de paiement.
 */
async function createPaymentIntent(cartId, userId, mock = false) {
  // Récupère et valide le panier (lève 410 si expiré)
  const cart = await getCart(cartId, userId);

  const totalAmount = cart.items.reduce((sum, item) => sum + item.price, 0);
  if (totalAmount <= 0) {
    throw new AppError(400, 'Le montant du panier doit être supérieur à zéro', 'INVALID_CART_AMOUNT');
  }

  // En mode test/dev sans clé Stripe, ou si la page frontend est en mock, on simule la réponse
  if (!stripe || mock) {
    if (!stripe) {
      logger.warn('[payment] STRIPE_SECRET_KEY missing. Using simulated payment intent.');
    } else {
      logger.warn('[payment] Mock payment requested. Using simulated payment intent.');
    }

    return {
      clientSecret: `pi_mock_${cartId}_secret_${Date.now()}`,
      amount: totalAmount,
      currency: 'eur',
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // En centimes
      currency: 'eur',
      metadata: {
        cartId: cartId.toString(),
        userId: userId.toString(),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount,
      currency: 'eur',
    };
  } catch (err) {
    logger.error({ err }, '[payment] Failed to create Stripe payment intent');
    throw new AppError(500, `Erreur lors de l'initialisation du paiement: ${err.message}`, 'PAYMENT_INTENT_ERROR');
  }
}

/**
 * Confirme le paiement et déclenche la création de commande et billets si valide.
 * Cette opération est idempotente grâce à stripePaymentIntentId.
 * @param {string} cartId - L'ID du panier.
 * @param {string} paymentIntentId - L'ID du Payment Intent.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<object>}
 */
async function confirmPayment(cartId, paymentIntentId, userId) {
  // 1. Vérifier si la commande existe déjà (idempotence)
  const existingOrder = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
  if (existingOrder) {
    logger.info({ orderId: existingOrder._id }, '[payment] Order already processed for this payment intent');
    return { orderId: existingOrder._id, status: existingOrder.status };
  }

  // 2. Récupérer et valider le panier
  const cart = await Cart.findById(cartId);
  if (!cart) {
    throw new AppError(404, 'Panier non trouvé', 'CART_NOT_FOUND');
  }
  if (cart.userId.toString() !== userId.toString()) {
    throw new AppError(403, 'Accès refusé à ce panier', 'FORBIDDEN');
  }

  // 3. Vérifier le statut du paiement sur Stripe (si configuré)
  let paymentSucceeded = false;
  if (stripe && !paymentIntentId.startsWith('pi_mock_')) {
    try {
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status === 'succeeded') {
        paymentSucceeded = true;
      } else {
        throw new AppError(400, `Le paiement n'a pas réussi. Statut: ${intent.status}`, 'PAYMENT_NOT_SUCCEEDED');
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(500, `Erreur Stripe de récupération du paiement: ${err.message}`, 'STRIPE_RETRIEVE_ERROR');
    }
  } else {
    // Mode simulation
    paymentSucceeded = true;
  }

  if (!paymentSucceeded) {
    throw new AppError(400, 'Le paiement a échoué', 'PAYMENT_FAILED');
  }

  // 4. Création de la commande
  const totalAmount = cart.items.reduce((sum, item) => sum + item.price, 0);
  const order = await Order.create({
    userId: cart.userId,
    totalAmount,
    status: 'confirmed',
    stripePaymentIntentId: paymentIntentId,
  });

  // 5. Génération des billets, des PDFs, upload et envoi d'email
  await createTicketsForOrder(order, cart);

  // 6. Finalisation du panier
  cart.status = 'confirmed';
  await cart.save();

  logger.info({ orderId: order._id, userId }, '[payment] Order and tickets successfully created');
  return { orderId: order._id, status: 'confirmed' };
}

/**
 * Gère les requêtes webhook brutes de Stripe.
 * @param {Buffer} rawBody - Le corps brut de la requête.
 * @param {string} signature - L'en-tête Stripe-Signature.
 * @returns {Promise<object>}
 */
async function handleStripeWebhook(rawBody, signature) {
  let event;

  if (stripe && webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      logger.error({ err }, '[payment-webhook] Webhook signature verification failed');
      throw new AppError(400, `Webhook Signature Verification Failed: ${err.message}`, 'WEBHOOK_SIGNATURE_INVALID');
    }
  } else {
    // Mode dev/test : on parse directement le JSON du buffer
    try {
      event = JSON.parse(rawBody.toString());
    } catch (err) {
      throw new AppError(400, 'Invalid JSON body for webhook mock', 'INVALID_WEBHOOK_BODY');
    }
  }

  logger.info({ eventType: event.type }, '[payment-webhook] Stripe webhook event received');

  // Gérer charge.succeeded ou payment_intent.succeeded
  if (event.type === 'charge.succeeded' || event.type === 'payment_intent.succeeded') {
    const object = event.data.object;
    
    // Si c'est charge.succeeded, Stripe place l'id du payment intent dans payment_intent
    const paymentIntentId = object.payment_intent || object.id;
    const metadata = object.metadata || {};
    const cartId = metadata.cartId;
    const userId = metadata.userId;

    if (cartId && userId) {
      try {
        const cart = await Cart.findById(cartId);
        if (cart && cart.status === 'active') {
          // On traite le paiement s'il n'a pas déjà été fait par l'API directe
          const existingOrder = await Order.findOne({ stripePaymentIntentId: paymentIntentId });
          if (!existingOrder) {
            const totalAmount = cart.items.reduce((sum, item) => sum + item.price, 0);
            const order = await Order.create({
              userId: cart.userId,
              totalAmount,
              status: 'confirmed',
              stripePaymentIntentId: paymentIntentId,
            });
            await createTicketsForOrder(order, cart);
            cart.status = 'confirmed';
            await cart.save();
            logger.info({ orderId: order._id }, '[payment-webhook] Order fulfilled successfully via Webhook');
          }
        }
      } catch (err) {
        logger.error({ err, paymentIntentId, cartId }, '[payment-webhook] Error processing webhook order fulfillment');
        // On ne lève pas une erreur de l'API webhook pour Stripe afin d'éviter les retries infinis si c'est un bug applicatif
      }
    }
  }

  return { received: true };
}

module.exports = {
  createPaymentIntent,
  confirmPayment,
  handleStripeWebhook,
};
