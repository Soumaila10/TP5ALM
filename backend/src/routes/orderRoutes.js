const express = require('express');
const { z } = require('zod');
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');

const router = express.Router();

const orderIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de commande invalide'),
  }),
});

// Toutes les routes de commande nécessitent une authentification
router.use(authMiddleware);

router.get('/', orderController.getOrders);
router.get('/:id', validate(orderIdSchema), orderController.getOrderById);

module.exports = router;
