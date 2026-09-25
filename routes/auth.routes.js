const express = require("express");
const router = express.Router();

const AuthController = require(
    "../controllers/auth.controller"
);

const authenticate = require(
    "../middleware/auth.middleware"
);

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

module.exports = router;