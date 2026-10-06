const authenticate =
    require("../middleware/auth.middleware");
    
const upload =
    require("../middleware/upload.middleware");

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
router.get(
"/profile",
authenticate,
UserController.getProfile
);

router.put(
"/profile",
authenticate,
UserController.updateProfile
);
router.put(
    "/:id/status",
    UserController.updateStatus
);

router.get(
    "/",
    UserController.getAll
);

router.post(
    "/profile-image",
    authenticate,
    upload.single("image"),
    UserController.uploadProfileImage
);
module.exports =
    router;