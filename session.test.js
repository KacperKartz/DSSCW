const express = require('express');
const session = require('express-session');
const request = require('supertest');

const app = express();

app.use(session({
  secret: 'test_secret_key_for_testing',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 60 * 1000,
    httpOnly: true,
    secure: false, // Set to false for testing
    sameSite: 'strict'
  }
}));

function sessionIntegrityCheck(req, res, next) {
  if (!req.session.user || !req.session.user.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const currentIP = req.ip;
  const currentUA = req.get('User-Agent');

  if (req.session.user.ip !== currentIP || req.session.user.userAgent !== currentUA) {
    return res.status(401).json({ error: 'Session integrity check failed' });
  }

  next();
}

// If i ever have to write this many endpoints for a test again i will cry
app.get('/api/public', (req, res) => {
  res.status(200).json({ message: 'Public API endpoint' });
});

app.get('/api/protected', sessionIntegrityCheck, (req, res) => {
  res.status(200).json({ message: 'Protected API endpoint', username: req.session.user.username });
});

app.post('/test/login', (req, res) => {
  req.session.user = {
    username: 'testuser',
    email: 'test@example.com',
    authenticated: true,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };
  res.status(200).json({ message: 'Test login successful', username: 'testuser' });
});

app.post('/test/login-bad-ip', (req, res) => {
  req.session.user = {
    username: 'testuser',
    email: 'test@example.com',
    authenticated: true,
    userAgent: req.get('User-Agent'),
    ip: '192.168.1.1' // Different IP than the request
  };
  res.status(200).json({ message: 'Test login with bad IP successful', username: 'testuser' });
});

app.post('/test/login-bad-ua', (req, res) => {
  req.session.user = {
    username: 'testuser',
    email: 'test@example.com',
    authenticated: true,
    userAgent: 'Different User Agent', // Different user agent than the request
    ip: req.ip
  };
  res.status(200).json({ message: 'Test login with bad UA successful', username: 'testuser' });
});

app.post('/test/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error destroying session' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Test logout successful' });
  });
});

describe('Session Security Tests', () => {
  test('public endpoint should be accessible without authentication', async () => {
    const response = await request(app)
      .get('/api/public')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Public API endpoint');
  });

  test('protected endpoint should reject unauthenticated access', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });

  test('session integrity should reject session with wrong IP', async () => {
    const agent = request.agent(app);
    
    await agent
      .post('/test/login-bad-ip')
      .set('Accept', 'application/json');
    
    const response = await agent
      .get('/api/protected')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Session integrity check failed');
  });

  test('session integrity should reject session with wrong User Agent', async () => {
    const agent = request.agent(app);
    
    await agent
      .post('/test/login-bad-ua')
      .set('Accept', 'application/json');
    
    const response = await agent
      .get('/api/protected')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Session integrity check failed');
  });

  test('authenticated session should grant access to protected endpoint', async () => {
    const agent = request.agent(app);
    
    await agent
      .post('/test/login')
      .set('Accept', 'application/json');
    
    const response = await agent
      .get('/api/protected')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Protected API endpoint');
    expect(response.body.username).toBe('testuser');
  });

  test('logout should invalidate session', async () => {
    const agent = request.agent(app);
    
    await agent
      .post('/test/login')
      .set('Accept', 'application/json');
    
    let response = await agent
      .get('/api/protected')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    
    await agent
      .post('/test/logout')
      .set('Accept', 'application/json');
    
    response = await agent
      .get('/api/protected')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });

  test('session cookie should be HttpOnly', async () => {
    const response = await request(app)
      .post('/test/login')
      .set('Accept', 'application/json');
    
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    
    expect(cookies[0]).toMatch(/HttpOnly/);
  });

  test('session cookie should have SameSite=strict', async () => {
    const response = await request(app)
      .post('/test/login')
      .set('Accept', 'application/json');
    
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    
    expect(cookies[0]).toMatch(/SameSite=Strict/i);
  });
});