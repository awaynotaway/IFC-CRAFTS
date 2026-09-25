const express = require("express");

const router =
    express.Router();

const AuditLogController =
    require(
        "../controllers/auditLogs.controller"
    );

const authenticate =
    require(
        "../middleware/auth.middleware"
    );

const authorize =
    require(
        "../middleware/role.middleware"
    );

router.get(
    "/",
    authenticate,
    authorize("admin"),
    AuditLogController.getLogs
);

module.exports = router;