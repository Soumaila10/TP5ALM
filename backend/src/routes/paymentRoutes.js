const express = require('express');
const { z } = require('zod');
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');

const router = express.Router();

const intentSchema = z.object({
  body: z.object({
    cartId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de panier invalide'),
    mock: z.boolean().optional(),
  }),
});

const confirmSchema = z.object({
  body: z.object({
    cartId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de panier invalide'),
    paymentIntentId: z.string().min(1, 'ID de payment intent requis'),
  }),
});

// La route du webhook Stripe est publique car elle est appelée de manière asynchrone par Stripe.
// La sécurité est assurée par la vérification de la signature Stripe.
router.post('/webhook', paymentController.handleWebhook);

// Routes sécurisées par JWT
router.post('/intent', authMiddleware, validate(intentSchema), paymentController.createPaymentIntent);
router.post('/confirm', authMiddleware, validate(confirmSchema), paymentController.confirmPayment);

module.exports = router;
