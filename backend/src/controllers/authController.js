const authService = require('../services/authService');
const { loadEnv } = require('../config/env');

const env = loadEnv();
const isProd = env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

async function register(req, res, next) {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    const result = await authService.register({ email, password, firstName, lastName, phone });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await authService.login({ email, password });
    
    // Store refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    
    res.json({ accessToken, user });
  } catch (err) {
    next(err);
  }
}

async function verifyOTP(req, res, next) {
  try {
    const { tempToken, code } = req.body;
    const { accessToken, refreshToken, user } = await authService.verifyOTP({ tempToken, code });
    
    // Store refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    
    res.json({ accessToken, user });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.cookies;
    const { accessToken } = await authService.refreshAccessToken(refreshToken);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(_req, res, next) {
  try {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
    });
    res.json({ message: 'Déconnecté avec succès' });
  } catch (err) {
    next(err);
  }
}

const AppError = require('../utils/AppError');

async function googleAuth(req, res, next) {
  try {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_REDIRECT_URI) {
      throw new AppError(500, 'Google OAuth n\'est pas configuré sur ce serveur', 'OAUTH_NOT_CONFIGURED');
    }
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.GOOGLE_REDIRECT_URI)}&response_type=code&scope=profile%20email`;
    res.redirect(googleAuthUrl);
  } catch (err) {
    next(err);
  }
}

async function googleCallback(req, res, next) {
  try {
    const { code, error } = req.query;
    if (error) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(error)}`);
    }
    if (!code) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=NO_CODE`);
    }

    const { accessToken, refreshToken } = await authService.handleGoogleCallback(code);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
  } catch (err) {
    req.log?.error({ err }, 'Google OAuth failed');
    res.redirect(`${env.FRONTEND_URL}/login?error=OAUTH_FAILED`);
  }
}

async function githubAuth(req, res, next) {
  try {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_REDIRECT_URI) {
      throw new AppError(500, 'GitHub OAuth n\'est pas configuré sur ce serveur', 'OAUTH_NOT_CONFIGURED');
    }
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.GITHUB_REDIRECT_URI)}&scope=user:email`;
    res.redirect(githubAuthUrl);
  } catch (err) {
    next(err);
  }
}

async function githubCallback(req, res, next) {
  try {
    const { code, error } = req.query;
    if (error) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(error)}`);
    }
    if (!code) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=NO_CODE`);
    }

    const { accessToken, refreshToken } = await authService.handleGithubCallback(code);
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
  } catch (err) {
    req.log?.error({ err }, 'GitHub OAuth failed');
    res.redirect(`${env.FRONTEND_URL}/login?error=OAUTH_FAILED`);
  }
}

module.exports = {
  register,
  login,
  verifyOTP,
  refresh,
  logout,
  googleAuth,
  googleCallback,
  githubAuth,
  githubCallback,
};
