const crypto = require('crypto');
if (process.env.NODE_ENV === 'test') {
    require('dotenv').config({ path: '.env.test' });
} else {
    require('dotenv').config();
}


// Generate key - 32 random bytes and iv - 16 random bytes

// const key = (crypto.randomBytes(32));
// const iv =(crypto.randomBytes(16));


const algorithm = process.env.ALGORITHM; // assign algorithm from .env
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // asign key from .env
const iv = Buffer.from(process.env.IV, 'hex'); // assign iv from .env
const PEPPER = process.env.PEPPER; // assign pepper from .env







// --- Encryption & Decryption ---

// AES-256-CBC stands for "Advanced Encryption Standard with a 256-bit key in Cipher Block Chaining (CBC) mode."
//  It is a type of symmetric key encryption algorithm that uses a 256-bit key to encode and decode data.
// ref: https://docs.anchormydata.com/docs/what-is-aes-256-cbc


// Encrypt the given text using the algorithm, key and iv
// The key and iv are obtained from the environment variables
function encrypt(data) {
    // Create a cipher using the given algorithm, key and iv
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    // Encrypt the given data
    let encrypted = cipher.update(data, 'utf-8', 'hex');
    // Get the final encrypted value
    encrypted += cipher.final('hex');
    // Return the encrypted value
    encryptedData = encrypted;
    return encryptedData;   
}

// Decrypt the given encrypted text using the algorithm, key and iv
// The key and iv are obtained from the environment variables
function decrypt(encryptedData){
    // Create a decipher using the given algorithm, key and iv
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    // Decrypt the given data
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
    // Get the final decrypted value
    decrypted += decipher.final('utf-8');
    // Return the decrypted value
    decryptedData = decrypted;
    return decryptedData;
}

// Here is how it works:

// // example message
// const message = "Secret Data";
// console.log("Original:", message);
// // We get the encrypted data
// const encrypted = encrypt(message);
// console.log("Encrypted:", encrypted);
// // We get the decrypted data
// const decrypted = decrypt(encrypted);
// console.log("Decrypted:", decrypted);







// Hashing, Salting, and Peppering 


function hashPassword(password){
    const salt = crypto.randomBytes(16).toString('hex');
    const peppered = password + PEPPER;

    // PBKDF2 applies a pseudorandom function, such as hash-based message authentication code (HMAC)
    
    //             pbkdf2Sync(password + pepper, salt, iterations, keyLength, 'sha512')
    const hash = crypto.pbkdf2Sync(peppered, salt, 100000, 64, 'sha512').toString('hex');

    return {
        salt: salt,  // we store these values in the database
        hash: hash
    }

}

// Verify a password against a stored hash
function verifyPassword(password, salt, storedHash){
    // Add pepper to the password
    const peppered = password + PEPPER;
    // Hash the password with the same salt and algorithm as the stored hash
    const hash = crypto.pbkdf2Sync(peppered, salt, 100000, 64, 'sha512').toString('hex');
    // Check if the generated hash matches the stored hash
    return hash === storedHash;
}

// // Example usage
// const {salt , hash} = hashPassword("password");
// console.log(verifyPassword("password", salt, hash));


module.exports = {encrypt, decrypt, hashPassword, verifyPassword};