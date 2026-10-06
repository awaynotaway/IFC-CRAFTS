console.log("VERIFY JS LOADED");

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const email =
    urlParams.get("email");

document.getElementById(
    "email"
).value = email || "";

document
.getElementById(
    "verifyBtn"
)
.addEventListener(
    "click",
    verifyEmail
);

async function verifyEmail() {

    const code =
        document
        .getElementById(
            "verificationCode"
        )
        .value
        .trim();

    const message =
        document.getElementById(
            "message"
        );

    if (!email) {

        message.style.color =
            "red";

        message.textContent =
            "Email not found.";

        return;

    }

    if (!code) {

        message.style.color =
            "red";

        message.textContent =
            "Enter verification code.";

        return;

    }

    try {

        const response =
            await fetch(
                "http://localhost:5000/api/auth/verify-email",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                        "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        code
                    })
                }
            );

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(
                result.message
            );

        }

        message.style.color =
            "green";

        message.textContent =
            "Email verified successfully. Redirecting to login...";

        setTimeout(() => {

            window.location.href =
                "login.html";

        }, 2000);

    }
    catch(error) {

        message.style.color =
            "red";

        message.textContent =
            error.message;

    }

}