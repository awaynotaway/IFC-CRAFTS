const express = require("express");
const router = express.Router();

const upload = require(
    "../middleware/upload.middleware"
);

router.post(
    "/product-image",
    upload.single("image"),
    (req, res) => {

        return res.json({
            success: true,
            path:
                `/uploads/products/${req.file.filename}`
        });

    }
);

module.exports = router;
