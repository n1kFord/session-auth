const jsonOnlyMiddleware = (req, res, next) => {
    const methodsWithBody = ["POST", "PUT", "PATCH"];

    if (methodsWithBody.includes(req.method)) {
        const contentType = req.headers["content-type"];

        if (contentType && !req.is("application/json")) {
            return res.status(415).json({
                error: "Content-Type must be application/json",
            });
        }
    }

    next();
};

const jsonErrorMiddleware = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            error: "Invalid JSON format",
        });
    }

    next(err);
};

const fallbackErrorMiddleware = (err, req, res, next) => {
    const status = err.status || err.statusCode || 500;

    console.error(err);

    return res.status(status).json({
        error:
            status >= 500
                ? "Internal Server Error"
                : err.message || "Error",
    });
};

module.exports = { jsonOnlyMiddleware, jsonErrorMiddleware, fallbackErrorMiddleware };