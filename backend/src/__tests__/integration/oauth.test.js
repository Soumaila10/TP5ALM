// Set mock environment variables before importing the app
process.env.GOOGLE_CLIENT_ID = 'mock-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'mock-google-client-secret';
process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/api/v1/auth/google/callback';

process.env.GITHUB_CLIENT_ID = 'mock-github-client-id';
process.env.GITHUB_CLIENT_SECRET = 'mock-github-client-secret';
process.env.GITHUB_REDIRECT_URI = 'http://localhost:3000/api/v1/auth/github/callback';

const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { createApp } = require('../../app');
const User = require('../../models/User');

jest.setTimeout(120000);

let mongod;
let app;
let fetchMock;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'fifa-ticketing-oauth-test' });
  app = createApp({ frontendUrl: 'http://localhost:5173' });
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

beforeEach(() => {
  fetchMock = jest.spyOn(global, 'fetch');
});

afterEach(async () => {
  fetchMock.mockRestore();
  await User.deleteMany({});
});

describe('OAuth Routes Integration Tests', () => {
  
  describe('GET /api/v1/auth/google', () => {
    it('redirects to Google authorization page', async () => {
      const res = await request(app)
        .get('/api/v1/auth/google');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(res.headers.location).toContain('client_id=mock-google-client-id');
    });
  });

  describe('GET /api/v1/auth/github', () => {
    it('redirects to GitHub authorization page', async () => {
      const res = await request(app)
        .get('/api/v1/auth/github');
      
      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('https://github.com/login/oauth/authorize');
      expect(res.headers.location).toContain('client_id=mock-github-client-id');
    });
  });

  describe('GET /api/v1/auth/google/callback', () => {
    it('handles redirect error when access is denied', async () => {
      const res = await request(app)
        .get('/api/v1/auth/google/callback?error=access_denied');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('http://localhost:5173/login?error=access_denied');
    });

    it('redirects with error if authorization code is missing', async () => {
      const res = await request(app)
        .get('/api/v1/auth/google/callback');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('http://localhost:5173/login?error=NO_CODE');
    });

    it('successfully processes callback, creates user, and redirects with accessToken', async () => {
      // Mock Google Token response
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'mock-google-access-token' }),
        })
      );

      // Mock Google User Info response
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'google-id-12345',
            email: 'googleuser@gmail.com',
            given_name: 'Google',
            family_name: 'User',
          }),
        })
      );

      const res = await request(app)
        .get('/api/v1/auth/google/callback?code=valid-google-code');

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('http://localhost:5173/auth/callback?token=');
      
      // Verify refresh token cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.includes('refreshToken='))).toBe(true);

      // Check DB entry
      const user = await User.findOne({ email: 'googleuser@gmail.com' });
      expect(user).toBeTruthy();
      expect(user.googleId).toBe('google-id-12345');
      expect(user.firstName).toBe('Google');
      expect(user.lastName).toBe('User');
      expect(user.isVerified).toBe(true);
    });

    it('links Google ID if email already exists', async () => {
      // Create user first
      await User.create({
        email: 'googleuser@gmail.com',
        passwordHash: 'dummy_hash',
        firstName: 'Existing',
        lastName: 'User',
        isVerified: false,
      });

      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'mock-google-access-token' }),
        })
      );

      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'google-id-12345',
            email: 'googleuser@gmail.com',
            given_name: 'Google',
            family_name: 'User',
          }),
        })
      );

      const res = await request(app)
        .get('/api/v1/auth/google/callback?code=valid-google-code');

      expect(res.status).toBe(302);
      
      const user = await User.findOne({ email: 'googleuser@gmail.com' });
      expect(user).toBeTruthy();
      expect(user.googleId).toBe('google-id-12345');
      expect(user.firstName).toBe('Existing'); // profile not overwritten
    });
  });

  describe('GET /api/v1/auth/github/callback', () => {
    it('handles redirect error from GitHub', async () => {
      const res = await request(app)
        .get('/api/v1/auth/github/callback?error=redirect_uri_mismatch&error_description=Mismatch');

      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('http://localhost:5173/login?error=redirect_uri_mismatch');
    });

    it('successfully processes callback, creates user, and redirects with accessToken', async () => {
      // Mock GitHub Token response
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'mock-github-access-token' }),
        })
      );

      // Mock GitHub User profile response
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 98765,
            login: 'gituser',
            name: 'GitHub User',
            email: 'gituser@github.com',
          }),
        })
      );

      const res = await request(app)
        .get('/api/v1/auth/github/callback?code=valid-github-code');

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('http://localhost:5173/auth/callback?token=');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();

      const user = await User.findOne({ email: 'gituser@github.com' });
      expect(user).toBeTruthy();
      expect(user.githubId).toBe('98765');
      expect(user.firstName).toBe('GitHub');
      expect(user.lastName).toBe('User');
    });

    it('requests email fallback if not present in primary profile payload', async () => {
      // Mock GitHub Token response
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ access_token: 'mock-github-access-token' }),
        })
      );

      // Mock GitHub User profile response without public email
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 98765,
            login: 'gituser',
            name: 'GitHub User',
            email: null,
          }),
        })
      );

      // Mock GitHub User emails list endpoint
      fetchMock.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { email: 'gituser-private@github.com', primary: true, verified: true }
          ]),
        })
      );

      const res = await request(app)
        .get('/api/v1/auth/github/callback?code=valid-github-code');

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('http://localhost:5173/auth/callback?token=');

      const user = await User.findOne({ email: 'gituser-private@github.com' });
      expect(user).toBeTruthy();
      expect(user.githubId).toBe('98765');
    });
  });
});
