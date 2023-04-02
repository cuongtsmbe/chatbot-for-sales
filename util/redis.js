const redis = require('redis');
require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL;

const client = redis.createClient({url: REDIS_URL});

(async()=>await client.connect())();

client.on('connect', () => console.log('Connected(Redis)'));
  
client.on('error', err => console.log('Redis Client Error', err));

module.exports = {
    redis:client
}; 

