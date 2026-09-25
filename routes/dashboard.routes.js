const express = require("express");

const router =
    express.Router();

const DashboardController = require(
    "../controllers/dashboard.controller"
);

const authenticate = require(
    "../middleware/auth.middleware"
);

const authorize = require(
    "../middleware/role.middleware"
);

router.get(
    "/",
    authenticate,
    authorize("admin"),
    DashboardController.getDashboard
);

module.exports = router;