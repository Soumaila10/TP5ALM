const express = require('express');
const { z } = require('zod');
const authController = require('../controllers/authController');
const validate = require('../middlewares/validateMiddleware');

const router = express.Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Format email invalide'),
    password: z.string().min(8, 'Le mot de passe doit faire au moins 8 caractères'),
    firstName: z.string().min(1, 'Le prénom est requis'),
    lastName: z.string().min(1, 'Le nom est requis'),
    phone: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Format email invalide'),
    password: z.string().min(1, 'Le mot de passe est requis'),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    tempToken: z.string().min(1, 'Le jeton temporaire est requis'),
    code: z.string().length(6, 'Le code OTP doit faire exactement 6 chiffres'),
  }),
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOTP);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

// OAuth Routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.get('/github', authController.githubAuth);
router.get('/github/callback', authController.githubCallback);

module.exports = router;
