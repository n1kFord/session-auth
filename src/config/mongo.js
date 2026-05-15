const mongoose = require("mongoose");
const { MONGO_URI } = require("./constants");

const connectMongo = async () => {
    const uri = MONGO_URI;

    try {
        console.log("📦 Connecting to MongoDB...");
        await mongoose.connect(uri);
        console.log("✅ MongoDB connected");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message);
        throw error;
    }
};

module.exports = { connectMongo };