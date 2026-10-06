const db = require("../config/db");

exports.getReviews = async (req, res) => {
const CodeGenerator = require(
    "../services/codeGenerator.service"
);

exports.createReview = async (
    req,
    res
) => {

    try {

        const userId =
            req.user.userId;

       const {
    orderId,
    productId,
    rating,
    review
} = req.body;

if (!productId) {

    return res.status(400).json({
        success: false,
        message: "Product ID is required."
    });

}

        const [orders] =
            await db.query(
                `
                SELECT *
                FROM orders
                WHERE id = ?
                AND user_id = ?
                AND status = 'received'
                `,
                [
                    orderId,
                    userId
                ]
            );

        if (
            orders.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Only received orders can be reviewed."
            });

        }

        const [existing] =
            await db.query(
                `
                SELECT id
                FROM reviews
                WHERE order_id = ?
                AND user_id = ?
                `,
                [
                    orderId,
                    userId
                ]
            );

        if (
            existing.length > 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "You already reviewed this order."
            });

        }

   



        const [result] =
            await db.query(
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
                [
                    "TEMP",
                    orderId,
                    userId,
                    productId,
                    rating,
                    review
                ]
            );

        const reviewCode =
            CodeGenerator.generate(
                "REV",
                result.insertId
            );

        await db.query(
            `
            UPDATE reviews
            SET review_code = ?
            WHERE id = ?
            `,
            [
                reviewCode,
                result.insertId
            ]
        );

        return res.status(201).json({
            success: true,
            message:
                "Review submitted successfully."
        });

    }
    catch(error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                error.message
        });

    }

};
  
  try {

    const [rows] = await db.query(`
      SELECT
          r.id,
          r.review_code,
          r.rating,
          r.review,
          r.created_at,

          CONCAT(
              u.first_name,
              ' ',
              u.last_name
          ) AS customer,

          CONCAT(
              LEFT(u.first_name,1),
              LEFT(u.last_name,1)
          ) AS initials,

          p.product_name,

          o.order_code

      FROM reviews r

      LEFT JOIN users u
      ON r.user_id = u.id

      LEFT JOIN products p
      ON r.product_id = p.id

      LEFT JOIN orders o
      ON r.order_id = o.id

      ORDER BY r.created_at DESC
    `);

    res.json(rows);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};