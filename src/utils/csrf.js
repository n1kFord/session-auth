const crypto = require("crypto");

const generateCsrfToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

const getCsrfToken = (req) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = generateCsrfToken();
    }
    return req.session.csrfToken;
};

const regenerateCsrfToken = (req) => {
    req.session.csrfToken = generateCsrfToken();
    return req.session.csrfToken;
};

const verifyCsrfToken = (req) => {
    const clientToken = req.headers["x-xsrf-token"];
    const serverToken = req.session.csrfToken;
    
    if (!clientToken || !serverToken) {
        return false;
    }
    
    if (clientToken.length !== serverToken.length) {
        return false;
    }
    
    return crypto.timingSafeEqual(
        Buffer.from(clientToken, "utf8"),
        Buffer.from(serverToken, "utf8")
    );
};

module.exports = {
    generateCsrfToken,
    getCsrfToken,
    regenerateCsrfToken,
    verifyCsrfToken
};