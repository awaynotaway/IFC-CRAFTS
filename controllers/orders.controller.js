const db = require("../config/db");

const CodeGenerator = require(
    "../services/codeGenerator.service"
);

const IntegrationHub = require(
    "../services/integrationHub.service"
);

const fs = require("fs");
const path = require("path");

class OrderController {

    static async getCustomOrders(req, res) {

  try {

    const orders =
      await OrderService.getCustomOrders();

    return res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }

}

    async updateOrderStatus(req, res) {

    try {

        const { id } =
            req.params;

        const { status } =
            req.body;

        await db.execute(
            `
            UPDATE orders
            SET status = ?
            WHERE id = ?
            `,
            [
                status.toLowerCase(),
                id
            ]
        );

        return res.status(200).json({
            success: true,
            message:
                "Order status updated."
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

}

    async checkout(req, res) {

        try {

            const userId =
                req.user.userId;

                const [userRows] =
    await db.execute(
        `
        SELECT
            first_name,
            last_name
        FROM users
        WHERE id = ?
        `,
        [userId]
    );

const customerName =
`${userRows[0].first_name} ${userRows[0].last_name}`;

const {
    proofOfPayment
} = req.body;
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

            for (const item of items) {

    const [productRows] =
        await db.execute(
            `
            SELECT stock_quantity
            FROM products
            WHERE id = ?
            `,
            [item.product_id]
        );

    if (
        productRows[0].stock_quantity <
        item.quantity
    ) {

        return res.status(400).json({
            success: false,
            message:
                `${item.product_name} has insufficient stock.`
        });

    }

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
                        `TEMP-${Date.now()}`,
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

                const [paymentResult] =
    await db.execute(
        `
        INSERT INTO payments (
            payment_code,
            order_id,
            amount,
            proof_of_payment,
            payment_status
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            "TEMP",
            orderId,
            totalAmount,
            proofOfPayment,
            "pending"
        ]
    );

const paymentId =
    paymentResult.insertId;

const paymentCode =
    CodeGenerator.generate(
        "PAY",
        paymentId
    );

await db.execute(
    `
    UPDATE payments
    SET payment_code = ?
    WHERE id = ?
    `,
    [
        paymentCode,
        paymentId
    ]
);
 const orderCode =
                CodeGenerator.generate(
                    "ORD",
                    orderId
                );
await db.execute(
`
INSERT INTO notifications (
    notification_code,
    user_id,
    title,
    message,
    is_read,
    type
)
VALUES (?, ?, ?, ?, ?, ?)
`,
[
    `NOTIF-PAY-${Date.now()}`,
    1,
    "Payment Submitted",
    `${customerName} submitted payment for Order ${orderCode} and watiting for Verification.`,
    0,
    "payments"
]
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
    `TEMP-${orderId}-${item.product_id}-${Math.random()}`,
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

              await db.execute(
`
UPDATE products
SET
    stock_quantity = GREATEST(stock_quantity - ?, 0),
    status =
        CASE
            WHEN stock_quantity - ? <= 0
            THEN 'out_of_stock'
            ELSE 'active'
        END
WHERE id = ?
`,
[
    item.quantity,
    item.quantity,
    item.product_id
]
);

await db.execute(
    `
    UPDATE products
    SET status =
        CASE
            WHEN stock_quantity <= 0
THEN 'out_of_stock'
            ELSE 'active'
        END
    WHERE id = ?
    `,
    [item.product_id]
);

            }

            await db.execute(
                `
                DELETE FROM cart_items
                WHERE cart_id = ?
                `,
                [cartId]
            );

            


await db.execute(
`
INSERT INTO notifications (
    notification_code,
    user_id,
    title,
    message,
    is_read,
    type
)
VALUES (?, ?, ?, ?, ?, ?)
`,
[
    `NOTIF-${Date.now()}`,
    userId,
    "Order Placed Successfully",
    `Your order ${orderCode} has been placed successfully.`,
    0,
    "order"
]
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

           const [userRows] =
await db.execute(
`
SELECT
    first_name,
    last_name
FROM users
WHERE id = ?
`,
[userId]
);

const customerName =
`${userRows[0].first_name} ${userRows[0].last_name}`;


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

        await db.execute(
    `
    INSERT INTO notifications (
        notification_code,
        user_id,
        title,
        message,
        is_read,
        type
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
        `NOTIF-${Date.now()}`,
        userId,
        "Order Completed",
        `Order ${order.order_code} has been marked as received.`,
        0,
        "order"
    ]
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

async getPendingOrders(req, res) {

    try {

        const userId =
            req.user.userId;

      const [orders] =
    await db.execute(
        `
        SELECT
            o.*,

            p.payment_status,

            SUM(
                oi.quantity
            ) AS quantity,

            GROUP_CONCAT(
                DISTINCT prod.product_name
                SEPARATOR ', '
            ) AS product_name,

            MAX(
                prod.product_image
            ) AS product_image,

            cr.request_type,
            cr.reference_image,

            o.delivery_method,
            o.delivery_link

        FROM orders o

        LEFT JOIN payments p
            ON p.order_id = o.id

        LEFT JOIN order_items oi
            ON oi.order_id = o.id

        LEFT JOIN products prod
            ON prod.id = oi.product_id

        LEFT JOIN custom_requests cr
            ON cr.id = o.custom_request_id

        WHERE o.user_id = ?
        AND o.status NOT IN (
            'received',
            'cancelled'
        )

        GROUP BY o.id

        ORDER BY o.created_at DESC
        `,
        [userId]
    );

        return res.status(200).json({
            success: true,
            data: orders
        });

    } catch(error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
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
        AND status IN (
            'received',
            'cancelled'
        )
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
              SELECT
    o.*,
    o.custom_request_id,

    o.delivery_method,
    o.delivery_link,

   CONCAT(
   u.first_name,
   ' ',
   u.last_name
) AS customer_name,

u.email,
u.contact_number,
u.address,

    pay.payment_status,
    pay.proof_of_payment,
   pay.verified_at,

    cr.request_code,
    cr.request_type,
    cr.description,
    cr.reference_image,
   cr.preferred_date,
    cr.additional_notes

FROM orders o

LEFT JOIN users u
    ON u.id = o.user_id
LEFT JOIN payments pay
    ON pay.order_id = o.id

LEFT JOIN custom_requests cr
    ON cr.id = o.custom_request_id

WHERE o.id = ?
                `,
                [
    id
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
    order_items.product_id,
    products.product_code,
    products.product_name,
    products.product_image,
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

            const uploadsDir = path.join(
    __dirname,
    "../uploads/products"
);

const existingFiles =
    fs.existsSync(uploadsDir)
        ? fs.readdirSync(uploadsDir)
        : [];

items.forEach(item => {

  

    if (!item.product_image) {
        return;
    }

    const dbFile =
        path.basename(
            item.product_image
        );

    const dbName =
    dbFile
        .substring(
            dbFile.indexOf("-") + 1
        )
        .toLowerCase();

const actualFile =
    existingFiles.find(file =>
        file
            .substring(
                file.indexOf("-") + 1
            )
            .toLowerCase() === dbName
    );

    if (actualFile) {

        item.product_image =
            `/uploads/products/${actualFile}`;

    }

      console.log(
"DB FILE:",
dbFile
);
 
console.log(
"MATCHED:",
actualFile
);

});

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

        await db.execute(
    `
    INSERT INTO notifications (
        notification_code,
        user_id,
        title,
        message,
        is_read,
        type
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
        `NOTIF-${Date.now()}`,
        order.user_id,
        "Order Shipped",
        `Your order ${order.order_code} is now on the way.`,
        0,
        "order"
    ]
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

async getAdminOrders(req, res) {

    try {

        const [orders] =
            await db.execute(`
                SELECT
    o.id,
    o.order_code,
    o.delivery_method,
    o.custom_request_id,
o.delivery_link,
        cr.request_code,
    cr.request_type,
    cr.preferred_date,
    cr.description,
    cr.reference_image,
    cr.additional_notes,

    CONCAT(
        u.first_name,
        ' ',
        u.last_name
    ) AS customer_name,

    u.email,

    GROUP_CONCAT(
        DISTINCT p.product_name
        SEPARATOR ', '
    ) AS product_name,

    MAX(p.product_image) AS product_image,

    SUM(oi.quantity) AS quantity,

    o.total_amount,
    o.status,

    pay.payment_status,
    pay.proof_of_payment,
    pay.verified_at,

    o.created_at

                FROM orders o

LEFT JOIN custom_requests cr
    ON cr.id = o.custom_request_id

LEFT JOIN users u
    ON u.id = o.user_id

                LEFT JOIN order_items oi
                    ON oi.order_id = o.id

                LEFT JOIN products p
                    ON p.id = oi.product_id
LEFT JOIN payments pay
    ON pay.order_id = o.id
                GROUP BY o.id

                ORDER BY o.created_at DESC
            `);

        return res.status(200).json({
            success: true,
            data: orders
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch orders."
        });

    }
}

async buyNow(req, res) {
    try {

        const userId =
            req.user.userId;
            const [userRows] =
await db.execute(
`
SELECT
    first_name,
    last_name
FROM users
WHERE id = ?
`,
[userId]
);

const customerName =
`${userRows[0].first_name} ${userRows[0].last_name}`;

        const {
productId,
quantity,
proofOfPayment
} = req.body;

        const [products] =
            await db.execute(
                `
                SELECT *
                FROM products
                WHERE id = ?
                `,
                [productId]
            );

        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const product =
            products[0];

           if (
    Number(product.stock_quantity) <
    Number(quantity)
) {

    return res.status(400).json({
        success: false,
        message:
            "Insufficient stock."
    });

}

        const subtotal =
            product.price * quantity;

        const vatRate = 12;

        const vatAmount =
            subtotal * 0.12;

        const totalAmount =
            subtotal + vatAmount;

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
                    `TEMP-${Date.now()}`,
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

        const [paymentResult] =
    await db.execute(
        `
        INSERT INTO payments (
            payment_code,
            order_id,
            amount,
            proof_of_payment,
            payment_status
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            "TEMP",
            orderId,
            totalAmount,
            proofOfPayment,
            "pending"
        ]
    );

const paymentId =
    paymentResult.insertId;

const paymentCode =
    CodeGenerator.generate(
        "PAY",
        paymentId
    );

await db.execute(
    `
    UPDATE payments
    SET payment_code = ?
    WHERE id = ?
    `,
    [
        paymentCode,
        paymentId
    ]
);

await db.execute(
`
INSERT INTO notifications (
    notification_code,
    user_id,
    title,
    message,
    is_read,
    type
)
VALUES (?, ?, ?, ?, ?, ?)
`,
[
    `NOTIF-PAY-${Date.now()}`,
    1,
   "Payment Submitted",
`${customerName} submitted payment for Order ${orderCode}.`,

    0,
    "payments"
]
);


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
    `TEMP-${orderId}-${Date.now()}`,
    orderId,
    productId,
    quantity,
    product.price,
    subtotal
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

await db.execute(
`
UPDATE products
SET
    stock_quantity = GREATEST(stock_quantity - ?, 0),
    status =
        CASE
            WHEN stock_quantity - ? <= 0
            THEN 'out_of_stock'
            ELSE 'active'
        END
WHERE id = ?
`,
[
    quantity,
    quantity,
    productId
]
);

await db.execute(
    `
    UPDATE products
    SET status =
        CASE
            WHEN stock_quantity <= 0
            THEN 'out_of_stock'
            ELSE 'active'
        END
    WHERE id = ?
    `,
    [productId]
);



await db.execute(
    `
    INSERT INTO notifications (
        notification_code,
        user_id,
        title,
        message,
        is_read,
        type
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
        `NOTIF-${Date.now()}`,
        userId,
        "Order Placed Successfully",
        `Your order ${orderCode} has been placed successfully.`,
        0,
        "order"
    ]
);

await db.execute(
`
INSERT INTO notifications (
    notification_code,
    user_id,
    title,
    message,
    is_read,
    type
)
VALUES (?, ?, ?, ?, ?, ?)
`,
[
    `NOTIF-ADMIN-${Date.now()}`,
    1,
    "New Order",
    `${customerName} placed Order ${orderCode}.`,
    0,
    "orders"
]
);

        return res.status(201).json({
    success: true,
    orderId,
    orderCode
});

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

async updatePaymentStatus(req, res) {

    try {

        const { id } = req.params;
        const { status } = req.body;

        await db.execute(
    `
    UPDATE payments
    SET
        payment_status = ?,
        verified_at =
            CASE
                WHEN ? = 'verified'
                THEN NOW()
                ELSE verified_at
            END,
        rejected_at =
            CASE
                WHEN ? = 'rejected'
                THEN NOW()
                ELSE rejected_at
            END
    WHERE order_id = ?
    `,
    [
        status.toLowerCase(),
        status.toLowerCase(),
        status.toLowerCase(),
        id
    ]
);

const [orders] =
    await db.execute(
        `
        SELECT *
        FROM orders
        WHERE id = ?
        `,
        [id]
    );

if (orders.length > 0) {

    const order =
        orders[0];

    if (
        status.toLowerCase() ===
        "verified"
    ) {

        await db.execute(
            `
            INSERT INTO notifications (
                notification_code,
                user_id,
                title,
                message,
                is_read,
                type
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                `NOTIF-${Date.now()}`,
                order.user_id,
                "Payment Verified",
                `Your payment for ${order.order_code} has been verified.`,
                0,
                "payment"
            ]
        );

    }

    if (
        status.toLowerCase() ===
        "rejected"
    ) {

        await db.execute(
            `
            INSERT INTO notifications (
                notification_code,
                user_id,
                title,
                message,
                is_read,
                type
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                `NOTIF-${Date.now()}`,
                order.user_id,
                "Payment Rejected",
                `Your payment for ${order.order_code} was rejected.`,
                0,
                "payment"
            ]
        );

    }

}


        return res.status(200).json({
            success: true,
            message: "Payment status updated."
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

}

async updateDelivery(
    req,
    res
) {

    try {

        const { id } =
            req.params;

        const {
            method,
            link
        } = req.body;

        await db.execute(
            `
            UPDATE orders
            SET
                delivery_method = ?,
                delivery_link = ?
            WHERE id = ?
            `,
            [
                method,
                link,
                id
            ]
        );

        return res.json({
            success: true,
            message:
                "Delivery information updated."
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

}

}

module.exports =
    new OrderController();