const db = require("../config/db");

const CodeGenerator = require(
    "../services/codeGenerator.service"
);

const IntegrationHub = require(
    "../services/integrationHub.service"
);

class OrderController {

    async checkout(req, res) {

        try {

            const userId =
                req.user.userId;

            const [carts] =
                await db.execute(
                    `
                    SELECT *
                    FROM carts
                    WHERE user_id = ?
                    `,
                    [userId]
                );

            if (carts.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Cart not found."
                });

            }

            const cartId =
                carts[0].id;

            const [items] =
                await db.execute(
                    `
                    SELECT
                        cart_items.product_id,
                        cart_items.quantity,
                        products.product_name,
                        products.price
                    FROM cart_items
                    INNER JOIN products
                        ON cart_items.product_id = products.id
                    WHERE cart_items.cart_id = ?
                    `,
                    [cartId]
                );

            if (items.length === 0) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Cart is empty."
                });

            }

            let subtotal = 0;

            items.forEach(item => {

                subtotal +=
                    item.price *
                    item.quantity;

            });

            const vatRate = 12;

            const vatAmount =
                subtotal *
                (vatRate / 100);

            const totalAmount =
                subtotal +
                vatAmount;

            const [orderResult] =
                await db.execute(
                    `
                    INSERT INTO orders (
                        order_code,
                        user_id,
                        subtotal,
                        vat_rate,
                        vat_amount,
                        total_amount,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    `,
                    [
                        "TEMP",
                        userId,
                        subtotal,
                        vatRate,
                        vatAmount,
                        totalAmount,
                        "pending"
                    ]
                );

            const orderId =
                orderResult.insertId;

            const orderCode =
                CodeGenerator.generate(
                    "ORD",
                    orderId
                );

            await db.execute(
                `
                UPDATE orders
                SET order_code = ?
                WHERE id = ?
                `,
                [
                    orderCode,
                    orderId
                ]
            );

            for (const item of items) {

                const itemSubtotal =
                    item.price *
                    item.quantity;

                const [itemResult] =
                    await db.execute(
                        `
                        INSERT INTO order_items (
                            order_item_code,
                            order_id,
                            product_id,
                            quantity,
                            unit_price,
                            subtotal
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                        `,
                        [
                            "TEMP",
                            orderId,
                            item.product_id,
                            item.quantity,
                            item.price,
                            itemSubtotal
                        ]
                    );

                const orderItemId =
                    itemResult.insertId;

                const orderItemCode =
                    CodeGenerator.generate(
                        "OITEM",
                        orderItemId
                    );

                await db.execute(
                    `
                    UPDATE order_items
                    SET order_item_code = ?
                    WHERE id = ?
                    `,
                    [
                        orderItemCode,
                        orderItemId
                    ]
                );

            }

            await db.execute(
                `
                DELETE FROM cart_items
                WHERE cart_id = ?
                `,
                [cartId]
            );

            await IntegrationHub.processEvent(
                "ORDER_CREATED",
                {
                    userId,
                    orderCode
                }
            );

            return res.status(201).json({
                success: true,
                orderCode,
                subtotal,
                vatAmount,
                totalAmount,
                message:
                    "Order created successfully."
            });

        } catch (error) {

            console.error(
                "[OrderController][Checkout]",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message
            });

        }

    }

    async receiveOrder(req, res) {

    try {

        const userId =
            req.user.userId;

        const { id } =
            req.params;

        const [orders] =
            await db.execute(
                `
                SELECT *
                FROM orders
                WHERE id = ?
                `,
                [id]
            );

        if (orders.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Order not found."
            });

        }

        const order =
            orders[0];

        if (
            order.status !== "shipped"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Only shipped orders can be received."
            });

        }

        await db.execute(
            `
            UPDATE orders
            SET status = 'received'
            WHERE id = ?
            `,
            [id]
        );

        await IntegrationHub.processEvent(
            "ORDER_RECEIVED",
            {
                userId,
                orderCode:
                    order.order_code
            }
        );

        return res.status(200).json({
            success: true,
            message:
                "Order marked as received."
        });

    } catch (error) {

        console.error(
            "[OrderController][ReceiveOrder]",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to receive order."
        });

    }

}

async getOrders(req, res) {

    try {

        const userId =
            req.user.userId;

        const [orders] =
            await db.execute(
                `
                SELECT *
                FROM orders
                WHERE user_id = ?
                ORDER BY created_at DESC
                `,
                [userId]
            );

        return res.status(200).json({
            success: true,
            data: orders
        });

    } catch (error) {

        console.error(
            "[OrderController][GetOrders]",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch orders."
        });

    }

}

async getOrderById(req, res) {

    try {

        const userId =
            req.user.userId;

        const { id } =
            req.params;

        const [orders] =
            await db.execute(
                `
                SELECT *
                FROM orders
                WHERE id = ?
                AND user_id = ?
                `,
                [
                    id,
                    userId
                ]
            );

        if (orders.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Order not found."
            });

        }

        const [items] =
            await db.execute(
                `
                SELECT
                    order_items.order_item_code,
                    products.product_code,
                    products.product_name,
                    order_items.quantity,
                    order_items.unit_price,
                    order_items.subtotal
                FROM order_items
                INNER JOIN products
                    ON order_items.product_id = products.id
                WHERE order_items.order_id = ?
                `,
                [id]
            );

        return res.status(200).json({
            success: true,
            order:
                orders[0],
            items
        });

    } catch (error) {

        console.error(
            "[OrderController][GetOrderById]",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch order."
        });

    }

}

async shipOrder(req, res) {

    try {

        const { id } =
            req.params;

        const [orders] =
            await db.execute(
                `
                SELECT *
                FROM orders
                WHERE id = ?
                `,
                [id]
            );

        if (orders.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Order not found."
            });

        }

        const order =
            orders[0];

        if (
            order.status !==
            "processing"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Only processing orders can be shipped."
            });

        }

        await db.execute(
            `
            UPDATE orders
            SET status = 'shipped'
            WHERE id = ?
            `,
            [id]
        );

        await IntegrationHub.processEvent(
            "ORDER_SHIPPED",
            {
                adminId:
                    req.user.userId,
                userId:
                    order.user_id,
                orderCode:
                    order.order_code
            }
        );

        return res.status(200).json({
            success: true,
            message:
                "Order shipped successfully."
        });

    } catch (error) {

        console.error(
            "[OrderController][ShipOrder]",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to ship order."
        });

    }

}

}

module.exports =
    new OrderController();