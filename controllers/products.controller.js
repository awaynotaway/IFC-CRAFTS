const db = require("../config/db");

const CodeGenerator = require(
    "../services/codeGenerator.service"
);

const IntegrationHub = require(
"../services/integrationHub.service"
);

class ProductController {

    async getAll(req, res) {

        try {

            const [products] = await db.execute(
                `
                SELECT *
                FROM products
                ORDER BY created_at DESC
                `
            );

            return res.status(200).json({
                success: true,
                data: products
            });

        } catch (error) {

            console.error(
                "[ProductController][GetAll]",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch products."
            });

        }

    }

    async getById(req, res) {

        try {

            const { id } = req.params;

            const [products] = await db.execute(
                `
                SELECT *
                FROM products
                WHERE id = ?
                `,
                [id]
            );

            if (products.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Product not found."
                });

            }

            return res.status(200).json({
                success: true,
                data: products[0]
            });

        } catch (error) {

            console.error(
                "[ProductController][GetById]",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch product."
            });

        }

    }

    async create(req, res) {

        try {

            const {
                categoryId,
                productName,
                description,
                price,
                stockQuantity,
                productImage,
                status
            } = req.body;

            const [result] = await db.execute(
                `
                INSERT INTO products (
                    product_code,
                    category_id,
                    product_name,
                    description,
                    price,
                    stock_quantity,
                    product_image,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    "TEMP",
                    categoryId,
                    productName,
                    description,
                    price,
                    stockQuantity,
                    productImage,
                    status
                ]
            );

            const productId =
                result.insertId;

            const productCode =
                CodeGenerator.generate(
                    "PROD",
                    productId
                );

            await db.execute(
                `
                UPDATE products
                SET product_code = ?
                WHERE id = ?
                `,
                [
                    productCode,
                    productId
                ]
            );

            await IntegrationHub.processEvent(
    "PRODUCT_CREATED",
    {
        userId: req.user.userId,
        productId,
        productName
    }
);

            return res.status(201).json({
                success: true,
                productId,
                productCode,
                message:
                    "Product created successfully."
            });

        } catch (error) {

            console.error(
                "[ProductController][Create]",
                error
            );

            return res.status(500).json({
                success: false,
                message: error.message
            });

        }

    }

    async update(req, res) {

        try {

            const { id } = req.params;

            const {
                categoryId,
                productName,
                description,
                price,
                stockQuantity,
                productImage,
                status
            } = req.body;
const [products] = await db.execute(
    `
    SELECT product_name
    FROM products
    WHERE id = ?
    `,
    [id]
);

const oldProductName =
    products[0].product_name;
            await db.execute(
                `
                UPDATE products
                SET
                    category_id = ?,
                    product_name = ?,
                    description = ?,
                    price = ?,
                    stock_quantity = ?,
                    product_image = ?,
                    status = ?
                WHERE id = ?
                `,
                [
                    categoryId,
                    productName,
                    description,
                    price,
                    stockQuantity,
                    productImage,
                    status,
                    id
                ]
            );

            await IntegrationHub.processEvent(
    "PRODUCT_UPDATED",
    {
        userId: req.user.userId,
        productId: id,
        oldProductName,
        newProductName: productName
    }
);

            return res.status(200).json({
                success: true,
                message:
                    "Product updated successfully."
            });

        } catch (error) {

            console.error(
                "[ProductController][Update]",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to update product."
            });

        }

    }

    async delete(req, res) {

        try {

            const { id } = req.params;
const [products] = await db.execute(
    `
    SELECT product_name
    FROM products
    WHERE id = ?
    `,
    [id]
);

const productName =
    products[0].product_name;

            await db.execute(
                `
                DELETE FROM products
                WHERE id = ?
                `,
                [id]
            );

await IntegrationHub.processEvent(
    "PRODUCT_DELETED",
    {
        userId: req.user.userId,
        productId: id,
        productName
    }
);


            return res.status(200).json({
                success: true,
                message:
                    "Product deleted successfully."
            });

        } catch (error) {

            console.error(
                "[ProductController][Delete]",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to delete product."
            });

        }

    }

}

module.exports = new ProductController();