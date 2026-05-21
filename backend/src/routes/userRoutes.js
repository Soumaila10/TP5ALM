const express = require('express');
const { z } = require('zod');
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validateMiddleware');

const router = express.Router();

const profileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'Le prénom ne peut pas être vide').optional(),
    lastName: z.string().min(1, 'Le nom ne peut pas être vide').optional(),
    phone: z.string().optional(),
  }),
});

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, validate(profileSchema), userController.updateProfile);

module.exports = router;
