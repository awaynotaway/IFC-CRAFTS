const express = require("express");
const router = express.Router();

const {
  getReviews
} = require("../controllers/reviews.controller");

router.get("/", getReviews);
router.get(
    "/",
    ReviewsController.getReviews
);

router.post(
    "/",
    authenticate,
    ReviewsController.createReview
);
module.exports = router;