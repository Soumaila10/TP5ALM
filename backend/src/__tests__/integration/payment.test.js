const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { createApp } = require('../../app');
const { Match, Stadium, Seat, Cart, Order, Ticket, User } = require('../../models');
const { setRedisClient } = require('../../config/redis');
const { loadEnv } = require('../../config/env');

jest.setTimeout(120000);

// Mock emailService
jest.mock('../../services/emailService', () => ({
  sendOrderConfirmationEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
  sendOTPEmail: jest.fn().mockResolvedValue({ messageId: 'mock-id' }),
}));

const { sendOrderConfirmationEmail } = require('../../services/emailService');

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
  await mongoose.connect(mongod.getUri(), { dbName: 'fifa-ticketing-payment-test' });
  
  setRedisClient(mockRedisClient);

  app = createApp({ frontendUrl: 'http://localhost:5173' });

  // Create test users
  user = await User.create({
    email: 'charlie@example.com',
    passwordHash: 'hashedpassword',
    firstName: 'Charlie',
    lastName: 'Brown',
    isVerified: true,
  });

  otherUser = await User.create({
    email: 'snoopy@example.com',
    passwordHash: 'hashedpassword',
    firstName: 'Snoopy',
    lastName: 'Beagle',
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
  await Order.deleteMany({});
  await Ticket.deleteMany({});
  
  mockRedisGet.mockReset();
  mockRedisSet.mockReset();
  mockRedisDel.mockReset();
  sendOrderConfirmationEmail.mockClear();
});

