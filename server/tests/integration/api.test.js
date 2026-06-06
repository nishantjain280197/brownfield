const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { initDatabase, closeDatabase } = require('../../src/db/database');

let app;
let token;

const TEST_DB_PATH = path.join(__dirname, '../test.db');

beforeAll(() => {
  initDatabase(TEST_DB_PATH);
  app = require('../../src/index');
});

afterAll(() => {
  closeDatabase();
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

describe('Health Check', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Auth Routes', () => {
  it('POST /api/auth/login with valid credentials returns token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('admin');
    expect(res.body.user.role).toBe('admin');
    token = res.body.token;
  });

  it('POST /api/auth/login with invalid credentials returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  it('POST /api/auth/login with missing fields returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('MISSING_CREDENTIALS');
  });

  it('GET /api/auth/me returns current user profile', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('admin');
  });

  it('GET /api/auth/me without token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('User Routes', () => {
  let createdUserId;

  it('POST /api/users creates a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'testadjuster',
        email: 'adjuster@test.com',
        password: 'password123',
        role: 'adjuster',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe('testadjuster');
    expect(res.body.user.role).toBe('adjuster');
    createdUserId = res.body.user.id;
  });

  it('POST /api/users rejects duplicate username', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        username: 'testadjuster',
        email: 'other@test.com',
        password: 'password123',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('USER_EXISTS');
  });

  it('GET /api/users returns user list', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThanOrEqual(2);
  });

  it('PUT /api/users/:id updates user role', async () => {
    const res = await request(app)
      .put(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'underwriter' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('underwriter');
  });
});

describe('Threshold Routes', () => {
  let thresholdId;

  it('GET /api/thresholds returns all thresholds', async () => {
    const res = await request(app)
      .get('/api/thresholds')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.thresholds)).toBe(true);
    expect(res.body.thresholds.length).toBeGreaterThan(0);
    thresholdId = res.body.thresholds[0].id;
  });

  it('GET /api/thresholds filters by peril_type', async () => {
    const res = await request(app)
      .get('/api/thresholds?peril_type=wind')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.thresholds.every(t => t.peril_type === 'wind')).toBe(true);
  });

  it('PUT /api/thresholds/:id updates a threshold', async () => {
    const res = await request(app)
      .put(`/api/thresholds/${thresholdId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ min_value: 5, description: 'Updated description' });

    expect(res.status).toBe(200);
    expect(res.body.threshold.min_value).toBe(5);
    expect(res.body.threshold.description).toBe('Updated description');
  });

  it('PUT /api/thresholds/:id rejects unknown ID', async () => {
    const res = await request(app)
      .put('/api/thresholds/nonexistent-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ min_value: 5 });

    expect(res.status).toBe(404);
  });
});

describe('Weather Routes', () => {
  it('GET /api/weather/search rejects invalid coordinates', async () => {
    const res = await request(app)
      .get('/api/weather/search?lat=999&lon=0&start_date=2024-01-01&end_date=2024-01-01')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_COORDINATES');
  });

  it('GET /api/weather/search rejects invalid dates', async () => {
    const res = await request(app)
      .get('/api/weather/search?lat=30&lon=-97&start_date=invalid&end_date=2024-01-01')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_DATE');
  });

  it('GET /api/weather/geocode rejects empty address', async () => {
    const res = await request(app)
      .get('/api/weather/geocode?address=')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_ADDRESS');
  });

  it('GET /api/weather/comparison rejects invalid date', async () => {
    const res = await request(app)
      .get('/api/weather/comparison?lat=30&lon=-97&date_of_loss=invalid')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_DATE');
  });

  it('GET /api/weather/search requires authentication', async () => {
    const res = await request(app)
      .get('/api/weather/search?lat=30&lon=-97&start_date=2024-01-01&end_date=2024-01-01');

    expect(res.status).toBe(401);
  });
});

describe('Audit Routes', () => {
  it('GET /api/audit returns paginated entries', async () => {
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.entries)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.page).toBe(1);
  });

  it('GET /api/audit supports filtering by action', async () => {
    const res = await request(app)
      .get('/api/audit?action=LOGIN_SUCCESS')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    if (res.body.entries.length > 0) {
      expect(res.body.entries.every(e => e.action === 'LOGIN_SUCCESS')).toBe(true);
    }
  });

  it('GET /api/audit requires admin role', async () => {
    // Login as non-admin user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadjuster', password: 'password123' });

    const userToken = loginRes.body.token;
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('FORBIDDEN');
  });
});

describe('Auth - Logout', () => {
  it('POST /api/auth/logout invalidates session', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    const tempToken = loginRes.body.token;

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${tempToken}`);
    expect(logoutRes.status).toBe(200);

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tempToken}`);
    expect(meRes.status).toBe(401);
  });
});
