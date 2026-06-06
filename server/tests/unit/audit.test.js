const path = require('path');
const fs = require('fs');

jest.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

const TEST_DB = path.join(__dirname, '../audit_test.db');

beforeAll(() => {
  const { initDatabase } = require('../../src/db/database');
  initDatabase(TEST_DB);
});

afterAll(() => {
  const { closeDatabase } = require('../../src/db/database');
  closeDatabase();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

const { logAuditEvent, auditSearchMiddleware } = require('../../src/middleware/audit');
const { getDatabase } = require('../../src/db/database');

describe('Audit Middleware', () => {
  describe('logAuditEvent', () => {
    it('writes an audit entry to the database', () => {
      logAuditEvent({
        userId: 'user-123',
        action: 'TEST_ACTION',
        resource: 'test',
        details: { key: 'value' },
        ipAddress: '127.0.0.1',
        userAgent: 'TestAgent/1.0',
      });

      const db = getDatabase();
      const entry = db.prepare("SELECT * FROM audit_log WHERE action = 'TEST_ACTION'").get();
      expect(entry).toBeDefined();
      expect(entry.user_id).toBe('user-123');
      expect(JSON.parse(entry.details)).toEqual({ key: 'value' });
    });

    it('handles missing optional fields', () => {
      logAuditEvent({
        action: 'MINIMAL_ACTION',
        resource: 'test',
      });

      const db = getDatabase();
      const entry = db.prepare("SELECT * FROM audit_log WHERE action = 'MINIMAL_ACTION'").get();
      expect(entry).toBeDefined();
      expect(entry.user_id).toBeNull();
      expect(entry.details).toBeNull();
    });
  });

  describe('auditSearchMiddleware', () => {
    it('logs search requests via res.json override', () => {
      const req = {
        user: { userId: 'user-1' },
        originalUrl: '/api/weather/search?lat=30',
        query: { lat: '30', lon: '-97' },
        body: {},
        ip: '192.168.1.1',
        get: () => 'Mozilla/5.0',
      };

      let capturedBody = null;
      const res = {
        statusCode: 200,
        json: (body) => { capturedBody = body; return res; },
      };
      const next = jest.fn();

      auditSearchMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();

      // Call the overridden json
      res.json({ results: [] });
      expect(capturedBody).toEqual({ results: [] });
    });
  });
});
