require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

const {
    jsonOnlyMiddleware,
    jsonErrorMiddleware,
    fallbackErrorMiddleware,
} = require("./middlewares/fallback.js");

const sessionMiddleware = require("./config/session");
const { connectRedis } = require("./config/redis");
const { connectMongo } = require("./config/mongo");

const authRouter = require("./routers/authRouter");
const userRouter = require("./routers/userRouter.js");

// true when running normally (not in test mode)
const isNormalStart = require.main === module && process.env.NODE_ENV !== "test";

// CORS - allow all origins (for development)
app.use(cors({
    origin: true,
    credentials: true,
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: "Too many requests, please try again later" },
    skipSuccessfulRequests: false,
});

if (isNormalStart) app.use(limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { error: "Too many login attempts, please try again later" },
    skipSuccessfulRequests: true,
});

app.use(express.json());
app.use(jsonOnlyMiddleware);
app.use(jsonErrorMiddleware);

app.use(sessionMiddleware);

if (isNormalStart) app.use("/auth", authLimiter);
app.use("/auth", authRouter);
app.use("/me", userRouter);

app.use(fallbackErrorMiddleware);

const start = async () => {
    try {
        await connectRedis();
        await connectMongo();

        app.listen(process.env.PORT || 8080, () => {
            console.log("Server started");
        });
    } catch (err) {
        console.error("Startup error:", err.message);
        process.exit(1);
    }
};

if (isNormalStart) {
    start();
}

module.exports = app;