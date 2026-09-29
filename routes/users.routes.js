const authenticate =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");

const express =
    require("express");

const router =
    express.Router();

const UserController =
    require(
        "../controllers/users.controller"
    );

router.put(
    "/:id/status",
    UserController.updateStatus
);

router.get(
    "/",
    UserController.getAll
);


module.exports =
    router;