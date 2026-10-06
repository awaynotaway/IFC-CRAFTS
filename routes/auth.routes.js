const express = require("express");
const router = express.Router();

const AuthController = require(
    "../controllers/auth.controller"
);

const authenticate = require(
    "../middleware/auth.middleware"
);

const passport =
require("passport");

router.post(
    "/register",
    AuthController.register
);

router.post(
    "/login",
    AuthController.login
);

router.post(
    "/logout",
    authenticate,
    AuthController.logout
);

router.post(
    "/verify-email",
    AuthController.verifyEmail
);

router.get(
    "/google",

    passport.authenticate(
        "google",
        {
            scope: [
                "profile",
                "email"
            ]
        }
    )
);

router.get(
    "/google/callback",

    passport.authenticate(
        "google",
        {
            session: false
        }
    ),

    AuthController.googleLogin
);

router.post(
    "/forgot-password",
    AuthController.forgotPassword
);
router.post(
    "/verify-reset-code",
    AuthController.verifyResetCode
);

router.post(
    "/reset-password",
    AuthController.resetPassword
);
module.exports = router;