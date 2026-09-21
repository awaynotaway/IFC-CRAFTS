const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

class AuthController {

    async register(req, res) {

        try {

            const {
                firstName,
                lastName,
                email,
                contactNumber,
                address,
                username,
                password
            } = req.body;

            if (
                !firstName ||
                !lastName ||
                !email ||
                !contactNumber ||
                !address ||
                !username ||
                !password
            ) {

                return res.status(400).json({
                    success: false,
                    message: "All fields are required."
                });

            }

            const [existingEmail] = await db.execute(
                `
                SELECT id
                FROM users
                WHERE email = ?
                `,
                [email]
            );

            if (existingEmail.length > 0) {

                return res.status(409).json({
                    success: false,
                    message: "Email already exists."
                });

            }

            const [existingUsername] = await db.execute(
                `
                SELECT id
                FROM accounts
                WHERE username = ?
                `,
                [username]
            );

            if (existingUsername.length > 0) {

                return res.status(409).json({
                    success: false,
                    message: "Username already exists."
                });

            }

            const hashedPassword =
                await bcrypt.hash(password, 10);

            const userCode =
                `USR-${Date.now()}`;

            const [userResult] = await db.execute(
                `
                INSERT INTO users (
                    user_code,
                    first_name,
                    last_name,
                    email,
                    contact_number,
                    address
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    userCode,
                    firstName,
                    lastName,
                    email,
                    contactNumber,
                    address
                ]
            );

            const userId =
                userResult.insertId;

            const accountCode =
                `ACC-${Date.now()}`;

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
                    accountCode,
                    userId,
                    username,
                    hashedPassword
                ]
            );

            return res.status(201).json({
                success: true,
                message: "Account registered successfully."
            });

        } catch (error) {

            console.error(
                "[AuthController][Register]",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to register."
            });

        }

    }

    async login(req, res) {

        try {

            const {
                username,
                password
            } = req.body;

            if (
                !username ||
                !password
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Username and password are required."
                });

            }

            const [accounts] = await db.execute(
                `
                SELECT
                    accounts.id,
                    accounts.user_id,
                    accounts.username,
                    accounts.password,
                    users.first_name,
                    users.last_name,
                    users.email,
                    users.role,
                    users.status
                FROM accounts
                INNER JOIN users
                    ON accounts.user_id = users.id
                WHERE accounts.username = ?
                `,
                [username]
            );

            if (accounts.length === 0) {

                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials."
                });

            }

            const account =
                accounts[0];

            const isPasswordValid =
                await bcrypt.compare(
                    password,
                    account.password
                );

            if (!isPasswordValid) {

                return res.status(401).json({
                    success: false,
                    message: "Invalid credentials."
                });

            }

            const token = jwt.sign(
                {
                    userId: account.user_id,
                    username: account.username,
                    role: account.role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1d"
                }
            );

            return res.status(200).json({
                success: true,
                message: "Login successful.",
                token,
                user: {
                    id: account.user_id,
                    username: account.username,
                    firstName: account.first_name,
                    lastName: account.last_name,
                    email: account.email,
                    role: account.role
                }
            });

        } catch (error) {

    console.error(
        "[AuthController][Register]",
        error
    );

    return res.status(500).json({
        success: false,
        message: error.message,
        error
    });

}
    }

}

module.exports = new AuthController();