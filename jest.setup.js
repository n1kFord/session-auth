process.env.MONGO_URI = "mongodb://localhost:27017/auth_test";
process.env.NODE_ENV = "test";
process.env.PORT = "8080";

const mongoose = require("mongoose");

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Test environment ready");
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    console.log("✅ Test environment cleaned up");
});