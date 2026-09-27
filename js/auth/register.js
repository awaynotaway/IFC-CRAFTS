console.log("REGISTER JS LOADED");
async function registerUser(userData) {

    try {

        const response =
            await fetch(
                `${API_URL}/auth/register`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    },
                    body: JSON.stringify(
                        userData
                    )
                }
            );

        return await response.json();

    } catch (error) {

        console.error(
            "Register Error:",
            error
        );

        throw error;

    }

}

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const signupForm =
            document.getElementById(
                "signupForm"
            );

        if (!signupForm) return;

        signupForm.addEventListener(
            "submit",
            async (e) => {

                e.preventDefault();

                const firstName =
                    document.getElementById(
                        "firstname"
                    ).value;

                const lastName =
                    document.getElementById(
                        "lastname"
                    ).value;

                const username =
                    document.getElementById(
                        "username"
                    ).value;

                const email =
                    document.getElementById(
                        "email"
                    ).value;

                const contactNumber =
                    document.getElementById(
                        "contact"
                    ).value;

                const address =
                    document.getElementById(
                        "address"
                    ).value;

                const password =
                    document.getElementById(
                        "password"
                    ).value;

                const confirmPassword =
                    document.getElementById(
                        "confirm_password"
                    ).value;

                if (
                    password !==
                    confirmPassword
                ) {

                    alert(
                        "Passwords do not match."
                    );

                    return;

                }

                try {

                    const result =
                        await registerUser({
                            firstName,
                            lastName,
                            username,
                            email,
                            contactNumber,
                            address,
                            password
                        });

                    if (
                        result.success
                    ) {

                        alert(
                            "Registration successful!"
                        );

                        window.location.href =
                            "login.html";

                    } else {

                        alert(
                            result.message
                        );

                    }

                } catch (error) {

                    alert(
                        "Failed to connect to server."
                    );

                }

            }
        );

    }
);