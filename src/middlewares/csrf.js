const { verifyCsrfToken } = require("../utils/csrf.js");

const csrfProtection = (req, res, next) => {
    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (safeMethods.includes(req.method)) {
        return next();
    }
    
    // verify token for unsafe methods (POST, PUT, DELETE, PATCH)
    if (!verifyCsrfToken(req)) {
        return res.status(403).json({
            error: "invalid csrf token"
        });
    }
    
    next();
};

module.exports = { csrfProtection };