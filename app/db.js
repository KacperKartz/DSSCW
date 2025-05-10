const { Client } = require('pg');

const client = new Client({
  host: process.env.DATABASE_IP,
  user: process.env.DATABASE_USER,
  port: process.env.DATABASE_PORT,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME
});

client.connect()
  .then(() => {
    console.log('db: Database Connected');
  })
  .catch((err) => {
    console.error('db: Error connecting to the database', err);
  });

module.exports = client;
