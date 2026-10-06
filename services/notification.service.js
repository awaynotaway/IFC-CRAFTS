const db = require("../config/db");
const CodeGenerator = require(
"./codeGenerator.service"
);

class NotificationService {

    async create(data) {

    try {

        const [result] =
            await db.execute(
                `
                INSERT INTO notifications (
                    notification_code,
                    user_id,
                    title,
                    message
                )
                VALUES (?, ?, ?, ?)
                `,
                [
    `TEMP-${Date.now()}`,
    data.userId,
    data.title,
    data.message
]
            );

        const notificationId =
            result.insertId;

        const notificationCode =
            CodeGenerator.generate(
                "NOTIF",
                notificationId
            );

        await db.execute(
            `
            UPDATE notifications
            SET notification_code = ?
            WHERE id = ?
            `,
            [
                notificationCode,
                notificationId
            ]
        );

        return {
            success: true,
            notificationId,
            notificationCode
        };

    } catch (error) {

        console.error(
            "[NotificationService]",
            error
        );

        throw new Error(
            "Failed to create notification."
        );

    }

}
}

module.exports = new NotificationService();