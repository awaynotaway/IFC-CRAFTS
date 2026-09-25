const express = require("express");
const router = express.Router();

const CategoryController = require(
    "../controllers/categories.controller"
);

const authenticate = require(
    "../middleware/auth.middleware"
);

const authorize = require(
    "../middleware/role.middleware"
);

router.get(
    "/",
    CategoryController.getAll
);

router.get(
    "/:id",
    CategoryController.getById
);

router.post(
    "/",
    authenticate,
    authorize("admin"),
    CategoryController.create
);

router.put(
    "/:id",
    authenticate,
    authorize("admin"),
    CategoryController.update
);

router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    CategoryController.delete
);

module.exports = router;