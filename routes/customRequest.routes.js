const express = require("express");
const upload =
require(
"../middleware/uploadReference.middleware"
);


const router =
    express.Router();

const authenticate =
    require(
        "../middleware/auth.middleware"
    );

const CustomRequestController =
    require(
        "../controllers/customRequest.controller"
    );


router.post(
"/",
authenticate,
upload.single(
"referenceImage"
),
CustomRequestController.create
);

router.get(
    "/:id",
    authenticate,
    CustomRequestController.getById
);

router.post(
    "/:id/quotation",
    authenticate,
    CustomRequestController.saveQuotation
);

router.put(
    "/:id/claim",
    authenticate,
    CustomRequestController.claimRequest
);

router.get(
    "/admin/custom-orders",
    authenticate,
    CustomRequestController.getCustomOrders
);

router.put(
    "/:id/reject",
    authenticate,
    CustomRequestController.rejectRequest
);
module.exports = router;