const Redis = require("ioredis");
require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL;

const redis = new Redis(REDIS_URL);

redis.on('connect', () => console.log(`[Worker ${process.pid}] Connected(Redis)`));
  
redis.on('error', err => console.log(`[Worker ${process.pid}] Redis Client Error`, err));

redis.on("close", () => console.log(`[Worker ${process.pid}] Redis client closed`));
  
module.exports = {
    redis
}; 

