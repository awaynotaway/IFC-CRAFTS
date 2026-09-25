const express = require("express");

const router =
    express.Router();

const OrderController = require(
    "../controllers/orders.controller"
);

const authenticate = require(
    "../middleware/auth.middleware"
);

const authorize = require(
    "../middleware/role.middleware"
);

router.post(
    "/checkout",
    authenticate,
    OrderController.checkout
);

router.put(
    "/:id/receive",
    authenticate,
    OrderController.receiveOrder
);

router.get(
    "/",
    authenticate,
    OrderController.getOrders
);

router.get(
    "/:id",
    authenticate,
    OrderController.getOrderById
);

router.put(
    "/:id/ship",
    authenticate,
    authorize("admin"),
    OrderController.shipOrder
);

module.exports = router;