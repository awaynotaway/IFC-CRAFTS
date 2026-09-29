const express =
    require("express");

const router =
    express.Router();

const SettingsController =
    require(
        "../controllers/settings.controller"
    );

router.get(
    "/admins",
    SettingsController.getAdmins
);
router.post(
    "/admins",
    SettingsController.createAdmin
);
module.exports =
    router;