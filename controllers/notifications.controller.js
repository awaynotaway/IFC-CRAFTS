const db = require("../config/db");

class NotificationController {
async markAllAsRead(req, res) {

    try {

        const userId =
            req.user.userId;

        await db.execute(
            `
            UPDATE notifications
            SET
                is_read = 1,
                read_at = NOW()
            WHERE user_id = ?
            AND is_read = 0
            `,
            [userId]
        );

        return res.json({
            success: true
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false
        });

    }

}
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