const db = require("../config/db");
const bcrypt =
    require("bcrypt");

const CodeGenerator =
    require(
        "../services/codeGenerator.service"
    );
class SettingsController {

    async getAdmins(req, res) {

        try {

            const [admins] =
                await db.execute(`
                    SELECT

                        users.id,

                        CONCAT(
                            users.first_name,
                            ' ',
                            users.last_name
                        ) AS name,

                        users.email,

                        users.role,

                        users.status

                    FROM users

                    WHERE users.role = 'admin'

                    ORDER BY users.id ASC
                `);

            return res.json({
                success: true,
                data: admins
            });

        } catch (error) {

            console.error(error);

            return res.status(500).json({
                success: false,
                message: error.message
            });

        }

    }

    async createAdmin(req, res) {

    try {

const {
    fullName,
    email,
    username,
    contactNumber,
    address,
    password
} = req.body;

if (
    !fullName ||
    !email ||
    !username ||
    !contactNumber ||
    !address ||
    !password
){

            return res.status(400).json({
                success: false,
                message:
                    "All fields are required."
            });

        }

        const [existingEmail] =
            await db.execute(
                `
                SELECT id
                FROM users
                WHERE email = ?
                `,
                [email]
            );

            if (
    existingEmail.length > 0
) {

    return res.status(409).json({
        success: false,
        message:
            "Email already exists."
    });

}

const [existingContact] =
    await db.execute(
        `
        SELECT id
        FROM users
        WHERE contact_number = ?
        `,
        [contactNumber]
    );

if (
    existingContact.length > 0
) {

    return res.status(409).json({
        success: false,
        message:
            "Contact number already exists."
    });

}

const [existingUsername] =
    await db.execute(
        `
        SELECT id
        FROM accounts
        WHERE username = ?
        `,
        [username]
    );

if (
    existingUsername.length > 0
) {

    return res.status(409).json({
        success: false,
        message:
            "Username already exists."
    });

}
        const names =
            fullName.trim().split(" ");

        const firstName =
            names.shift();

        const lastName =
            names.join(" ") || "";

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        const [userResult] =
            await db.execute(
                `
                INSERT INTO users (
    user_code,
    first_name,
    last_name,
    email,
    contact_number,
    address,
    role,
    status
)
                VALUES (
    ?, ?, ?, ?, ?, ?, 'admin', 'active'
)
                `,
                [
    `TEMP-${Date.now()}`,
    firstName,
    lastName,
    email,
    contactNumber,
    address
]
            );

        const userId =
            userResult.insertId;

        const userCode =
            CodeGenerator.generate(
                "USR",
                userId
            );

        await db.execute(
            `
            UPDATE users
            SET user_code = ?
            WHERE id = ?
            `,
            [
                userCode,
                userId
            ]
        );


        const [accountResult] =
            await db.execute(
                `
                INSERT INTO accounts (
                    account_code,
                    user_id,
                    username,
                    password
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    `TEMP-${Date.now()}`,
                    userId,
                    username,
                    hashedPassword
                ]
            );

        const accountCode =
            CodeGenerator.generate(
                "ACC",
                accountResult.insertId
            );

        await db.execute(
            `
            UPDATE accounts
            SET account_code = ?
            WHERE id = ?
            `,
            [
                accountCode,
                accountResult.insertId
            ]
        );

        return res.status(201).json({
            success: true,
            message:
                "Admin account created."
        });

    }

    catch(error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                error.message
        });

    }

}

}

module.exports =
    new SettingsController();