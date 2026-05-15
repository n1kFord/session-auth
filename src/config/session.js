const session = require("express-session");
const { redisClient } = require("./redis");
const { REDIS_SECRET } = require("./constants");

let store;
if (process.env.NODE_ENV === "test") {
    store = new session.MemoryStore();
} else {
    const { RedisStore } = require("connect-redis");
    store = new RedisStore({ client: redisClient });
}

const sessionMiddleware = session({
    store: store,
    secret: REDIS_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "sessionId",
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 1000 * 60 * 15,
    },
});

module.exports = sessionMiddleware;