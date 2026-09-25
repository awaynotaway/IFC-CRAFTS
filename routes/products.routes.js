const express = require("express");
const router = express.Router();

const ProductController = require(
    "../controllers/products.controller"
);

const authenticate = require(
"../middleware/auth.middleware"
);

const authorize = require(
"../middleware/role.middleware"
);

router.get(
    "/",
    ProductController.getAll
);

router.get(
    "/:id",
    ProductController.getById
);

router.post(
    "/",
    authenticate,
    authorize("admin"),
    ProductController.create
);

router.put(
    "/:id",
    authenticate,
    authorize("admin"),
    ProductController.update
);

router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    ProductController.delete
);

module.exports = router;