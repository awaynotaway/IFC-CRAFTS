const db = require("../config/db");

const CodeGenerator = require(
    "../services/codeGenerator.service"
);

const IntegrationHub = require(
    "../services/integrationHub.service"
);

class CartController {

    async addToCart(req, res) {

        try {

            const userId =
                req.user.userId;

            const {
                productId,
                quantity
            } = req.body;

            const [products] = await db.execute(
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

            let [carts] = await db.execute(
                `
                SELECT *
                FROM carts
                WHERE user_id = ?
                `,
                [userId]
            );

            let cartId;

            if (carts.length === 0) {

                const [cartResult] =
                    await db.execute(
                        `
                        INSERT INTO carts (
                            cart_code,
                            user_id
                        )
                        VALUES (?, ?)
                        `,
                        [
                            "TEMP",
                            userId
                        ]
                    );

                cartId =
                    cartResult.insertId;

                const cartCode =
                    CodeGenerator.generate(
                        "CART",
                        cartId
                    );

                await db.execute(
                    `
                    UPDATE carts
                    SET cart_code = ?
                    WHERE id = ?
                    `,
                    [
                        cartCode,
                        cartId
                    ]
                );

            } else {

                cartId =
                    carts[0].id;

            }

            const [existingItems] =
                await db.execute(
                    `
                    SELECT *
                    FROM cart_items
                    WHERE cart_id = ?
                    AND product_id = ?
                    `,
                    [
                        cartId,
                        productId
                    ]
                );

            if (
                existingItems.length > 0
            ) {

                await db.execute(
                    `
                    UPDATE cart_items
                    SET quantity =
                        quantity + ?
                    WHERE id = ?
                    `,
                    [
                        quantity,
                        existingItems[0].id
                    ]
                );

            } else {

                const [itemResult] =
                    await db.execute(
                        `
                        INSERT INTO cart_items (
                            cart_item_code,
                            cart_id,
                            product_id,
                            quantity
                        )
                        VALUES (?, ?, ?, ?)
                        `,
                        [
                            "TEMP",
                            cartId,
                            productId,
                            quantity
                        ]
                    );

                const itemId =
                    itemResult.insertId;

                const itemCode =
                    CodeGenerator.generate(
                        "CITEM",
                        itemId
                    );

                await db.execute(
                    `
                    UPDATE cart_items
                    SET cart_item_code = ?
                    WHERE id = ?
                    `,
                    [
                        itemCode,
                        itemId
                    ]
                );

            }

            await IntegrationHub.processEvent(
                "ADD_TO_CART",
                {
                    userId,
                    productName:
                        product.product_name
                }
            );

            return res.status(200).json({
                success: true,
                message:
                    "Product added to cart."
            });

        } catch (error) {

            console.error(
                "[CartController][AddToCart]",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message
            });

        }

    }

    async getCart(req, res) {

        try {

            const userId =
                req.user.userId;

            const [items] =
                await db.execute(
                    `
                    SELECT
                        cart_items.id,
                        cart_items.cart_item_code,
                        products.product_code,
                        products.product_name,
                        products.price,
                        cart_items.quantity
                    FROM cart_items
                    INNER JOIN carts
                        ON cart_items.cart_id = carts.id
                    INNER JOIN products
                        ON cart_items.product_id = products.id
                    WHERE carts.user_id = ?
                    `,
                    [userId]
                );

            return res.status(200).json({
                success: true,
                data: items
            });

        } catch (error) {

            console.error(
                "[CartController][GetCart]",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch cart."
            });

        }

    }

    async updateQuantity(req, res) {

    try {

        const userId =
            req.user.userId;

        const { itemId } =
            req.params;

        const { quantity } =
            req.body;

        const [items] =
            await db.execute(
                `
                SELECT
                    cart_items.id,
                    cart_items.quantity,
                    products.product_name
                FROM cart_items
                INNER JOIN products
                    ON cart_items.product_id = products.id
                WHERE cart_items.id = ?
                `,
                [itemId]
            );

        if (items.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Cart item not found."
            });

        }

        const oldQuantity =
            items[0].quantity;

        const productName =
            items[0].product_name;

        await db.execute(
            `
            UPDATE cart_items
            SET quantity = ?
            WHERE id = ?
            `,
            [
                quantity,
                itemId
            ]
        );

        await IntegrationHub.processEvent(
            "UPDATE_CART_ITEM",
            {
                userId,
                productName,
                oldQuantity,
                newQuantity: quantity
            }
        );

        return res.status(200).json({
            success: true,
            message:
                "Cart quantity updated."
        });

    } catch (error) {

        console.error(
            "[CartController][UpdateQuantity]",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update quantity."
        });

    }

}

async removeItem(req, res) {

    try {

        const userId =
            req.user.userId;

        const { itemId } =
            req.params;

        const [items] =
            await db.execute(
                `
                SELECT
                    products.product_name
                FROM cart_items
                INNER JOIN products
                    ON cart_items.product_id = products.id
                WHERE cart_items.id = ?
                `,
                [itemId]
            );

        if (items.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Cart item not found."
            });

        }

        const productName =
            items[0].product_name;

        await db.execute(
            `
            DELETE FROM cart_items
            WHERE id = ?
            `,
            [itemId]
        );

        await IntegrationHub.processEvent(
            "REMOVE_CART_ITEM",
            {
                userId,
                productName
            }
        );

        return res.status(200).json({
            success: true,
            message:
                "Item removed from cart."
        });

    } catch (error) {

        console.error(
            "[CartController][RemoveItem]",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to remove item."
        });

    }

}

}

module.exports =
    new CartController();