const db = require("../config/db");
const CodeGenerator = require(
    "./codeGenerator.service"
);

class ReviewService {

    async create(data) {
console.log("SERVICE DATA:", data);
        const [result] =
            await db.execute(
                `
                INSERT INTO reviews (
    review_code,
    order_id,
    user_id,
    product_id,
    rating,
    review
)
VALUES (?, ?, ?, ?, ?, ?)
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
    r.*,

    u.first_name,
    u.last_name,

    p.product_name

FROM reviews r

LEFT JOIN users u
    ON u.id = r.user_id

LEFT JOIN products p
    ON p.id = r.product_id

ORDER BY r.created_at DESC
                `
            );

        return reviews;

    }

}

module.exports =
    new ReviewService();