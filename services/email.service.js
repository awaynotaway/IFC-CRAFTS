const nodemailer =
require("nodemailer");

const transporter =
nodemailer.createTransport({
    service: "gmail",

    auth: {
        user:
            process.env.EMAIL_USER,

        pass:
            process.env.EMAIL_PASS
    }
});

async function sendVerificationCode(
    email,
    code
) {

    await transporter.sendMail({

        from:
            process.env.EMAIL_USER,

        to:
            email,

        subject:
            "IFC Crafts Verification Code",

        html: `
            <h2>Verify Your Account</h2>

            <p>
                Verification Code:
            </p>

            <h1>${code}</h1>
        `
    });

}

async function sendResetCode(
    email,
    code
) {

    await transporter.sendMail({
        from:
            process.env.EMAIL_USER,

        to: email,

        subject:
            "IFC Crafts Password Reset",

        html: `
            <h2>Password Reset</h2>
            <p>Your reset code is:</p>
            <h1>${code}</h1>
        `
    });

}


module.exports = {
    sendVerificationCode,
    sendResetCode
};