const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { createApp } = require('../../app');
const User = require('../../models/User');
const { loadEnv } = require('../../config/env');

jest.setTimeout(120000);

let mongod;
let app;

const env = loadEnv();
const JWT_ACCESS_SECRET = env.JWT_ACCESS_SECRET || 'default-access-secret-key-123';

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'fifa-ticketing-user-test' });
  app = createApp({ frontendUrl: 'http://localhost:5173' });
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

describe('User Routes Integration Tests', () => {
  let testUser;
  let userToken;

  beforeEach(async () => {
    testUser = await User.create({
      email: 'user@test.com',
      passwordHash: 'dummy_hash',
      firstName: 'Alice',
      lastName: 'Smith',
      role: 'user',
      isVerified: true,
    });
    userToken = generateToken(testUser);
  });

  describe('PUT /api/v1/users/profile', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app)
        .put('/api/v1/users/profile')
        .send({ firstName: 'Alice Updated' });

      expect(res.status).toBe(401);
    });

    it('successfully updates user profile details', async () => {
      const payload = {
        firstName: 'Alice Updated',
        lastName: 'Smith Updated',
        phone: '+33688888888',
      };

      const res = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Profil mis à jour avec succès');
      expect(res.body.user.firstName).toBe('Alice Updated');
      expect(res.body.user.lastName).toBe('Smith Updated');
      expect(res.body.user.phone).toBe('+33688888888');

      const dbUser = await User.findById(testUser._id);
      expect(dbUser.firstName).toBe('Alice Updated');
      expect(dbUser.phone).toBe('+33688888888');
    });

    it('returns 422 when validation schema fails (e.g. empty firstName)', async () => {
      const payload = {
        firstName: '',
      };

      const res = await request(app)
        .put('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(payload);

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/users/profile', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile');

      expect(res.status).toBe(401);
    });

    it('successfully returns the logged-in user profile details', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe(testUser._id.toString());
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.firstName).toBe(testUser.firstName);
      expect(res.body.user.lastName).toBe(testUser.lastName);
      expect(res.body.user.role).toBe(testUser.role);
    });

    it('returns 404 if user is not found in database', async () => {
      // Create a token for a user that doesn't exist
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const invalidToken = jwt.sign(
        { userId: nonExistentUserId.toString(), role: 'user' },
        JWT_ACCESS_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${invalidToken}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('USER_NOT_FOUND');
    });
  });
});
