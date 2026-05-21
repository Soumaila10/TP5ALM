const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('./emailService');
const AppError = require('../utils/AppError');
const { loadEnv } = require('../config/env');

const env = loadEnv();
const JWT_ACCESS_SECRET = env.JWT_ACCESS_SECRET || 'default-access-secret-key-123';
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET || 'default-refresh-secret-key-456';

async function register({ email, password, firstName, lastName, phone }) {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError(409, 'Email déjà utilisé', 'EMAIL_ALREADY_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = new User({
    email,
    passwordHash,
    firstName,
    lastName,
    phone,
    role: 'user',
    isVerified: false,
  });

  await user.save();

  // Async email sending in background (don't block the HTTP response)
  emailService.sendWelcomeEmail(user.email, user.firstName).catch(() => {});

  return { message: 'Compte créé avec succès' };
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    throw new AppError(401, 'Identifiants invalides', 'INVALID_CREDENTIALS');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError(401, 'Identifiants invalides', 'INVALID_CREDENTIALS');
  }

  // Generate 6-digit OTP code
  const otpCode = crypto.randomInt(100000, 999999).toString();
  const otpExpiresAt = new Date(Date.now() + 600000); // 10 minutes from now

  user.otpCode = otpCode;
  user.otpExpiresAt = otpExpiresAt;
  await user.save();

  // Send OTP via email in background
  emailService.sendOTPEmail(user.email, otpCode).catch(() => {});

  // Generate a short-lived tempToken (valid 5 minutes) to identify user in next step
  const tempToken = jwt.sign(
    { userId: user._id, type: 'temp_otp' },
    JWT_ACCESS_SECRET,
    { expiresIn: '5m' }
  );

  return { tempToken };
}

async function verifyOTP({ tempToken, code }) {
  let decoded;
  try {
    decoded = jwt.verify(tempToken, JWT_ACCESS_SECRET);
  } catch (err) {
    throw new AppError(401, 'Token de connexion expiré ou invalide', 'INVALID_TEMP_TOKEN');
  }

  if (decoded.type !== 'temp_otp') {
    throw new AppError(401, 'Type de token invalide', 'INVALID_TOKEN_TYPE');
  }

  const user = await User.findById(decoded.userId).select('+otpCode +otpExpiresAt');
  if (!user) {
    throw new AppError(404, 'Utilisateur non trouvé', 'USER_NOT_FOUND');
  }

  if (!user.otpCode || !user.otpExpiresAt) {
    throw new AppError(401, 'Aucun code OTP généré pour ce compte', 'NO_OTP_CODE');
  }

  if (user.otpExpiresAt < new Date()) {
    throw new AppError(401, 'Code OTP expiré', 'OTP_EXPIRED');
  }

  if (user.otpCode !== code) {
    throw new AppError(401, 'Code OTP invalide', 'INVALID_OTP');
  }

  // User is verified upon successful login
  user.isVerified = true;
  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  // Generate accessToken (15 minutes) and refreshToken (7 days)
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken, user };
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new AppError(401, 'Token de rafraîchissement manquant', 'MISSING_REFRESH_TOKEN');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
  } catch (err) {
    throw new AppError(401, 'Token de rafraîchissement expiré ou invalide', 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new AppError(404, 'Utilisateur non trouvé', 'USER_NOT_FOUND');
  }

  const accessToken = jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  return { accessToken };
}

async function handleGoogleCallback(code) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
    throw new AppError(500, 'Configuration Google OAuth manquante', 'OAUTH_CONFIG_MISSING');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error_description || 'Impossible d\'échanger le code Google OAuth');
  }

  const { access_token } = await response.json();

  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!userInfoRes.ok) {
    throw new Error('Impossible de récupérer les informations de l\'utilisateur Google');
  }

  const profile = await userInfoRes.json();
  const { id, email, given_name, family_name } = profile;

  if (!email) {
    throw new Error('L\'adresse email est requise mais n\'a pas été renvoyée par Google');
  }

  let user = await User.findOne({
    $or: [{ googleId: id }, { email: email.toLowerCase() }],
  });

  if (user) {
    if (!user.googleId) {
      user.googleId = id;
      await user.save();
    }
  } else {
    user = new User({
      email: email.toLowerCase(),
      googleId: id,
      firstName: given_name || 'Google',
      lastName: family_name || 'User',
      isVerified: true,
    });
    await user.save();
  }

  const accessToken = jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken, user };
}

async function handleGithubCallback(code) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.GITHUB_REDIRECT_URI) {
    throw new AppError(500, 'Configuration GitHub OAuth manquante', 'OAUTH_CONFIG_MISSING');
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error('Impossible d\'échanger le code GitHub OAuth');
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  const access_token = data.access_token;

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${access_token}`,
      'User-Agent': 'fifa-ticketing-backend',
    },
  });

  if (!userRes.ok) {
    throw new Error('Impossible de récupérer le profil GitHub');
  }

  const profile = await userRes.json();
  const { id, login, name } = profile;
  let email = profile.email;

  if (!email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `token ${access_token}`,
        'User-Agent': 'fifa-ticketing-backend',
      },
    });

    if (emailsRes.ok) {
      const emails = await emailsRes.json();
      const primaryEmail = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) || emails[0];
      if (primaryEmail) {
        email = primaryEmail.email;
      }
    }
  }

  if (!email) {
    throw new Error('L\'adresse email est requise mais n\'a pas été renvoyée par GitHub');
  }

  let firstName = 'GitHub';
  let lastName = 'User';
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length > 0) firstName = parts[0];
    if (parts.length > 1) lastName = parts.slice(1).join(' ');
  } else if (login) {
    firstName = login;
  }

  let user = await User.findOne({
    $or: [{ githubId: id.toString() }, { email: email.toLowerCase() }],
  });

  if (user) {
    if (!user.githubId) {
      user.githubId = id.toString();
      await user.save();
    }
  } else {
    user = new User({
      email: email.toLowerCase(),
      githubId: id.toString(),
      firstName,
      lastName,
      isVerified: true,
    });
    await user.save();
  }

  const accessToken = jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken, user };
}

module.exports = {
  register,
  login,
  verifyOTP,
  refreshAccessToken,
  handleGoogleCallback,
  handleGithubCallback,
};
