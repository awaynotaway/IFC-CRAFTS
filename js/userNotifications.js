async function loadUserNotifications() {

    try {

        const token =
            localStorage.getItem("token");

        const response =
            await fetch(
                "http://localhost:5000/api/notifications",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        console.log(
            "NOTIFICATIONS:",
            data
        );

        return data.data || [];

    }
    catch(error) {

        console.error(error);

        return [];

    }

}