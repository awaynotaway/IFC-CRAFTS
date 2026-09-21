require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.get("/", (req, res) => {

    res.status(200).json({
        success: true,
        message: "IFC Crafts API is running."
    });

});

app.use(
    "/api/auth",
    authRoutes
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `✅ Server running on port ${PORT}`
    );

});