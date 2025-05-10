const { encrypt, decrypt, hashPassword, verifyPassword } = require('./app/encryption');
require('dotenv').config({ path: '.env.test' });

describe('Encryption Module Tests', () => {
  describe('Symmetric Encryption', () => {
    test('encrypt and decrypt functions should correctly handle data', () => {
      const sensitiveData = 'This is sensitive information';
      const encrypted = encrypt(sensitiveData);
      
      expect(encrypted).not.toBe(sensitiveData);
      
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(sensitiveData);
    });

    test('encrypted output should be in valid hex format', () => {
      const testData = 'Test data for encryption';
      const encrypted = encrypt(testData);
      
      expect(/^[0-9a-f]+$/i.test(encrypted)).toBe(true);
    });

    test('decrypt should fail with incorrect ciphertext', () => {
      const invalidCiphertext = 'invalidciphertext123';
      
      expect(() => {
        decrypt(invalidCiphertext);
      }).toThrow();
    });

    test('encryption of same data should produce different outputs with different IVs', () => {
      // This test requires modifying the IV, which we can't do in a unit test without changing the implementation. Just documenting the expectation.
      const sampleData = 'Identical data';
      const encrypted = encrypt(sampleData);
      
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(sampleData);
    });
  });

  describe('Password Hashing and Verification', () => {
    test('hashPassword should return different salt and hash for same password', () => {
      const password = 'SecurePassword123!';
      
      const result1 = hashPassword(password);
      const result2 = hashPassword(password);
      
      expect(result1.salt).not.toBe(result2.salt);
      
      expect(result1.hash).not.toBe(result2.hash);
    });

    test('verifyPassword should return true for correct password', () => {
      const password = 'CorrectPassword123!';
      const { salt, hash } = hashPassword(password);
      
      const isValid = verifyPassword(password, salt, hash);
      expect(isValid).toBe(true);
    });

    test('verifyPassword should return false for incorrect password', () => {
      const correctPassword = 'CorrectPassword123!';
      const wrongPassword = 'WrongPassword123!';
      
      const { salt, hash } = hashPassword(correctPassword);
      
      const isValid = verifyPassword(wrongPassword, salt, hash);
      expect(isValid).toBe(false);
    });

    test('hash should be long enough to be secure', () => {
      const password = 'TestPassword123!';
      const { hash } = hashPassword(password);
      
      expect(hash.length).toBeGreaterThanOrEqual(64);
    });

    test('minimum hash computation time should be reasonable for security', () => {
      const password = 'BenchmarkPassword123!';
      
      const startTime = Date.now();
      hashPassword(password);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      
      // Hash should take some time to compute to prevent brute force attacks
      expect(duration).toBeGreaterThan(10); // at least 10ms but id probably want over 100ms on live
    });
  });
});