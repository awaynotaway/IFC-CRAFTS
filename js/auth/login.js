document.addEventListener(
    "DOMContentLoaded",
    () => {

        const loginForm =
            document.getElementById(
                "loginForm"
            );

        if (!loginForm) return;

        loginForm.addEventListener(
            "submit",
            async (e) => {

                e.preventDefault();

                const username =
                    document.getElementById(
                        "username"
                    ).value;

                const password =
                    document.getElementById(
                        "password"
                    ).value;

                try {

                    const response =
                        await fetch(
                            `${API_URL}/auth/login`,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body:
                                    JSON.stringify({
                                        username,
                                        password
                                    })
                            }
                        );

                    const result =
                        await response.json();

                    if (
                        result.success
                    ) {

                        localStorage.setItem(
                            "token",
                            result.token
                        );

                        localStorage.setItem(
                            "user",
                            JSON.stringify(
                                result.user
                            )
                        );

                        alert(
                            "Login successful!"
                        );

                        if (
                            result.user.role ===
                            "admin"
                        ) {

                            window.location.href =
    "http://localhost:5000/admin/adminDashboard.html";

                        } else {

                            window.location.href =
                                "user/userDashboard.html";

                        }

                    } else {

                        alert(
                            result.message
                        );

                    }

                } catch (error) {

                    console.error(
                        error
                    );

                    alert(
                        "Failed to connect to server."
                    );

                }

            }
        );

    }
);