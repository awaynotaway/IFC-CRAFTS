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
console.log(
    "USER ID:",
    req.user.userId
);
            const userId =
                req.user.userId;

            const [chats] =
    await db.execute(
        `
        SELECT
            c.id,
            c.chat_code,
            c.customer_id,
            c.admin_id,
            c.updated_at,

            u.first_name,
            u.last_name,

            (
                SELECT message
                FROM messages m
                WHERE m.chat_id = c.id
                ORDER BY m.created_at DESC
                LIMIT 1
            ) AS last_message

        FROM chats c

        INNER JOIN users u
            ON u.id = c.customer_id

        WHERE c.customer_id = ?
        OR c.admin_id = ?

        ORDER BY c.updated_at DESC
        `,
        [
            userId,
            userId
        ]
    );

    console.log(
    "CHATS FOUND:",
    chats
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
                    SELECT
    m.*,
    u.first_name,
    u.last_name
FROM messages m

INNER JOIN users u
    ON u.id = m.sender_id

WHERE m.chat_id = ?

ORDER BY m.created_at ASC

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

                console.log("CHAT ID:", id);
console.log("SENDER ID:", senderId);
console.log("MESSAGE:", message);

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
    `TEMP-${Date.now()}`,
    id,
    senderId,
    message
]

                );
const [userRows] =
await db.execute(
`
SELECT
    first_name,
    last_name,
    role
FROM users
WHERE id = ?
`,
[senderId]
);

if (
    userRows.length > 0 &&
    userRows[0].role === "customer"
) {

    const customerName =
    `${userRows[0].first_name} ${userRows[0].last_name}`;

    await db.execute(
    `
    INSERT INTO notifications
    (
        notification_code,
        user_id,
        title,
        message,
        is_read,
        type
    )
    VALUES
    (
        ?, ?, ?, ?, ?, ?
    )
    `,
    [
        `NOTIF-${Date.now()}`,
        1,
        "New Message",
        `${customerName} sent a new message.`,
        0,
        "messages"
    ]
    );

}


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
    success: false,
    message: error.message
});
        }

    }

}

module.exports =
    new ChatController();