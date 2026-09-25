const db = require("../config/db");

class ReportController {

    async getSalesReport(req, res) {

        try {

            const [[sales]] =
                await db.execute(
                    `
                    SELECT
                        COUNT(*) totalOrders,
                        IFNULL(
                            SUM(total_amount),
                            0
                        ) totalRevenue
                    FROM orders
                    WHERE status = 'received'
                    `
                );

            return res.status(200).json({
                success: true,
                data: sales
            });

        } catch (error) {

            console.error(
                "[ReportController][Sales]",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch sales report."
            });

        }

    }

    async getTopProducts(req, res) {
 
try {
 
const [products] =
await db.execute(
`
SELECT
products.product_name,
SUM(order_items.quantity)
totalSold
FROM order_items
INNER JOIN products
ON order_items.product_id =
products.id
GROUP BY products.id
ORDER BY totalSold DESC
`
);
 
return res.status(200).json({
success: true,
data: products
});
 
} catch (error) {
 
console.error(error);
 
return res.status(500).json({
success: false
});
 
}
 
}

}

module.exports =
    new ReportController();