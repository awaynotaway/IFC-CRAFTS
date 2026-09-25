const db = require("../config/db");

const CodeGenerator = require(
    "../services/codeGenerator.service"
);

class ChatController {

    async createChat(req, res) {

        try {

            const customerId =
                req.user.userId;

            const { adminId } =
                req.body;

            const [existingChats] =
                await db.execute(
                    `
                    SELECT *
                    FROM chats
                    WHERE customer_id = ?
                    AND admin_id = ?
                    `,
                    [
                        customerId,
                        adminId
                    ]
                );

            if (
                existingChats.length > 0
            ) {

                return res.status(200).json({
                    success: true,
                    data:
                        existingChats[0]
                });

            }

            const [result] =
                await db.execute(
                    `
                    INSERT INTO chats (
                        chat_code,
                        customer_id,
                        admin_id
                    )
                    VALUES (?, ?, ?)
                    `,
                    [
                        "TEMP",
                        customerId,
                        adminId
                    ]
                );

            const chatId =
                result.insertId;

            const chatCode =
                CodeGenerator.generate(
                    "CHAT",
                    chatId
                );

            await db.execute(
                `
                UPDATE chats
                SET chat_code = ?
                WHERE id = ?
                `,
                [
                    chatCode,
                    chatId
                ]
            );

            return res.status(201).json({
                success: true,
                chatCode
            });

        } catch (error) {

            console.error(
                "[ChatController][CreateChat]",
                error
            );

            return res.status(500).json({
                success: false
            });

        }

    }

    async getChats(req, res) {

        try {

            const userId =
                req.user.userId;

            const [chats] =
                await db.execute(
                    `
                    SELECT *
                    FROM chats
                    WHERE customer_id = ?
                    OR admin_id = ?
                    ORDER BY updated_at DESC
                    `,
                    [
                        userId,
                        userId
                    ]
                );

            return res.status(200).json({
                success: true,
                data: chats
            });

        } catch (error) {

            console.error(
                "[ChatController][GetChats]",
                error
            );

            return res.status(500).json({
                success: false
            });

        }

    }

    async getMessages(req, res) {

        try {

            const { id } =
                req.params;

            const [messages] =
                await db.execute(
                    `
                    SELECT *
                    FROM messages
                    WHERE chat_id = ?
                    ORDER BY created_at ASC
                    `,
                    [id]
                );

            return res.status(200).json({
                success: true,
                data: messages
            });

        } catch (error) {

            console.error(
                "[ChatController][Messages]",
                error
            );

            return res.status(500).json({
                success: false
            });

        }

    }

    async sendMessage(req, res) {

        try {

            const senderId =
                req.user.userId;

            const { id } =
                req.params;

            const { message } =
                req.body;

            const [result] =
                await db.execute(
                    `
                    INSERT INTO messages (
                        message_code,
                        chat_id,
                        sender_id,
                        message
                    )
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        "TEMP",
                        id,
                        senderId,
                        message
                    ]
                );

            const messageId =
                result.insertId;

            const messageCode =
                CodeGenerator.generate(
                    "MSG",
                    messageId
                );

            await db.execute(
                `
                UPDATE messages
                SET message_code = ?
                WHERE id = ?
                `,
                [
                    messageCode,
                    messageId
                ]
            );

            await db.execute(
                `
                UPDATE chats
                SET updated_at = NOW()
                WHERE id = ?
                `,
                [id]
            );

            return res.status(201).json({
                success: true,
                messageCode
            });

        } catch (error) {

            console.error(
                "[ChatController][Send]",
                error
            );

            return res.status(500).json({
                success: false
            });

        }

    }

}

module.exports =
    new ChatController();