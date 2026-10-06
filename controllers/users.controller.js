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
console.log("PROFILE DATA:", users[0]);
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
async getProfile(req, res) {
    try {

        const userId = req.user.userId;

        const [users] =
            await db.execute(
                `
                SELECT
                    id,
                    first_name,
                    last_name,
                    email,
                    contact_number,
                    address,
                    profile_image,
                    status
                FROM users
                WHERE id = ?
                `,
                [userId]
            );

        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {

        console.error(
            "[UserController][GetProfile]",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to load profile."
        });
    }
}

async updateProfile(req, res) {

    try {

        const userId = req.user.userId;

        const {
    first_name,
    last_name,
    email,
    contact_number,
    address,
    profile_image
} = req.body;

        await db.execute(
            `
            UPDATE users
SET
    first_name = ?,
    last_name = ?,
    email = ?,
    contact_number = ?,
    address = ?,
    profile_image = ?
WHERE id = ?
            `,
            [
    first_name,
    last_name,
    email,
    contact_number,
    address,
    profile_image,
    userId
]
        );

        return res.json({
            success: true,
            message: "Profile updated successfully."
        });

    } catch (error) {

        console.error(
            "[UserController][UpdateProfile]",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update profile."
        });
    }
}
async uploadProfileImage(req, res) {

    try {

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "No image uploaded."
            });

        }

        const imagePath =
            `/uploads/products/${req.file.filename}`;

        const userId =
            req.user.userId;

        await db.execute(
            `
            UPDATE users
            SET profile_image = ?
            WHERE id = ?
            `,
            [
                imagePath,
                userId
            ]
        );

        return res.json({
            success: true,
            path: imagePath
        });

    } catch (error) {

        console.error(
            "[UploadProfileImage]",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
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