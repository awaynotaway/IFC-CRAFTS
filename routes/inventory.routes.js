const express = require("express");

const router =
    express.Router();

const InventoryController =
    require(
        "../controllers/inventory.controller"
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
    "/transactions",
    authenticate,
    authorize("admin"),
    InventoryController.getTransactions
);

router.get(
    "/low-stock",
    authenticate,
    authorize("admin"),
    InventoryController.getLowStock
);

router.post(
    "/restock",
    authenticate,
    authorize("admin"),
    InventoryController.restock
);

module.exports = router;