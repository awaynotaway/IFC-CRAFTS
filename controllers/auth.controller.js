const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const CodeGenerator = require(
    "../services/codeGenerator.service"
);
const IntegrationHub = require(
    "../services/integrationHub.service"
);

const EmailService =
require(
    "../services/email.service"
);

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

           const verificationCode =
String(
    Math.floor(
        100000 +
        Math.random() * 900000
    )
);

            const [userResult] = await db.execute(
                `
                INSERT INTO users (
    user_code,
    first_name,
    last_name,
    email,
    contact_number,
    address,
    verification_code,
    is_verified
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
               [
    `TEMP-${Date.now()}`,
    firstName,
    lastName,
    email,
    contactNumber,
    address,
    verificationCode,
    0
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
               
            const [accountResult] = await db.execute(
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
    `TEMP-${Date.now()}-${userId}`,
    userId,
    username,
    hashedPassword
]
    );

const accountId =
    accountResult.insertId;
            const accountCode =
                CodeGenerator.generate(
                    "ACC",
                    accountId
                );
            
                await db.execute(
                `
                UPDATE accounts
                SET account_code = ?
                WHERE id = ?
                `,
                [
                    accountCode,
                    accountId
                ]
            );

            await IntegrationHub.processEvent(
    "USER_REGISTERED",
    {
        userId,
        firstName,
        lastName
    }
);

await EmailService
.sendVerificationCode(
    email,
    verificationCode
);

            return res.status(201).json({
    success: true,
    verificationRequired: true,
    email,
    message:
        "Verification code sent to your email."
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
                    message:
                        "Username and password are required."
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
    users.contact_number,
    users.address,
users.role,
users.status,
users.is_verified
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

                if (
    !account.is_verified
) {

    return res.status(403).json({
        success: false,
        message:
            "Please verify your email first."
    });

}

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

            if (
    account.status === "banned"
) {

    return res.status(403).json({

        success: false,

        message:
            "Your account has been banned. Please contact the administrator."

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

            await IntegrationHub.processEvent(
                "USER_LOGGED_IN",
                {
                    userId: account.user_id,
                    username: account.username
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
    contact_number: account.contact_number,
    address: account.address,
    role: account.role
}

            });

        } catch (error) {

            console.error(
                "[AuthController][Login]",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to login."
            });

        }

    }

    async verifyEmail(
    req,
    res
) {

    try {

        const {
            email,
            code
        } = req.body;

        const [users] =
        await db.execute(
            `
            SELECT *
            FROM users
            WHERE email = ?
            `,
            [email]
        );

        if (
            users.length === 0
        ) {

            return res.status(404).json({
                success:false,
                message:"User not found."
            });

        }

        const user =
            users[0];

        if (
            user.verification_code !== code
        ) {

            return res.status(400).json({
                success:false,
                message:
                    "Invalid verification code."
            });

        }

        await db.execute(
            `
            UPDATE users
            SET
                is_verified = 1,
                verification_code = NULL
            WHERE id = ?
            `,
            [user.id]
        );

        return res.json({
            success:true,
            message:
                "Email verified successfully."
        });

    }
    catch(error) {

        console.error(error);

        return res.status(500).json({
            success:false
        });

    }

}

async googleLogin(
    req,
    res
) {

    try {

        const email =
            req.user.emails?.[0]?.value;

        const fullName =
            req.user.displayName || "";

        const names =
            fullName.split(" ");

        const firstName =
            names.shift() || "Google";

        const lastName =
            names.join(" ");

        const [users] =
        await db.execute(
            `
            SELECT *
            FROM users
            WHERE email = ?
            `,
            [email]
        );

        let user;

       if ( 
            users.length > 0
        ) {

            user =
                users[0];

        } else {
return res.redirect(
"http://localhost:5000/login.html?error=google_not_registered"
);
}

        const token =
        jwt.sign(
            {
                userId:
                    user.id,

                role:
                    user.role ||
                    "customer"
            },

            process.env.JWT_SECRET,

            {
                expiresIn:
                    "1d"
            }
        );

        return res.redirect(
    `http://localhost:5000/google-auth.html?token=${token}&firstName=${encodeURIComponent(
        user.first_name || firstName
    )}&lastName=${encodeURIComponent(
        user.last_name || lastName
    )}&email=${encodeURIComponent(email)}`
);


    }
    catch(error) {

        console.error(error);

        return res.redirect(
            "http://localhost:5000/login.html"
        );

    }

}

    async logout(req, res) {

        try {

            await IntegrationHub.processEvent(
                "USER_LOGGED_OUT",
                {
                    userId: req.user.userId,
                    username: req.user.username
                }
            );

            return res.status(200).json({
                success: true,
                message: "Logout successful."
            });

        } catch (error) {

            console.error(
                "[AuthController][Logout]",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to logout."
            });

        }

    }

    async forgotPassword(
    req,
    res
) {

    try {

        const {
            email
        } = req.body;

        const [users] =
        await db.execute(
            `
            SELECT *
            FROM users
            WHERE email = ?
            `,
            [email]
        );

        if (
            users.length === 0
        ) {

            return res.status(404).json({
                success:false,
                message:
                    "Email not found."
            });

        }

        const resetCode =
        String(
            Math.floor(
                100000 +
                Math.random() * 900000
            )
        );

        await db.execute(
            `
            UPDATE users
            SET reset_code = ?
            WHERE email = ?
            `,
            [
                resetCode,
                email
            ]
        );

        await EmailService
        .sendResetCode(
            email,
            resetCode
        );

        return res.json({
            success:true,
            message:
                "Reset code sent.",
            email
        });

    }
    catch(error) {

        console.error(error);

        return res.status(500).json({
            success:false
        });

    }

}

async verifyResetCode(
    req,
    res
) {

    try {

        const {
            email,
            code
        } = req.body;

        const [users] =
        await db.execute(
            `
            SELECT *
            FROM users
            WHERE email = ?
            AND reset_code = ?
            `,
            [
                email,
                code
            ]
        );

        if (
            users.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid reset code."
            });

        }

        return res.json({
            success: true
        });

    }
    catch(error) {

        console.error(error);

        return res.status(500).json({
            success: false
        });

    }

}

async resetPassword(
    req,
    res
) {

    try {

        const {
            email,
            password
        } = req.body;

        const [users] =
        await db.execute(
            `
            SELECT id
            FROM users
            WHERE email = ?
            `,
            [email]
        );

        if (
            users.length === 0
        ) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });

        }

        const userId =
            users[0].id;

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        await db.execute(
            `
            UPDATE accounts
            SET password = ?
            WHERE user_id = ?
            `,
            [
                hashedPassword,
                userId
            ]
        );

        await db.execute(
            `
            UPDATE users
            SET reset_code = NULL
            WHERE id = ?
            `,
            [userId]
        );

        return res.json({
            success: true,
            message:
                "Password updated successfully."
        });

    }
    catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Failed to reset password."
        });

    }

}

}



module.exports = new AuthController();