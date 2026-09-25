const express = require("express");

const router =
    express.Router();

const NotificationController =
    require(
        "../controllers/notifications.controller"
    );

const authenticate =
    require(
        "../middleware/auth.middleware"
    );

router.get(
    "/",
    authenticate,
    NotificationController.getNotifications
);

module.exports = router;