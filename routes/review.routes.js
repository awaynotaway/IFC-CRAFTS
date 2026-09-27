const express = require("express");

const router =
    express.Router();

const ReviewController =
    require(
        "../controllers/review.controller"
    );

const verifyToken =
    require(
        "../middleware/auth.middleware"
    );

router.get(
    "/",
    ReviewController.getAll
);

router.post(
    "/",
    verifyToken,
    ReviewController.create
);

module.exports =
    router;