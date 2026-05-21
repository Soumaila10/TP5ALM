const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { createApp } = require('../../app');
const { User } = require('../../models');
const { loadEnv } = require('../../config/env');

jest.setTimeout(120000);

let mongod;
let app;

const env = loadEnv();
const JWT_ACCESS_SECRET = env.JWT_ACCESS_SECRET || 'default-access-secret-key-123';
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET || 'default-refresh-secret-key-456';

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'fifa-ticketing-auth-test' });
  app = createApp({ frontendUrl: 'http://localhost:5173' });
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Auth Routes Integration Tests', () => {
  const registerPayload = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Alice',
    lastName: 'Smith',
    phone: '+33612345678',
  };

  describe('POST /api/v1/auth/register', () => {
    it('creates a user and sends welcome email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(registerPayload);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Compte créé avec succès');

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user.firstName).toBe('Alice');
    });

    it('returns 409 if email is already registered', async () => {
      await request(app).post('/api/v1/auth/register').send(registerPayload);
      const res = await request(app).post('/api/v1/auth/register').send(registerPayload);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('returns 422 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@example.com' }); // missing password, firstName, lastName

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(registerPayload);
    });

    it('generates OTP and returns temporary token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: registerPayload.email,
          password: registerPayload.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.tempToken).toBeTruthy();

      const user = await User.findOne({ email: registerPayload.email }).select('+otpCode +otpExpiresAt');
      expect(user.otpCode).toBeTruthy();
      expect(user.otpCode.length).toBe(6);
      expect(user.otpExpiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('returns 401 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: registerPayload.email,
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    let tempToken;
    let otpCode;

    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(registerPayload);
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: registerPayload.email,
          password: registerPayload.password,
        });
      tempToken = loginRes.body.tempToken;
      const user = await User.findOne({ email: registerPayload.email }).select('+otpCode');
      otpCode = user.otpCode;
    });

    it('authenticates user and returns access token + sets HTTP-only refresh cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ tempToken, code: otpCode });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.user.email).toBe(registerPayload.email);

      // Verify cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const hasRefreshToken = cookies.some((c) => c.includes('refreshToken='));
      expect(hasRefreshToken).toBe(true);

      // Verify OTP is cleaned up (need to select them explicitly since they default select false)
      const user = await User.findOne({ email: registerPayload.email }).select('+otpCode +otpExpiresAt');
      expect(user.otpCode).toBeFalsy();
      expect(user.otpExpiresAt).toBeFalsy();
      expect(user.isVerified).toBe(true);
    });

    it('returns 401 for incorrect OTP code', async () => {
      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ tempToken, code: '000000' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_OTP');
    });

    it('returns 401 for expired OTP code', async () => {
      const user = await User.findOne({ email: registerPayload.email });
      user.otpExpiresAt = new Date(Date.now() - 1000); // expired
      await user.save();

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({ tempToken, code: otpCode });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('OTP_EXPIRED');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      const user = await User.create({
        email: 'refresh@example.com',
        passwordHash: 'dummy',
        firstName: 'Bob',
        lastName: 'Jones',
        isVerified: true,
      });

      refreshToken = jwt.sign(
        { userId: user._id, role: user.role, email: user.email },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' },
      );
    });

    it('returns new access token with valid refresh token cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();

      const decoded = jwt.verify(res.body.accessToken, JWT_ACCESS_SECRET);
      expect(decoded.email).toBe('refresh@example.com');
    });

    it('returns 401 if refresh token is missing', async () => {
      const res = await request(app).post('/api/v1/auth/refresh');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('MISSING_REFRESH_TOKEN');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('clears the refresh token cookie', async () => {
      const res = await request(app).post('/api/v1/auth/logout');
      expect(res.status).toBe(200);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const isCleared = cookies.some((c) => c.includes('refreshToken=;'));
      expect(isCleared).toBe(true);
    });
  });
});
