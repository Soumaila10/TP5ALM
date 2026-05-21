const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { createApp } = require('../../app');
const { Match, Stadium, Seat, Cart, User } = require('../../models');
const { setRedisClient } = require('../../config/redis');
const { loadEnv } = require('../../config/env');

jest.setTimeout(120000);

let mongod;
let app;
let user;
let otherUser;
let userToken;
let otherUserToken;

const env = loadEnv();
const JWT_ACCESS_SECRET = env.JWT_ACCESS_SECRET || 'default-access-secret-key-123';

// Mock Redis client
const mockRedisGet = jest.fn();
const mockRedisSet = jest.fn();
const mockRedisDel = jest.fn();
const mockRedisClient = {
  get: mockRedisGet,
  set: mockRedisSet,
  del: mockRedisDel,
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'fifa-ticketing-cart-test' });
  
  setRedisClient(mockRedisClient);

  app = createApp({ frontendUrl: 'http://localhost:5173' });

  // Create test users
  user = await User.create({
    email: 'alice@example.com',
    passwordHash: 'hashedpassword',
    firstName: 'Alice',
    lastName: 'Smith',
    isVerified: true,
  });

  otherUser = await User.create({
    email: 'bob@example.com',
    passwordHash: 'hashedpassword',
    firstName: 'Bob',
    lastName: 'Jones',
    isVerified: true,
  });

  userToken = jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  otherUserToken = jwt.sign(
    { userId: otherUser._id, role: otherUser.role, email: otherUser.email },
    JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  await Match.deleteMany({});
  await Stadium.deleteMany({});
  await Seat.deleteMany({});
  await Cart.deleteMany({});
  mockRedisGet.mockReset();
  mockRedisSet.mockReset();
  mockRedisDel.mockReset();
});

describe('Cart Routes Integration Tests', () => {
  let stadium;
  let match;
  let seat;

  beforeEach(async () => {
    stadium = await Stadium.create({
      name: 'Hard Rock Stadium',
      city: 'Miami',
      country: 'USA',
      capacity: 65000,
    });

    match = await Match.create({
      teamA: 'Argentine',
      teamB: 'France',
      round: 'quarter',
      group: 'B',
      date: new Date('2026-07-04T18:00:00Z'),
      stadiumId: stadium._id,
      totalSeats: 100,
      availableSeats: 99,
      isActive: true,
    });

    seat = await Seat.create({
      stadiumId: stadium._id,
      section: 'Gold A',
      row: '5',
      number: 12,
      category: 'A',
      price: 250,
      status: 'available',
    });
  });

  describe('POST /api/v1/cart', () => {
    it('returns 401 if access token is missing', async () => {
      const res = await request(app)
        .post('/api/v1/cart')
        .send({ matchId: match._id, seatId: seat._id });
      expect(res.status).toBe(401);
    });

    it('creates a cart successfully and locks seat in Redis', async () => {
      mockRedisSet.mockResolvedValue('OK'); // Redis successfully locks

      const res = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ matchId: match._id.toString(), seatId: seat._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.cartId).toBeDefined();
      expect(res.body.expiresAt).toBeDefined();
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].seatId).toBe(seat._id.toString());

      // Verify lock in Redis
      expect(mockRedisSet).toHaveBeenCalledWith(`seat:${seat._id}`, user._id.toString(), 'NX', 'EX', 600);

      // Verify cart created in MongoDB
      const cartInDb = await Cart.findById(res.body.cartId);
      expect(cartInDb).toBeTruthy();
      expect(cartInDb.status).toBe('active');
    });

    it('cleans up existing active carts and locks for the user', async () => {
      mockRedisSet.mockResolvedValue('OK');
      mockRedisDel.mockResolvedValue(1);

      // 1. Create first cart
      const firstCartRes = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ matchId: match._id.toString(), seatId: seat._id.toString() });
      
      const firstCartId = firstCartRes.body.cartId;

      // Create a second seat
      const secondSeat = await Seat.create({
        stadiumId: stadium._id,
        section: 'Gold A',
        row: '5',
        number: 13,
        category: 'A',
        price: 250,
        status: 'available',
      });

      // 2. Create second cart
      const secondCartRes = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ matchId: match._id.toString(), seatId: secondSeat._id.toString() });

      expect(secondCartRes.status).toBe(201);

      // Verify first cart is expired
      const firstCart = await Cart.findById(firstCartId);
      expect(firstCart.status).toBe('expired');

      // Verify unlock called for first seat
      expect(mockRedisDel).toHaveBeenCalledWith(`seat:${seat._id}`);
    });

    it('returns 409 if seat is already locked in Redis', async () => {
      mockRedisSet.mockResolvedValue(null); // Redis lock fails

      const res = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ matchId: match._id.toString(), seatId: seat._id.toString() });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('SEAT_ALREADY_LOCKED');
    });

    it('returns 409 if seat is already sold in DB', async () => {
      const soldSeat = await Seat.create({
        stadiumId: stadium._id,
        section: 'Gold A',
        row: '5',
        number: 14,
        category: 'A',
        price: 250,
        status: 'sold',
      });

      const res = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ matchId: match._id.toString(), seatId: soldSeat._id.toString() });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('SEAT_ALREADY_SOLD');
    });
  });

  describe('GET /api/v1/cart/:id', () => {
    let activeCart;

    beforeEach(async () => {
      activeCart = await Cart.create({
        userId: user._id,
        expiresAt: new Date(Date.now() + 600000),
        status: 'active',
        items: [{ matchId: match._id, seatId: seat._id, price: seat.price }],
      });
    });

    it('returns cart data for the owner', async () => {
      const res = await request(app)
        .get(`/api/v1/cart/${activeCart._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(activeCart._id.toString());
      expect(res.body.status).toBe('active');
    });

    it('returns 403 for access by another user', async () => {
      const res = await request(app)
        .get(`/api/v1/cart/${activeCart._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });

    it('returns 410 and releases locks if cart is expired', async () => {
      mockRedisDel.mockResolvedValue(1);

      const expiredCart = await Cart.create({
        userId: user._id,
        expiresAt: new Date(Date.now() - 1000), // in the past
        status: 'active',
        items: [{ matchId: match._id, seatId: seat._id, price: seat.price }],
      });

      const res = await request(app)
        .get(`/api/v1/cart/${expiredCart._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(410);
      expect(res.body.error.code).toBe('CART_EXPIRED');

      // Verify cart status updated in DB
      const updatedCart = await Cart.findById(expiredCart._id);
      expect(updatedCart.status).toBe('expired');
      expect(mockRedisDel).toHaveBeenCalledWith(`seat:${seat._id}`);
    });
  });

  describe('DELETE /api/v1/cart/:id', () => {
    let activeCart;

    beforeEach(async () => {
      activeCart = await Cart.create({
        userId: user._id,
        expiresAt: new Date(Date.now() + 600000),
        status: 'active',
        items: [{ matchId: match._id, seatId: seat._id, price: seat.price }],
      });
    });

    it('expires the cart and releases Redis locks', async () => {
      mockRedisDel.mockResolvedValue(1);

      const res = await request(app)
        .delete(`/api/v1/cart/${activeCart._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(204);

      const updatedCart = await Cart.findById(activeCart._id);
      expect(updatedCart.status).toBe('expired');
      expect(mockRedisDel).toHaveBeenCalledWith(`seat:${seat._id}`);
    });

    it('returns 403 if deletion attempted by non-owner', async () => {
      const res = await request(app)
        .delete(`/api/v1/cart/${activeCart._id}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(res.status).toBe(403);
    });
  });
});
