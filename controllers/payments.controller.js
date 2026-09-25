const db = require("../config/db");

const CodeGenerator = require(
    "../services/codeGenerator.service"
);

const InventoryService = require(
    "../services/inventory.service"
);

const IntegrationHub = require(
    "../services/integrationHub.service"
);

class PaymentController {

    async submitPayment(req, res) {

        try {

            const userId =
                req.user.userId;

            const {
                orderId,
                proofOfPayment
            } = req.body;

            const [orders] =
                await db.execute(
                    `
                    SELECT *
                    FROM orders
                    WHERE id = ?
                    AND user_id = ?
                    `,
                    [
                        orderId,
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

            const order =
                orders[0];

            const [paymentResult] =
                await db.execute(
                    `
                    INSERT INTO payments (
                        payment_code,
                        order_id,
                        amount,
                        proof_of_payment
                    )
                    VALUES (?, ?, ?, ?)
                    `,
                    [
                        "TEMP",
                        orderId,
                        order.total_amount,
                        proofOfPayment
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

            await IntegrationHub.processEvent(
                "PAYMENT_SUBMITTED",
                {
                    userId,
                    paymentCode
                }
            );

            return res.status(201).json({
                success: true,
                paymentCode,
                message:
                    "Payment submitted successfully."
            });

        } catch (error) {

            console.error(
                "[PaymentController][SubmitPayment]",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message
            });

        }

    }
    
    async getPayments(req, res) {

    try {

        const userId =
            req.user.userId;

        const [payments] =
            await db.execute(
                `
                SELECT
                    payments.*,
                    orders.order_code
                FROM payments
                INNER JOIN orders
                    ON payments.order_id = orders.id
                WHERE orders.user_id = ?
                ORDER BY payments.created_at DESC
                `,
                [userId]
            );

        return res.status(200).json({
            success: true,
            data: payments
        });

    } catch (error) {

        console.error(
            "[PaymentController][GetPayments]",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch payments."
        });

    }

}

async verifyPayment(req, res) {

    try {

        const { id } =
            req.params;

        const [payments] =
            await db.execute(
                `
                SELECT
                    payments.*,
                    orders.user_id
                FROM payments
                INNER JOIN orders
                    ON payments.order_id = orders.id
                WHERE payments.id = ?
                `,
                [id]
            );

        if (payments.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Payment not found."
            });

        }

        const payment =
            payments[0];

        await db.execute(
            `
            UPDATE payments
            SET
                payment_status = 'verified',
                verified_at = NOW()
            WHERE id = ?
            `,
            [id]
        );

        await db.execute(
            `
            UPDATE orders
            SET status = 'processing'
            WHERE id = ?
            `,
            [payment.order_id]
        );
        console.log(
"INVENTORY CHECKPOINT"
);

        const [items] =
    await db.execute(
        `
        SELECT
            product_id,
            quantity
        FROM order_items
        WHERE order_id = ?
        `,
        [payment.order_id]
    );
console.log(items);
    for (const item of items) {

        await InventoryService.deductStock(
        item.product_id,
        item.quantity,
        payment.order_id
        );
    }

        await IntegrationHub.processEvent(
            "PAYMENT_VERIFIED",
            {
                adminId:
                    req.user.userId,
                userId:
                    payment.user_id,
                paymentCode:
                    payment.payment_code
            }
        );

        console.log({
    userId: payment.user_id,
    paymentCode: payment.payment_code
});

        return res.status(200).json({
            success: true,
            message:
                "Payment verified successfully."
        });

    } catch (error) {

        console.error(
            "[PaymentController][VerifyPayment]",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to verify payment."
        });

    }

}

async rejectPayment(req, res) {

    try {

        const { id } =
            req.params;

        const [payments] =
            await db.execute(
                `
                SELECT
                    payments.*,
                    orders.user_id
                FROM payments
                INNER JOIN orders
                    ON payments.order_id = orders.id
                WHERE payments.id = ?
                `,
                [id]
            );

        if (payments.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Payment not found."
            });

        }

        const payment =
            payments[0];

        await db.execute(
            `
            UPDATE payments
            SET
                payment_status = 'rejected',
                rejected_at = NOW()
            WHERE id = ?
            `,
            [id]
        );

        await IntegrationHub.processEvent(
            "PAYMENT_REJECTED",
            {
                userId:
                    payment.user_id,
                paymentCode:
                    payment.payment_code
            }
        );

        return res.status(200).json({
            success: true,
            message:
                "Payment rejected."
        });

    } catch (error) {

        console.error(
            "[PaymentController][RejectPayment]",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to reject payment."
        });

    }

}

}

module.exports =
    new PaymentController();