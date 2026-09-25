const db = require("../config/db");

const CodeGenerator = require(
    "./codeGenerator.service"
);

class InventoryService {

    async deductStock(
        productId,
        quantity,
        orderCode
    ) {

        console.log(
    "DEDUCTING STOCK",
    productId,
    quantity
);

        await db.execute(
            `
            UPDATE products
            SET stock_quantity =
                stock_quantity - ?
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
                    "stock_out",
                    `Order ${orderCode}`
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

    }

}

module.exports =
    new InventoryService();