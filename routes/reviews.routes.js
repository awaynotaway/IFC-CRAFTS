const express = require("express");
const router = express.Router();

const {
  getReviews
} = require("../controllers/reviews.controller");

router.get("/", getReviews);

module.exports = router;