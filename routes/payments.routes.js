const express = require("express");

const router =
    express.Router();

const PaymentController = require(
    "../controllers/payments.controller"
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
    PaymentController.getPayments
);

router.post(
    "/",
    authenticate,
    PaymentController.submitPayment
);

router.put(
    "/:id/verify",
    authenticate,
    authorize("admin"),
    PaymentController.verifyPayment
);

router.put(
    "/:id/reject",
    authenticate,
    authorize("admin"),
    PaymentController.rejectPayment
);

module.exports = router;