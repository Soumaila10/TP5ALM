const express = require('express');
const { z } = require('zod');
const ticketController = require('../controllers/ticketController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');

const router = express.Router();

const ticketIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de ticket invalide'),
  }),
});

// Toutes les routes de ticket nécessitent une authentification
router.use(authMiddleware);

router.get('/:id/pdf', validate(ticketIdSchema), ticketController.getTicketPdf);
router.get('/:id/qr', validate(ticketIdSchema), ticketController.getTicketQr);

module.exports = router;
