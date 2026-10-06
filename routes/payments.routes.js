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

const paymentUpload =
    require(
        "../middleware/paymentUpload.middleware"
    );
router.get(
    "/",
    authenticate,
    PaymentController.getPayments
);

router.post(
    "/",
    authenticate,
    paymentUpload.single("proof"),
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

router.post(
    "/upload",
    authenticate,
    paymentUpload.single(
        "proof"
    ),
    (
        req,
        res
    ) => {

        return res.json({

            success: true,

            proofPath:
    req.file.path.replace(
        /\\/g,
        "/"
    )


        });

    }
);
module.exports = router;