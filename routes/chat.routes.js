const express = require("express");

const router =
    express.Router();

const ChatController =
    require(
        "../controllers/chat.controller"
    );

const authenticate =
    require(
        "../middleware/auth.middleware"
    );

router.get(
    "/",
    authenticate,
    ChatController.getChats
);

router.post(
    "/",
    authenticate,
    ChatController.createChat
);

router.get(
    "/:id/messages",
    authenticate,
    ChatController.getMessages
);

router.post(
    "/:id/messages",
    authenticate,
    ChatController.sendMessage
);

module.exports = router;