describe('Payment & Orders Integration Tests', () => {
  let stadium;
  let match;
  let seat;
  let cart;

  beforeEach(async () => {
    stadium = await Stadium.create({
      name: 'Rose Bowl',
      city: 'Pasadena',
      country: 'USA',
      capacity: 90000,
    });

    match = await Match.create({
      teamA: 'Brésil',
      teamB: 'Italie',
      round: 'final',
      group: 'A',
      date: new Date('2026-07-19T20:00:00Z'),
      stadiumId: stadium._id,
      totalSeats: 1000,
      availableSeats: 999,
      isActive: true,
    });

    seat = await Seat.create({
      stadiumId: stadium._id,
      section: 'Main Gold',
      row: 'A',
      number: 1,
      category: 'A',
      price: 300,
      status: 'available',
    });

    cart = await Cart.create({
      userId: user._id,
      expiresAt: new Date(Date.now() + 600000),
      status: 'active',
      items: [{ matchId: match._id, seatId: seat._id, price: seat.price }],
    });
  });

  describe('POST /api/v1/payment/intent', () => {
    it('returns clientSecret and payment details', async () => {
      const res = await request(app)
        .post('/api/v1/payment/intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ cartId: cart._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.clientSecret).toBeDefined();
      expect(res.body.amount).toBe(300);
      expect(res.body.currency).toBe('eur');
    });

    it('returns 410 if the cart has expired', async () => {
      const expiredCart = await Cart.create({
        userId: user._id,
        expiresAt: new Date(Date.now() - 1000),
        status: 'active',
        items: [{ matchId: match._id, seatId: seat._id, price: seat.price }],
      });

      const res = await request(app)
        .post('/api/v1/payment/intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ cartId: expiredCart._id.toString() });

      expect(res.status).toBe(410);
      expect(res.body.error.code).toBe('CART_EXPIRED');
    });
  });

  describe('POST /api/v1/payment/confirm', () => {
    it('creates Order/Tickets, updates Seat, deletes Redis locks, and sends email', async () => {
      mockRedisDel.mockResolvedValue(1);

      const res = await request(app)
        .post('/api/v1/payment/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          cartId: cart._id.toString(),
          paymentIntentId: 'pi_mock_12345',
        });

      expect(res.status).toBe(200);
      expect(res.body.orderId).toBeDefined();
      expect(res.body.status).toBe('confirmed');

      // Verify Order is created
      const order = await Order.findById(res.body.orderId);
      expect(order).toBeTruthy();
      expect(order.status).toBe('confirmed');
      expect(order.totalAmount).toBe(300);

      // Verify Ticket is created
      const ticket = await Ticket.findOne({ orderId: order._id });
      expect(ticket).toBeTruthy();
      expect(ticket.qrCode).toBeDefined();
      expect(ticket.pdfUrl).toContain('.pdf');

      // Verify Seat is marked sold
      const updatedSeat = await Seat.findById(seat._id);
      expect(updatedSeat.status).toBe('sold');

      // Verify Redis lock deleted
      expect(mockRedisDel).toHaveBeenCalledWith(`seat:${seat._id}`);

      // Verify email sent
      expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(
        user.email,
        order._id.toString(),
        ticket.pdfUrl
      );
    });

    it('handles idempotent calls and returns existing Order ID', async () => {
      mockRedisDel.mockResolvedValue(1);

      // Call 1
      const res1 = await request(app)
        .post('/api/v1/payment/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          cartId: cart._id.toString(),
          paymentIntentId: 'pi_mock_idempotent',
        });
      
      const orderId1 = res1.body.orderId;

      // Call 2 with same paymentIntentId
      const res2 = await request(app)
        .post('/api/v1/payment/confirm')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          cartId: cart._id.toString(),
          paymentIntentId: 'pi_mock_idempotent',
        });

      expect(res2.status).toBe(200);
      expect(res2.body.orderId).toBe(orderId1);

      // Verify only 1 Order exists in DB
      const count = await Order.countDocuments({ stripePaymentIntentId: 'pi_mock_idempotent' });
      expect(count).toBe(1);
    });
  });

  describe('POST /api/v1/payment/webhook', () => {
    it('creates Order/Tickets from webhook payload event', async () => {
      mockRedisDel.mockResolvedValue(1);

      const webhookPayload = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_mock_webhook_123',
            amount: 30000,
            metadata: {
              cartId: cart._id.toString(),
              userId: user._id.toString(),
            },
          },
        },
      };

      const res = await request(app)
        .post('/api/v1/payment/webhook')
        .send(webhookPayload);

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);

      // Verify Order created in DB
      const order = await Order.findOne({ stripePaymentIntentId: 'pi_mock_webhook_123' });
      expect(order).toBeTruthy();
      expect(order.status).toBe('confirmed');

      // Verify seat sold and lock released
      const updatedSeat = await Seat.findById(seat._id);
      expect(updatedSeat.status).toBe('sold');
      expect(mockRedisDel).toHaveBeenCalledWith(`seat:${seat._id}`);
    });
  });

  describe('GET /api/v1/orders', () => {
    it('returns history of confirmed orders', async () => {
      // Create test order
      const order = await Order.create({
        userId: user._id,
        totalAmount: 300,
        status: 'confirmed',
        stripePaymentIntentId: 'pi_mock_history',
      });

      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]._id).toBe(order._id.toString());
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('returns order details and populated tickets', async () => {
      const order = await Order.create({
        userId: user._id,
        totalAmount: 300,
        status: 'confirmed',
        stripePaymentIntentId: 'pi_mock_details',
      });

      const ticket = await Ticket.create({
        orderId: order._id,
        matchId: match._id,
        seatId: seat._id,
        userId: user._id,
        qrCode: 'ticket-qr-123',
        pdfUrl: 'http://localhost/ticket.pdf',
        status: 'valid',
      });

      const res = await request(app)
        .get(`/api/v1/orders/${order._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order._id).toBe(order._id.toString());
      expect(res.body.tickets).toHaveLength(1);
      expect(res.body.tickets[0]._id).toBe(ticket._id.toString());
      expect(res.body.tickets[0].matchId.teamA).toBe('Brésil');
    });

    it('returns 403 when trying to access another user\'s order', async () => {
      const order = await Order.create({
        userId: otherUser._id,
        totalAmount: 300,
        status: 'confirmed',
        stripePaymentIntentId: 'pi_mock_other',
      });

      const res = await request(app)
        .get(`/api/v1/orders/${order._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/tickets/:id/qr', () => {
    it('returns QR code in base64 format', async () => {
      const order = await Order.create({
        userId: user._id,
        totalAmount: 300,
        status: 'confirmed',
        stripePaymentIntentId: 'pi_mock_qr',
      });

      const ticket = await Ticket.create({
        orderId: order._id,
        matchId: match._id,
        seatId: seat._id,
        userId: user._id,
        qrCode: 'ticket-qr-uuid-code',
        pdfUrl: 'http://localhost/ticket.pdf',
        status: 'valid',
      });

      const res = await request(app)
        .get(`/api/v1/tickets/${ticket._id}/qr`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.qrCode).toContain('data:image/png;base64,');
    });
  });
});
