const express = require('express');
const { z } = require('zod');
const cartController = require('../controllers/cartController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');

const router = express.Router();

const createCartSchema = z.object({
  body: z.object({
    matchId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de match invalide'),
    seatId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de siège invalide'),
  }),
});

const cartIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de panier invalide'),
  }),
});

// Toutes les routes de panier nécessitent une authentification
router.use(authMiddleware);

router.post('/', validate(createCartSchema), cartController.createCart);
router.get('/:id', validate(cartIdSchema), cartController.getCart);
router.delete('/:id', validate(cartIdSchema), cartController.deleteCart);

module.exports = router;
