const express = require('express');
const { z } = require('zod');
const matchController = require('../controllers/matchController');
const validate = require('../middlewares/validateMiddleware');

const router = express.Router();

const matchIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de match invalide'),
  }),
});

router.get('/', matchController.getMatches);
router.get('/:id', validate(matchIdSchema), matchController.getMatchById);
router.get('/:id/seats', validate(matchIdSchema), matchController.getMatchSeats);

module.exports = router;
