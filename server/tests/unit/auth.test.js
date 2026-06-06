const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

jest.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

const TEST_DB = path.join(__dirname, '../auth_test.db');

beforeAll(() => {
  const { initDatabase } = require('../../src/db/database');
  initDatabase(TEST_DB);
});

afterAll(() => {
  const { closeDatabase } = require('../../src/db/database');
  closeDatabase();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

const { authenticate, requireRole, JWT_SECRET, SESSION_TIMEOUT_MINUTES } = require('../../src/middleware/auth');

function createMockReqRes(authHeader) {
  const req = {
    headers: { authorization: authHeader },
    user: null,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('Auth Middleware', () => {
  describe('authenticate', () => {
    it('rejects requests without Authorization header', () => {
      const { req, res, next } = createMockReqRes(undefined);
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'AUTH_REQUIRED' }));
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects requests with non-Bearer token', () => {
      const { req, res, next } = createMockReqRes('Basic abc123');
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects invalid JWT tokens', () => {
      const { req, res, next } = createMockReqRes('Bearer invalid.token.here');
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_TOKEN' }));
    });

    it('rejects expired JWT tokens', () => {
      const token = jwt.sign(
        { userId: 'test', username: 'test', role: 'user', jti: 'test-jti' },
        JWT_SECRET,
        { expiresIn: '-1h' },
      );
      const { req, res, next } = createMockReqRes(`Bearer ${token}`);
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'TOKEN_EXPIRED' }));
    });

    it('rejects valid token without matching session', () => {
      const token = jwt.sign(
        { userId: 'nonexistent', username: 'ghost', role: 'user', jti: 'no-session' },
        JWT_SECRET,
        { expiresIn: '1h' },
      );
      const { req, res, next } = createMockReqRes(`Bearer ${token}`);
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'INVALID_SESSION' }));
    });
  });

  describe('requireRole', () => {
    it('rejects unauthenticated requests', () => {
      const middleware = requireRole('admin');
      const { req, res, next } = createMockReqRes(undefined);
      req.user = null;
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects users without required role', () => {
      const middleware = requireRole('admin');
      const { req, res, next } = createMockReqRes(undefined);
      req.user = { userId: '1', username: 'test', role: 'user' };
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'FORBIDDEN' }));
    });

    it('allows users with correct role', () => {
      const middleware = requireRole('admin', 'user');
      const { req, res, next } = createMockReqRes(undefined);
      req.user = { userId: '1', username: 'test', role: 'user' };
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('constants', () => {
    it('exports session timeout', () => {
      expect(SESSION_TIMEOUT_MINUTES).toBe(15);
    });
  });
});
