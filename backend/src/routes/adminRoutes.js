const express = require('express');
const { z } = require('zod');
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');

const router = express.Router();

// Apply auth and admin check to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

const matchIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de match invalide'),
  }),
});

const createMatchSchema = z.object({
  body: z.object({
    teamA: z.string().min(1, 'L’équipe A est requise'),
    teamB: z.string().min(1, 'L’équipe B est requise'),
    round: z.enum(['group', 'round16', 'quarter', 'semi', 'final']),
    group: z.string().optional(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Format de date invalide',
    }),
    stadiumId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de stade invalide'),
    totalSeats: z.number().int().positive('Le nombre total de sièges doit être positif'),
  }),
});

const updateMatchSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de match invalide'),
  }),
  body: z.object({
    teamA: z.string().min(1).optional(),
    teamB: z.string().min(1).optional(),
    round: z.enum(['group', 'round16', 'quarter', 'semi', 'final']).optional(),
    group: z.string().optional(),
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Format de date invalide',
      })
      .optional(),
    stadiumId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de stade invalide').optional(),
    totalSeats: z.number().int().positive().optional(),
  }),
});

router.get('/matches', adminController.getMatches);
router.post('/matches', validate(createMatchSchema), adminController.createMatch);
router.put('/matches/:id', validate(updateMatchSchema), adminController.updateMatch);
router.delete('/matches/:id', validate(matchIdSchema), adminController.deleteMatch);
router.get('/stats', adminController.getStats);
router.get('/export', adminController.exportSales);

module.exports = router;
