const db = require("../config/db");

class DashboardService {

    async getStats() {

        const [
            totalOrdersResult
        ] = await db.execute(`
            SELECT COUNT(*) totalOrders
            FROM orders
        `);

        const [
            pendingOrdersResult
        ] = await db.execute(`
            SELECT COUNT(*) pendingOrders
            FROM orders
            WHERE status = 'pending'
        `);

        const [
            completedOrdersResult
        ] = await db.execute(`
            SELECT COUNT(*) completedOrders
            FROM orders
            WHERE status = 'completed'
        `);

        const [
            usersResult
        ] = await db.execute(`
            SELECT COUNT(*) totalUsers
            FROM users
            WHERE role = 'customer'
        `);

        const [
            pendingPaymentsResult
        ] = await db.execute(`
            SELECT COUNT(*) pendingPayments
            FROM payments
            WHERE payment_status = 'pending'
        `);

        const [
            recentOrders
        ] = await db.execute(`
            SELECT
                order_code,
                total_amount,
                status,
                customer_name
            FROM orders
            ORDER BY id DESC
            LIMIT 5
        `);

        return {
            totalOrders:
                totalOrdersResult[0]
                    .totalOrders,

            pendingOrders:
                pendingOrdersResult[0]
                    .pendingOrders,

            completedOrders:
                completedOrdersResult[0]
                    .completedOrders,

            totalUsers:
                usersResult[0]
                    .totalUsers,

            pendingPayments:
                pendingPaymentsResult[0]
                    .pendingPayments,

            recentOrders
        };
    }
}

module.exports =
    new DashboardService();