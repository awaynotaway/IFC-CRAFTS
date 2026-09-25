const db = require("../config/db");

class DashboardController {

    async getDashboard(req, res) {

        try {

            const [[products]] =
                await db.execute(
                    `
                    SELECT COUNT(*) totalProducts
                    FROM products
                    `
                );

            const [[orders]] =
                await db.execute(
                    `
                    SELECT COUNT(*) totalOrders
                    FROM orders
                    `
                );

            const [[pendingOrders]] =
                await db.execute(
                    `
                    SELECT COUNT(*) pendingOrders
                    FROM orders
                    WHERE status = 'pending'
                    `
                );

            const [[revenue]] =
                await db.execute(
                    `
                    SELECT
                        IFNULL(
                            SUM(total_amount),
                            0
                        ) totalRevenue
                    FROM orders
                    WHERE status = 'received'
                    `
                );

            const [[lowStock]] =
                await db.execute(
                    `
                    SELECT COUNT(*) lowStockProducts
                    FROM products
                    WHERE stock_quantity <= 5
                    `
                );

            return res.status(200).json({
                success: true,
                data: {
                    totalProducts:
                        products.totalProducts,

                    totalOrders:
                        orders.totalOrders,

                    pendingOrders:
                        pendingOrders.pendingOrders,

                    totalRevenue:
                        revenue.totalRevenue,

                    lowStockProducts:
                        lowStock.lowStockProducts
                }
            });

        } catch (error) {

            console.error(
                "[DashboardController][GetDashboard]",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch dashboard."
            });

        }

    }

}

module.exports =
    new DashboardController();