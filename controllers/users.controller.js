const db = require("../config/db");

class UserController {

    async getAll(req, res) {

        try {

            const [users] =
                await db.execute(
                    `
                    SELECT *
                    FROM users
                    ORDER BY created_at DESC
                    `
                );

            return res.json({

                success: true,
                data: users

            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({

                success: false,
                message: "Failed to load users."

            });

        }

    }

    

async updateStatus(req, res) {

    try {

        const { id } = req.params;

        const { status } = req.body;

        await db.execute(
            `
            UPDATE users
            SET status = ?
            WHERE id = ?
            `,
            [
                status,
                id
            ]
        );

        return res.status(200).json({
            success: true,
            message: "User status updated."
        });

    } catch (error) {

        console.error(
            "[UserController][UpdateStatus]",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update user status."
        });

    }

}

}

module.exports =
    new UserController();