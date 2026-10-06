require("dotenv").config();
const path = require("path");

const express = require("express");
const cors = require("cors");
const customRequestRoutes =
    require(
        "./routes/customRequest.routes"
    );
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/products.routes");
const categoryRoutes = require("./routes/categories.routes");
const cartRoutes = require(
    "./routes/cart.routes"
);
const orderRoutes = require(
"./routes/orders.routes"
);
const paymentRoutes = require(
    "./routes/payments.routes"
);

const dashboardRoutes =
    require(
        "./routes/dashboard.routes"
    );
const reportRoutes =
    require(
        "./routes/report.routes"
    );

    const inventoryRoutes = require(
    "./routes/inventory.routes"
);

const notificationRoutes = require(
"./routes/notifications.routes"
);

const auditLogRoutes = require(
"./routes/auditLogs.routes"
);

const chatRoutes =
    require(
        "./routes/chat.routes"
    );

const reviewRoutes =
    require(
        "./routes/review.routes"
    );

    const userRoutes =
    require(
        "./routes/users.routes"
    );
const passport =
require("./config/passport");

const session =
require("express-session");
const app = express();

app.use(
    session({
        secret:
            process.env.JWT_SECRET,

        resave: false,

        saveUninitialized: false
    })
);

app.use(
    passport.initialize()
);

app.use(
    passport.session()
);

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(
    express.static(
        path.join(__dirname, "../frontend")
    )
);



app.use(
    "/api/cart",
    cartRoutes
);

app.use(
    "/api/orders",
    orderRoutes
);


app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "../frontend",
            "index.html"
        )
    );

});
``

app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/products",
    productRoutes
);

app.use(
    "/api/categories",
    categoryRoutes
);

app.use(
    "/api/payments",
    paymentRoutes
);

app.use(
    "/api/dashboard",
    dashboardRoutes
);

app.use(
    "/api/reports",
    reportRoutes
);

app.use(
    "/api/inventory",
    inventoryRoutes
);

app.use(
    "/api/notifications",
    notificationRoutes
);

app.use(
"/api/audit-logs",
auditLogRoutes
);

app.use(
    "/api/chats",
    chatRoutes
);

app.use(
    "/api/reviews",
    reviewRoutes
);


app.use(
    "/api/uploads",
    require("./routes/upload.routes")
);
const PORT = process.env.PORT || 5000;

app.use(
    "/api/users",
    userRoutes
);

const settingsRoutes =
    require("./routes/settings.routes");

app.use(
    "/api/settings",
    settingsRoutes
);

app.use(
    "/payment",
    express.static("payment")
);
``

app.use(
    "/api/custom-requests",
    customRequestRoutes
);



app.use(
    "/references",
    express.static(
        path.join(
            __dirname,
            "references"
        )
    )
);
app.listen(PORT, () => {

    console.log(
        `✅ Server running on port ${PORT}`
    );

});