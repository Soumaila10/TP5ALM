const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { createApp } = require('../../app');
const { Match, Stadium, Seat } = require('../../models');
const { setRedisClient } = require('../../config/redis');

jest.setTimeout(120000);

let mongod;
let app;

// Mock ioredis
const mockRedisGet = jest.fn();
const mockRedisClient = {
  get: mockRedisGet,
};

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'fifa-ticketing-match-test' });
  
  // Set the mocked Redis client
  setRedisClient(mockRedisClient);

  app = createApp({ frontendUrl: 'http://localhost:5173' });
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  await Match.deleteMany({});
  await Stadium.deleteMany({});
  await Seat.deleteMany({});
  mockRedisGet.mockReset();
});

describe('Match Routes Integration Tests', () => {
  let stadium;
  let match;
  let seat1;
  let seat2;

  beforeEach(async () => {
    stadium = await Stadium.create({
      name: 'Stade de France',
      city: 'Paris',
      country: 'France',
      capacity: 80000,
    });

    match = await Match.create({
      teamA: 'France',
      teamB: 'Brésil',
      round: 'final',
      group: 'A',
      date: new Date('2026-07-19T21:00:00Z'),
      stadiumId: stadium._id,
      totalSeats: 2,
      availableSeats: 2,
      isActive: true,
    });

    seat1 = await Seat.create({
      stadiumId: stadium._id,
      section: 'A',
      row: '1',
      number: 1,
      category: 'A',
      price: 150,
      status: 'available',
    });

    seat2 = await Seat.create({
      stadiumId: stadium._id,
      section: 'A',
      row: '1',
      number: 2,
      category: 'A',
      price: 150,
      status: 'sold',
    });
  });

  describe('GET /api/v1/matches', () => {
    it('returns a list of active matches', async () => {
      const res = await request(app).get('/api/v1/matches');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].teamA).toBe('France');
      expect(res.body[0].stadiumId.name).toBe('Stade de France');
    });

    it('filters by teamA name', async () => {
      const res = await request(app).get('/api/v1/matches?teamA=Fra');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);

      const emptyRes = await request(app).get('/api/v1/matches?teamA=Allemagne');
      expect(emptyRes.status).toBe(200);
      expect(emptyRes.body).toHaveLength(0);
    });

    it('filters by teamB name', async () => {
      const res = await request(app).get('/api/v1/matches?teamB=Bré');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('filters by stadiumId', async () => {
      const res = await request(app).get(`/api/v1/matches?stadiumId=${stadium._id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('filters by date', async () => {
      const res = await request(app).get('/api/v1/matches?date=2026-07-19');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('GET /api/v1/matches/:id', () => {
    it('returns match details by ID', async () => {
      const res = await request(app).get(`/api/v1/matches/${match._id}`);
      expect(res.status).toBe(200);
      expect(res.body.teamA).toBe('France');
      expect(res.body.stadiumId._id.toString()).toBe(stadium._id.toString());
    });

    it('returns 422 if ID format is invalid', async () => {
      const res = await request(app).get('/api/v1/matches/invalid-id');
      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 if match is not found', async () => {
      const randomId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/v1/matches/${randomId}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('MATCH_NOT_FOUND');
    });
  });

  describe('GET /api/v1/matches/:id/seats', () => {
    it('returns seats for the match stadium with their current statuses', async () => {
      mockRedisGet.mockResolvedValue(null); // No locks

      const res = await request(app).get(`/api/v1/matches/${match._id}/seats`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);

      const returnedSeat1 = res.body.find(s => s._id.toString() === seat1._id.toString());
      const returnedSeat2 = res.body.find(s => s._id.toString() === seat2._id.toString());

      expect(returnedSeat1.status).toBe('available');
      expect(returnedSeat2.status).toBe('sold');
    });

    it('returns seat status as locked if a lock exists in Redis', async () => {
      // Mock seat1 locked by a user
      mockRedisGet.mockImplementation((key) => {
        if (key === `seat:${seat1._id}`) {
          return Promise.resolve('some-user-id');
        }
        return Promise.resolve(null);
      });

      const res = await request(app).get(`/api/v1/matches/${match._id}/seats`);
      expect(res.status).toBe(200);

      const returnedSeat1 = res.body.find(s => s._id.toString() === seat1._id.toString());
      expect(returnedSeat1.status).toBe('locked');
    });
  });
});
