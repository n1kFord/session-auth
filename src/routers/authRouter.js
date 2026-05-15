const { Router } = require("express");
const { body } = require("express-validator");

const { handleValidation } = require("../middlewares/validation");

const User = require("../models/User.js");

const { asyncHandler } = require("../utils/handler.js");

const { hashPassword, comparePassword } = require("../utils/hash.js");

const { getRandomUsername } = require("../utils/username.js");

const {
    regenerateSession,
    saveSession,
    destroySession
} = require("../utils/session.js");
const { regenerateCsrfToken } = require("../utils/csrf.js");

const authRouter = new Router();

authRouter.post(
    "/register",
    [
        body("email")
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Invalid email")
            .isLength({ max: 100 })
            .withMessage("Email cannot exceed 100 characters"),

        body("password")
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 6, max: 100 })
            .withMessage(
                "Password must be between 6 and 100 characters"
            ),

        body("confirmPassword")
            .notEmpty()
            .withMessage("Confirm password is required")
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error("Passwords do not match");
                }

                return true;
            }),

        body("username")
            .optional()
            .isLength({ min: 1, max: 30 })
            .withMessage(
                "Username must be between 1 and 30 characters"
            ),

        body("bio")
            .optional()
            .isLength({ max: 300 })
            .withMessage("Bio cannot exceed 300 characters"),
    ],
    handleValidation,
    asyncHandler(async (req, res) => {
        const { email, password, username, bio } = req.body || {};

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(409).json({
                msg: "this email is already in use",
            });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = new User({
            email,
            username: username ?? getRandomUsername(),
            bio: bio ?? "",
            password: hashedPassword,
        });

        await newUser.save();

        await regenerateSession(req);

        req.session.userId = newUser._id;

        const csrfToken = regenerateCsrfToken(req);

        await saveSession(req);

        return res.status(201).json({
            success: true,
            csrfToken: csrfToken
        });
    })
);

authRouter.post(
    "/login",
    [
        body("email")
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Invalid email")
            .isLength({ max: 100 })
            .withMessage("Email cannot exceed 100 characters"),
        body("password")
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 6, max: 100 })
            .withMessage(
                "Password must be between 6 and 100 characters"
            ),
    ],
    handleValidation,
    asyncHandler(async (req, res) => {
        const { email, password } = req.body || {};

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                msg: "invalid credentials",
            });
        }

        const isPasswordValid = await comparePassword(
            password,
            user.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                msg: "invalid credentials",
            });
        }

        await regenerateSession(req);

        req.session.userId = user._id;

        const csrfToken = regenerateCsrfToken(req);

        await saveSession(req);

        return res.status(200).json({
            success: true,
            csrfToken: csrfToken
        });
    })
);

authRouter.post(
    "/logout",
    asyncHandler(async (req, res) => {
        await destroySession(req);

        res.clearCookie("sessionId");

        return res.status(200).json({
            success: true,
        });
    })
);

module.exports = authRouter;