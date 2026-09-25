const express = require("express");
const router = express.Router();

const CartController = require(
    "../controllers/cart.controller"
);

const authenticate = require(
    "../middleware/auth.middleware"
);

router.post(
    "/",
    authenticate,
    CartController.addToCart
);

router.put(
    "/:itemId",
    authenticate,
    CartController.updateQuantity
);

router.delete(
    "/:itemId",
    authenticate,
    CartController.removeItem
);

router.get(
    "/",
    authenticate,
    CartController.getCart
);

module.exports = router;