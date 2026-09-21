const db = require("../config/db");

class NotificationService {

    async create(data) {

        try {

            const notificationCode =
                `NOTIF-${Date.now()}`;

            const query = `
                INSERT INTO notifications (
                    notification_code,
                    user_id,
                    title,
                    message
                )
                VALUES (?, ?, ?, ?)
            `;

            const [result] = await db.execute(
                query,
                [
                    notificationCode,
                    data.userId,
                    data.title,
                    data.message
                ]
            );

            return {
                success: true,
                notificationId: result.insertId
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