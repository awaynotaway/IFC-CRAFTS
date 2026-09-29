const db = require("../config/db");

exports.getReviews = async (req, res) => {
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