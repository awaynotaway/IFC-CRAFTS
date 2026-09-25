const db = require("../config/db");
const CodeGenerator = require(
    "../services/codeGenerator.service"
);
const IntegrationHub = require(
    "../services/integrationHub.service"
);

class InventoryController {

    async getTransactions(req, res) {

        try {

            const [transactions] =
                await db.execute(
                    `
                    SELECT
                        inventory_transactions.*,
                        products.product_name
                    FROM inventory_transactions
                    INNER JOIN products
                        ON inventory_transactions.product_id =
                        products.id
                    ORDER BY inventory_transactions.id DESC
                    `
                );

            return res.status(200).json({
                success: true,
                data: transactions
            });

        } catch (error) {

            console.error(
                "[InventoryController][Transactions]",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch transactions."
            });

        }

    }

    async getLowStock(req, res) {

        try {

            const [products] =
                await db.execute(
                    `
                    SELECT *
                    FROM products
                    WHERE stock_quantity <= 5
                    ORDER BY stock_quantity ASC
                    `
                );

            return res.status(200).json({
                success: true,
                data: products
            });

        } catch (error) {

            console.error(
                "[InventoryController][LowStock]",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch low stock products."
            });

        }

    }

    async restock(req, res) {

        try {

            const {
                productId,
                quantity
            } = req.body;
const [products] =
    await db.execute(
        `
        SELECT product_name
        FROM products
        WHERE id = ?
        `,
        [productId]
    );

if (products.length === 0) {

    return res.status(404).json({
        success: false,
        message:
            "Product not found."
    });

}

const productName =
    products[0].product_name;

            await db.execute(
                `
                UPDATE products
                SET stock_quantity =
                    stock_quantity + ?
                WHERE id = ?
                `,
                [
                    quantity,
                    productId
                ]
            );

            const [result] =
                await db.execute(
                    `
                    INSERT INTO inventory_transactions (
                        transaction_code,
                        product_id,
                        quantity,
                        transaction_type,
                        remarks
                    )
                    VALUES (?, ?, ?, ?, ?)
                    `,
                    [
                        "TEMP",
                        productId,
                        quantity,
                        "stock_in",
                        "Manual Restock"
                    ]
                );

            const transactionId =
                result.insertId;

            const transactionCode =
                CodeGenerator.generate(
                    "INVT",
                    transactionId
                );

            await db.execute(
                `
                UPDATE inventory_transactions
                SET transaction_code = ?
                WHERE id = ?
                `,
                [
                    transactionCode,
                    transactionId
                ]
            );

            await IntegrationHub.processEvent(
    "PRODUCT_RESTOCKED",
    {
        adminId:
            req.user.userId,
        productName,
        quantity
    }
);

            return res.status(200).json({
                success: true,
                message:
                    "Product restocked successfully."
            });

        } catch (error) {

            console.error(
                "[InventoryController][Restock]",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to restock product."
            });

        }

    }

}

module.exports =
    new InventoryController();