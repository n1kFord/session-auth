const { regenerateCsrfToken } = require("./csrf");

const regenerateSession = (req) => {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) {
                reject(err);
            } else {
                regenerateCsrfToken(req);
                resolve();
            }
        });
    });
};

const saveSession = (req) => {
    return new Promise((resolve, reject) => {
        req.session.save((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

const destroySession = (req) => {
    return new Promise((resolve, reject) => {
        req.session.destroy((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

module.exports = {
    regenerateSession,
    saveSession,
    destroySession
};