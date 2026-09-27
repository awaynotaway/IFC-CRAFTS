const db = require("../config/db");
const CodeGenerator = require(
    "./codeGenerator.service"
);

class ReviewService {

    async create(data) {

        const [result] =
            await db.execute(
                `
                INSERT INTO reviews (
    review_code,
    order_id,
    user_id,
    product_id,
    reviewer_name,
    product_name,
    rating,
    review
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
//                 [
//     `TEMP-${Date.now()}`,
//     data.orderId,
//     data.userId,
//     data.productId,
//     data.reviewerName,
//     data.productName,
//     data.rating,
//     data.review
// ]
[
    `TEMP-${Date.now()}`,
    data.orderId || null,
    data.userId || null,
    data.productId || null,
    data.reviewerName || "Anonymous",
    data.productName || "Unknown Product",
    data.rating,
    data.review
]
            );

        const reviewId =
            result.insertId;

        const reviewCode =
            CodeGenerator.generate(
                "REV",
                reviewId
            );

        await db.execute(
            `
            UPDATE reviews
            SET review_code = ?
            WHERE id = ?
            `,
            [
                reviewCode,
                reviewId
            ]
        );

        return {
            success: true,
            reviewId,
            reviewCode
        };

    }

    async getAll() {

        const [reviews] =
            await db.execute(
                `
                SELECT
                    reviews.*,
                    users.first_name,
                    users.last_name
                FROM reviews
                INNER JOIN users
                    ON reviews.user_id = users.id
                ORDER BY reviews.id DESC
                `
            );

        return reviews;

    }

}

module.exports =
    new ReviewService();