const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'test_secret_key_for_testing',
  resave: false,
  saveUninitialized: false
}));

function isAuthenticated(req, res, next) {
  if (!req.session.user || !req.session.user.authenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.post('/api/validate-email', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  if (typeof email !== 'string') {
    return res.status(400).json({ error: 'Email must be a string' });
  }
  
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  res.status(200).json({ valid: true });
});

app.post('/api/validate-password', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  if (typeof password !== 'string') {
    return res.status(400).json({ error: 'Password must be a string' });
  }
  
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  
  res.status(200).json({ valid: true });
});

app.post('/api/posts', isAuthenticated, (req, res) => {
  const { title, content } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  if (typeof title !== 'string') {
    return res.status(400).json({ error: 'Title must be a string' });
  }
  
  if (title.length < 3 || title.length > 100) {
    return res.status(400).json({ error: 'Title must be between 3 and 100 characters' });
  }
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'Content must be a string' });
  }
  
  if (content.length < 10) {
    return res.status(400).json({ error: 'Content must be at least 10 characters long' });
  }
  
  // TODO: Sanitize input test
  res.status(201).json({ message: 'Post created successfully' });
});

app.post('/test/login', (req, res) => {
  req.session.user = {
    username: 'testuser',
    email: 'test@example.com',
    authenticated: true
  };
  res.status(200).json({ message: 'Test login successful' });
});

describe('Input Validation Tests', () => {
  describe('Email Validation', () => {
    test('should reject missing email', async () => {
      const response = await request(app)
        .post('/api/validate-email')
        .send({})
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email is required');
    });

    test('should reject non-string email', async () => {
      const response = await request(app)
        .post('/api/validate-email')
        .send({ email: 123 })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email must be a string');
    });

    test('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/validate-email')
        .send({ email: 'invalid-email' })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email format');
    });

    test('should accept valid email', async () => {
      const response = await request(app)
        .post('/api/validate-email')
        .send({ email: 'test@example.com' })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
    });
  });

  describe('Password Validation', () => {
    test('should reject missing password', async () => {
      const response = await request(app)
        .post('/api/validate-password')
        .send({})
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password is required');
    });

    test('should reject non-string password', async () => {
      const response = await request(app)
        .post('/api/validate-password')
        .send({ password: 12345678 })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password must be a string');
    });

    test('should reject too short password', async () => {
      const response = await request(app)
        .post('/api/validate-password')
        .send({ password: 'short' })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password must be at least 8 characters long');
    });

    test('should accept valid password', async () => {
      const response = await request(app)
        .post('/api/validate-password')
        .send({ password: 'validpassword123' })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
    });
  });

  describe('Blog Post Validation', () => {
    let agent;
    
    beforeEach(() => {
      agent = request.agent(app);
      return agent
        .post('/test/login')
        .set('Accept', 'application/json');
    });
    
    test('should reject unauthenticated post creation', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send({ title: 'Test Title', content: 'Test Content' })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(401);
    });

    test('should reject missing title', async () => {
      const response = await agent
        .post('/api/posts')
        .send({ content: 'Test Content' })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title is required');
    });

    test('should reject too short title', async () => {
      const response = await agent
        .post('/api/posts')
        .send({ title: 'AB', content: 'Test Content' })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Title must be between 3 and 100 characters');
    });

    test('should reject missing content', async () => {
      const response = await agent
        .post('/api/posts')
        .send({ title: 'Test Title' })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Content is required');
    });

    test('should reject too short content', async () => {
      const response = await agent
        .post('/api/posts')
        .send({ title: 'Test Title', content: 'Short' })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Content must be at least 10 characters long');
    });

    test('should accept valid post', async () => {
      const response = await agent
        .post('/api/posts')
        .send({ 
          title: 'Valid Test Title', 
          content: 'This is valid content for a blog post.'
        })
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Post created successfully');
    });
  });
});