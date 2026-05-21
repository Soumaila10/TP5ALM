const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { createApp } = require('../../app');
const User = require('../../models/User');
const Match = require('../../models/Match');
const Stadium = require('../../models/Stadium');
const Order = require('../../models/Order');
const Ticket = require('../../models/Ticket');
const Seat = require('../../models/Seat');
const { loadEnv } = require('../../config/env');

jest.setTimeout(120000);

let mongod;
let app;

const env = loadEnv();
const JWT_ACCESS_SECRET = env.JWT_ACCESS_SECRET || 'default-access-secret-key-123';

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'fifa-ticketing-admin-test' });
  app = createApp({ frontendUrl: 'http://localhost:5173' });
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Match.deleteMany({});
  await Stadium.deleteMany({});
  await Order.deleteMany({});
  await Ticket.deleteMany({});
  await Seat.deleteMany({});
});

function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

describe('Admin Routes Integration Tests', () => {
  let adminUser;
  let normalUser;
  let adminToken;
  let userToken;
  let sampleStadium;

  beforeEach(async () => {
    // Create users
    adminUser = await User.create({
      email: 'admin@test.com',
      passwordHash: 'dummy_hash',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isVerified: true,
    });
    adminToken = generateToken(adminUser);

    normalUser = await User.create({
      email: 'user@test.com',
      passwordHash: 'dummy_hash',
      firstName: 'Normal',
      lastName: 'User',
      role: 'user',
      isVerified: true,
    });
    userToken = generateToken(normalUser);

    // Create a stadium
    sampleStadium = await Stadium.create({
      name: 'MetLife Stadium',
      city: 'East Rutherford',
      country: 'USA',
      capacity: 80000,
    });
  });

  describe('Authorization Checks', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/api/v1/admin/matches');
      expect(res.status).toBe(401);
    });

    it('returns 403 when user is not an admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/matches')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('returns 200 when user is an admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/matches')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe('Match CRUD operations', () => {
    let matchId;

    beforeEach(async () => {
      const match = await Match.create({
        teamA: 'France',
        teamB: 'Brazil',
        round: 'group',
        date: new Date(Date.now() + 86400000).toISOString(),
        stadiumId: sampleStadium._id,
        totalSeats: 50,
        availableSeats: 50,
        isActive: true,
      });
      matchId = match._id.toString();
    });

    it('GET /admin/matches retrieves matches list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/matches')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].teamA).toBe('France');
    });

    it('POST /admin/matches creates a new match', async () => {
      const payload = {
        teamA: 'Argentina',
        teamB: 'Germany',
        round: 'final',
        date: new Date(Date.now() + 172800000).toISOString(),
        stadiumId: sampleStadium._id.toString(),
        totalSeats: 100,
      };

      const res = await request(app)
        .post('/api/v1/admin/matches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.teamA).toBe('Argentina');
      expect(res.body.availableSeats).toBe(100);

      const dbMatch = await Match.findOne({ teamA: 'Argentina' });
      expect(dbMatch).toBeTruthy();
    });

    it('PUT /admin/matches/:id updates existing match details', async () => {
      const payload = {
        teamA: 'France Updated',
        teamB: 'Brazil',
        round: 'quarter',
        date: new Date(Date.now() + 86400000).toISOString(),
        stadiumId: sampleStadium._id.toString(),
        totalSeats: 60,
      };

      const res = await request(app)
        .put(`/api/v1/admin/matches/${matchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.teamA).toBe('France Updated');
      expect(res.body.round).toBe('quarter');

      const dbMatch = await Match.findById(matchId);
      expect(dbMatch.teamA).toBe('France Updated');
    });

    it('DELETE /admin/matches/:id deactivates the match', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/matches/${matchId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.match.isActive).toBe(false);

      const dbMatch = await Match.findById(matchId);
      expect(dbMatch.isActive).toBe(false);
    });
  });

  describe('Statistics and Export', () => {
    it('GET /admin/stats calculates correctly', async () => {
      // Seed a simulated order & tickets
      const match = await Match.create({
        teamA: 'Spain',
        teamB: 'Italy',
        round: 'group',
        date: new Date().toISOString(),
        stadiumId: sampleStadium._id,
        totalSeats: 50,
        availableSeats: 48,
      });

      const order = await Order.create({
        userId: normalUser._id,
        totalAmount: 120,
        status: 'confirmed',
      });

      const seat1 = await Seat.create({
        stadiumId: sampleStadium._id,
        section: 'A',
        row: '1',
        number: '1',
        category: 'A',
        price: 60,
        status: 'sold',
      });

      const seat2 = await Seat.create({
        stadiumId: sampleStadium._id,
        section: 'A',
        row: '1',
        number: '2',
        category: 'A',
        price: 60,
        status: 'sold',
      });

      await Ticket.create({
        orderId: order._id,
        matchId: match._id,
        seatId: seat1._id,
        userId: normalUser._id,
        qrCode: 'ticket-1',
        status: 'valid',
      });

      await Ticket.create({
        orderId: order._id,
        matchId: match._id,
        seatId: seat2._id,
        userId: normalUser._id,
        qrCode: 'ticket-2',
        status: 'valid',
      });

      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalRevenue).toBe(120);
      expect(res.body.ticketsSold).toBe(2);
      expect(res.body.statsPerMatch.length).toBe(1);
      expect(res.body.statsPerMatch[0].ticketsSold).toBe(2);
      expect(res.body.statsPerMatch[0].revenue).toBe(120);
    });

    it('GET /admin/export generates CSV string successfully', async () => {
      // Seed a match, order, and tickets
      const match = await Match.create({
        teamA: 'Spain',
        teamB: 'Italy',
        round: 'group',
        date: new Date().toISOString(),
        stadiumId: sampleStadium._id,
        totalSeats: 50,
        availableSeats: 49,
      });

      const order = await Order.create({
        userId: normalUser._id,
        totalAmount: 80,
        status: 'confirmed',
      });

      const seat = await Seat.create({
        stadiumId: sampleStadium._id,
        section: 'B',
        row: '5',
        number: '12',
        category: 'B',
        price: 80,
        status: 'sold',
      });

      await Ticket.create({
        orderId: order._id,
        matchId: match._id,
        seatId: seat._id,
        userId: normalUser._id,
        qrCode: 'ticket-3',
        status: 'valid',
      });

      const res = await request(app)
        .get('/api/v1/admin/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Ticket ID,Order ID,User Email,User Name,Match');
      expect(res.text).toContain('user@test.com');
      expect(res.text).toContain('Spain vs Italy');
    });
  });
});
