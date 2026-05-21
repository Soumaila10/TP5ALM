jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => {
    const handlers = {};
    return {
      on: jest.fn((event, cb) => {
        handlers[event] = cb;
      }),
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue('OK'),
      _emit: (event, payload) => handlers[event]?.(payload),
    };
  });
});

const Redis = require('ioredis');
const {
  createRedisClient,
  createFallbackRedisClient,
  setRedisClient,
  getRedisClient,
  pingRedis,
  disconnectRedis,
} = require('../../config/redis');

describe('config/redis', () => {
  afterEach(async () => {
    await disconnectRedis().catch(() => {});
    Redis.mockClear();
  });

  it('throws if url is missing', () => {
    expect(() => createRedisClient({})).toThrow(/UPSTASH_REDIS_URL is required/);
  });

  it('enables TLS when url uses rediss://', () => {
    createRedisClient({ url: 'rediss://default:token@host:6379' });
    expect(Redis).toHaveBeenCalledWith(
      'rediss://default:token@host:6379',
      expect.objectContaining({ tls: {} }),
    );
  });

  it('does not set TLS for plain redis://', () => {
    createRedisClient({ url: 'redis://localhost:6379' });
    expect(Redis).toHaveBeenCalledWith(
      'redis://localhost:6379',
      expect.objectContaining({ tls: undefined }),
    );
  });

  it('pings the client and returns true on PONG', async () => {
    const c = createRedisClient({ url: 'rediss://host:6379' });
    setRedisClient(c);
    const ok = await pingRedis();
    expect(ok).toBe(true);
  });

  it('supports the development fallback Redis client', async () => {
    const fallback = createFallbackRedisClient({ logger: { warn: jest.fn() } });
    setRedisClient(fallback);

    const ok = await pingRedis();
    expect(ok).toBe(true);

    await expect(fallback.set('seat:1', 'user1', 'NX', 'EX', 600)).resolves.toBe('OK');
    expect(await fallback.get('seat:1')).toBe('user1');
    await expect(fallback.del('seat:1')).resolves.toBe(1);
  });

  it('getRedisClient throws before init', () => {
    expect(() => getRedisClient()).toThrow(/not initialized/);
  });
});
