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

                const [[users]] =
    await db.execute(`
        SELECT COUNT(*) totalUsers
        FROM users
        WHERE role = 'customer'
    `);

            const [[pendingOrders]] =
                await db.execute(
                    `
                    SELECT COUNT(*) pendingOrders
                    FROM orders
                    WHERE status = 'pending'
                    `
                );
            const [[completedOrders]] =
    await db.execute(`
        SELECT COUNT(*) completedOrders
        FROM orders
        WHERE status = 'received'
    `);

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

                const [[pendingPayments]] =
    await db.execute(`
        SELECT COUNT(*) pendingPayments
        FROM payments
        WHERE payment_status = 'pending'
    `);

    const [[processingOrders]] =
    await db.execute(`
        SELECT COUNT(*) processingOrders
        FROM orders
        WHERE status = 'processing'
    `);

const [[cancelledOrders]] =
    await db.execute(`
        SELECT COUNT(*) cancelledOrders
        FROM orders
        WHERE status = 'cancelled'
    `);

    const [[shippedOrders]] =
    await db.execute(`
        SELECT COUNT(*) shippedOrders
        FROM orders
        WHERE status = 'shipped'
    `);

    const [recentOrders] =
    await db.execute(`
        SELECT
            o.order_code,

            CONCAT(
                u.first_name,
                ' ',
                u.last_name
            ) AS customer_name,

            GROUP_CONCAT(
                DISTINCT p.product_name
                SEPARATOR ', '
            ) AS product_name,

            o.total_amount,
            o.status

        FROM orders o

        LEFT JOIN users u
            ON o.user_id = u.id

        LEFT JOIN order_items oi
            ON oi.order_id = o.id

        LEFT JOIN products p
            ON p.id = oi.product_id

        GROUP BY o.id

        ORDER BY o.created_at DESC

        LIMIT 5
    `);
    const [ordersOverview] =
await db.execute(`
    SELECT
        MONTH(o.created_at) AS month,
        p.product_name,
        COUNT(*) AS total
    FROM orders o
    INNER JOIN order_items oi
        ON oi.order_id = o.id
    INNER JOIN products p
        ON p.id = oi.product_id
    GROUP BY
        MONTH(o.created_at),
        p.product_name
    ORDER BY
        MONTH(o.created_at)
`);

            return res.status(200).json({
                success: true,
                data: {
    totalProducts:
        products.totalProducts,

    totalUsers:
        users.totalUsers,

    totalOrders:
        orders.totalOrders,

    pendingOrders:
        pendingOrders.pendingOrders,

    completedOrders:
        completedOrders.completedOrders,

    totalRevenue:
        revenue.totalRevenue,

    lowStockProducts:
        lowStock.lowStockProducts,

    pendingPayments:
        pendingPayments.pendingPayments,

    processingOrders:
        processingOrders.processingOrders,

    cancelledOrders:
        cancelledOrders.cancelledOrders,

    shippedOrders:
        shippedOrders.shippedOrders,

    recentOrders,

    ordersOverview
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