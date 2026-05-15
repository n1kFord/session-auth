const User = require("../models/User");
const { destroySession } = require("../utils/session");

const authenticate = async (req, res, next) => {
    const userId = req.session?.userId;

    if (!userId) {
        return res.status(401).json({
            error: "Unauthorized",
        });
    }

    const user = await User.findById(userId).select("email username bio _id");

    if (!user) {
        destroySession(req);

        return res.status(401).json({
            error: "Unauthorized",
        });
    }

    req.user = user;

    next();
};

module.exports = { authenticate };