const db = require("../config/db");

class NotificationController {

    async getNotifications(req, res) {

        try {

            const userId =
                req.user.userId;

            const [notifications] =
                await db.execute(
                    `
                    SELECT *
                    FROM notifications
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    `,
                    [userId]
                );

            return res.status(200).json({
                success: true,
                data: notifications
            });

        } catch (error) {

            console.error(
                "[NotificationController]",
                error
            );

            return res.status(500).json({
                success: false
            });

        }

    }

}

module.exports =
    new NotificationController();