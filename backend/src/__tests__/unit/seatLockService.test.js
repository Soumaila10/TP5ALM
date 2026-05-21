const { getRedisClient } = require('../../config/redis');
const { lockSeat, unlockSeat, getSeatLockUser, isLocked } = require('../../services/seatLockService');
const AppError = require('../../utils/AppError');

jest.mock('../../config/redis', () => {
  const mockRedis = {
    set: jest.fn(),
    del: jest.fn(),
    get: jest.fn(),
  };
  return {
    getRedisClient: () => mockRedis,
  };
});

describe('services/seatLockService', () => {
  const mockRedis = getRedisClient();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('lockSeat', () => {
    it('should lock a seat successfully if not already locked', async () => {
      mockRedis.set.mockResolvedValue('OK');
      const result = await lockSeat('seat123', 'user456');
      expect(result).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith('seat:seat123', 'user456', 'NX', 'EX', 600);
    });

    it('should throw AppError 409 if seat is already locked', async () => {
      mockRedis.set.mockResolvedValue(null);
      await expect(lockSeat('seat123', 'user456')).rejects.toThrow(AppError);
      await expect(lockSeat('seat123', 'user456')).rejects.toThrow('Ce siège est déjà réservé ou verrouillé par un autre utilisateur.');
    });
  });

  describe('unlockSeat', () => {
    it('should unlock a seat successfully', async () => {
      mockRedis.del.mockResolvedValue(1);
      const result = await unlockSeat('seat123');
      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('seat:seat123');
    });
  });

  describe('getSeatLockUser', () => {
    it('should return user ID if locked', async () => {
      mockRedis.get.mockResolvedValue('user456');
      const result = await getSeatLockUser('seat123');
      expect(result).toBe('user456');
      expect(mockRedis.get).toHaveBeenCalledWith('seat:seat123');
    });

    it('should return null if not locked', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await getSeatLockUser('seat123');
      expect(result).toBeNull();
    });
  });

  describe('isLocked', () => {
    it('should return true if seat is locked', async () => {
      mockRedis.get.mockResolvedValue('user456');
      const result = await isLocked('seat123');
      expect(result).toBe(true);
    });

    it('should return false if seat is not locked', async () => {
      mockRedis.get.mockResolvedValue(null);
      const result = await isLocked('seat123');
      expect(result).toBe(false);
    });
  });
});
