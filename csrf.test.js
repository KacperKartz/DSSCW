const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
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
  if (!req.session.user || !req.session.user.authenticated !== true) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Test routes for CSRF vulnerability assessment
app.post('/test/login', (req, res) => {
  req.session.user = {
    username: 'testuser',
    email: 'test@example.com',
    authenticated: true,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };
  res.status(200).json({ message: 'Login successful' });
});

app.post('/makepost', sessionIntegrityCheck, (req, res) => {
  const { title_field, content_field } = req.body;
  
  if (!req.session.user || req.session.user.authenticated !== true) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.status(200).json({ 
    message: 'Post created successfully',
    post: {
      title: title_field,
      content: content_field,
      author: req.session.user.username,
      date: new Date().toISOString()
    }
  });
});

describe('CSRF Protection Tests', () => {
  test('cookie should have SameSite=strict to prevent CSRF', async () => {
    const response = await request(app)
      .post('/test/login')
      .set('Accept', 'application/json');
    
    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    
    expect(cookies[0]).toMatch(/SameSite=Strict/i);
  });

  test('sensitive actions should require authentication', async () => {
    const response = await request(app)
      .post('/makepost')
      .send({ title_field: 'Test Title', content_field: 'Test Content' })
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(401);
  });
});