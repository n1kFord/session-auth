const { createClient } = require("redis");
const { REDIS_CLIENT_URI } = require("./constants");

const redisClient = createClient({
    url: REDIS_CLIENT_URI,
});

redisClient.on("error", (err) => {
    console.error("❌ Redis error:", err);
});

const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            console.log("📦 Connecting to Redis...");
            await redisClient.connect();
            console.log("✅ Redis connected");
        } else {
            console.log("✅ Redis already connected");
        }
    } catch (error) {
        console.error("❌ Redis connection error:", error.message);
        throw error;
    }
};

module.exports = {
    redisClient,
    connectRedis,
};