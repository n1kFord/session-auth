process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/auth_test";
process.env.REDIS_CLIENT_URI = process.env.REDIS_CLIENT_URI || "redis://localhost:6379";
process.env.REDIS_SECRET = process.env.REDIS_SECRET || "test-secret-key-for-jest";
process.env.NODE_ENV = "test";
process.env.PORT = "8080";

const mongoose = require("mongoose");

beforeAll(async () => {
    if (process.env.CI) {
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Test environment ready");
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    console.log("✅ Test environment cleaned up");
});