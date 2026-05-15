const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middlewares/authenticate");
const User = require("../models/User");
const { asyncHandler } = require("../utils/handler");
const { destroySession } = require("../utils/session");
const { csrfProtection } = require("../middlewares/csrf");
const { handleValidation } = require("../middlewares/validation");
const { comparePassword, hashPassword } = require("../utils/hash");

const userRouter = new Router();

userRouter.use(authenticate);
userRouter.use(csrfProtection);

userRouter.get("/", (req, res) => {
    const { _id, ...userWithoutId } = req.user.toObject();
    res.status(200).json(userWithoutId);
});

userRouter.post(
    "/change-email", 
    [
        body("newEmail")
            .notEmpty()
            .withMessage("New email is required")
            .isEmail()
            .withMessage("Invalid new email")
            .isLength({ max: 100 })
            .withMessage("New email cannot exceed 100 characters"),
        
        body("password")
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 6, max: 100 })
            .withMessage("Password must be between 6 and 100 characters")
    ],
    handleValidation,
    asyncHandler(async (req, res) => {
        const { newEmail, password } = req.body || {};

        const emailExists = await User.findOne({ 
            email: newEmail,
            _id: { $ne: req.user._id }
        });

        if (emailExists) {
            return res.status(409).json({
                msg: "this email is already in use",
            });
        }

        const currentUser = await User.findById(req.user._id).select("+password");

        if (!currentUser) {
            await destroySession(req);

            return res.status(404).json({
                error: "user not found",
            });
        };

        const isPasswordValid = await comparePassword(
            password,
            currentUser.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                msg: "invalid password",
            });
        }

        currentUser.email = newEmail;
        await currentUser.save();

        await destroySession(req);
        res.clearCookie("sessionId");

        return res.status(200).json({
            success: true,
            msg: "email updated successfully. please login again with your new email"
        });
    })
);

userRouter.post(
    "/change-password", 
    [
        body("password")
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 6, max: 100 })
            .withMessage("Password must be between 6 and 100 characters"),
        body("newPassword")
            .notEmpty()
            .withMessage("New password is required")
            .isLength({ min: 6, max: 100 })
            .withMessage("New password must be between 6 and 100 characters")
            .custom((value, { req }) => {
                if (value === req.body.password) {
                    throw new Error("New password must be different from current password");
                };
                
                return true;
            }),
        body("confirmNewPassword")
            .notEmpty()
            .withMessage("Confirm new password is required")
            .isLength({ min: 6, max: 100 })
            .withMessage("Confirm new password must be between 6 and 100 characters")
            .custom((value, { req }) => {
                if (value !== req.body.newPassword) {
                    throw new Error("New passwords do not match");
                } 
                
                return true;
            }),
    ],
    handleValidation,
    asyncHandler(async (req, res) => {
        const { password, newPassword, confirmNewPassword } = req.body || {};

        const currentUser = await User.findById(req.user._id).select("+password");

        if (!currentUser) {
            await destroySession(req);

            return res.status(404).json({
                error: "user not found",
            });
        };

        const isPasswordValid = await comparePassword(
            password,
            currentUser.password
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                msg: "invalid password",
            });
        };

        currentUser.password = await hashPassword(newPassword);
        await currentUser.save();

        await destroySession(req);
        res.clearCookie("sessionId");

        return res.status(200).json({
            success: true,
            msg: "password updated successfully. please login again with your new password"
        });
    })
);

userRouter.post(
    "/change-username",
    [
        body("newUsername")
            .notEmpty()
            .withMessage("New username is required")
            .isLength({ min: 1, max: 30 })
            .withMessage(
                "Username must be between 1 and 30 characters"
            ),
    ],
    handleValidation,
    asyncHandler(async (req, res) => {
        const { newUsername } = req.body || {};

        req.user.username = newUsername;
        await req.user.save();

        return res.status(200).json({
            success: true,
            msg: "username updated successfully",
            username: newUsername
        });
    })
);

userRouter.post(
    "/change-bio",
    [
        body("newBio")
            .notEmpty()
            .withMessage("New bio is required")
            .isLength({ min: 1, max: 300 })
            .withMessage("Bio cannot exceed 300 characters")
    ],
    handleValidation,
    asyncHandler(async (req, res) => {
        const { newBio } = req.body || {};

        req.user.bio = newBio;
        await req.user.save();

        return res.status(200).json({
            success: true,
            msg: "bio updated successfully",
            bio: newBio
        });
    })
);

userRouter.delete("/", asyncHandler(async (req, res) => {
    await User.findByIdAndDelete(req.user._id);
    await destroySession(req);
    res.clearCookie("sessionId");

    return res.status(200).json({
        message: "User deleted successfully",
    });
}));

module.exports = userRouter;