const express = require("express");

const router =
    express.Router();

const ReportController = require(
    "../controllers/report.controller"
);

const authenticate = require(
    "../middleware/auth.middleware"
);

const authorize = require(
    "../middleware/role.middleware"
);

router.get(
    "/sales",
    authenticate,
    authorize("admin"),
    ReportController.getSalesReport
);

router.get(
    "/top-products",
    authenticate,
    authorize("admin"),
    ReportController.getTopProducts
);

module.exports = router;