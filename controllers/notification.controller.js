const db = require("../config/db");

class NotificationController {

    async getAll(req, res) {

        try {

            const [notifications] =
                await db.execute(
                    `
                    SELECT *
                    FROM notifications
                    ORDER BY created_at DESC
                    `
                );

                console.log(
"NOTIFICATIONS:",
notifications
);

            return res.json({

                success: true,
                data: notifications

            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({

                success: false,
                message:
                    "Failed to load notifications."

            });

        }

    }

}

module.exports =
    new NotificationController();