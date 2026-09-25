const db = require("../config/db");
const CodeGenerator = require(
    "../services/codeGenerator.service"
);

const IntegrationHub = require(
"../services/integrationHub.service"
);
class CategoryController {

    async getAll(req, res) {

        try {

            const [categories] = await db.execute(
                `
                SELECT *
                FROM categories
                ORDER BY created_at DESC
                `
            );

            return res.status(200).json({
                success: true,
                data: categories
            });

        } catch (error) {

            console.error(
                "[CategoryController][GetAll]",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch categories."
            });

        }

    }

    async getById(req, res) {

        try {

            const { id } = req.params;

            const [categories] = await db.execute(
                `
                SELECT *
                FROM categories
                WHERE id = ?
                `,
                [id]
            );

            if (categories.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Category not found."
                });

            }

            return res.status(200).json({
                success: true,
                data: categories[0]
            });

        } catch (error) {

            console.error(
                "[CategoryController][GetById]",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch category."
            });

        }

    }

    async create(req, res) {

    try {

        const {
            categoryName,
            description
        } = req.body;

        const [result] = await db.execute(
            `
            INSERT INTO categories (
                category_code,
                category_name,
                description
            )
            VALUES (?, ?, ?)
            `,
            [
                "TEMP",
                categoryName,
                description
            ]
        );

        const categoryId =
            result.insertId;

        const categoryCode =
            CodeGenerator.generate(
                "CAT",
                categoryId
            );

        await db.execute(
            `
            UPDATE categories
            SET category_code = ?
            WHERE id = ?
            `,
            [
                categoryCode,
                categoryId
            ]
        );

        await IntegrationHub.processEvent(
    "CATEGORY_CREATED",
    {
        userId: req.user.userId,
        categoryId,
        categoryName
    }
);

        return res.status(201).json({
            success: true,
            categoryId,
            categoryCode,
            message:
                "Category created successfully."
        });

    } catch (error) {

        console.error(
            "[CategoryController][Create]",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message
        });

    }

}

    async update(req, res) {

        try {

            const { id } = req.params;

            const {
                categoryName,
                description
            } = req.body;

            const [categories] = await db.execute(
    `
    SELECT category_name
    FROM categories
    WHERE id = ?
    `,
    [id]
);

const oldCategoryName =
    categories[0].category_name;

            await db.execute(
                `
                UPDATE categories
                SET
                    category_name = ?,
                    description = ?
                WHERE id = ?
                `,
                [
                    categoryName,
                    description,
                    id
                ]
            );

            await IntegrationHub.processEvent(
    "CATEGORY_UPDATED",
    {
        userId: req.user.userId,
        categoryId: id,
        oldCategoryName,
        newCategoryName: categoryName
    }
);

            return res.status(200).json({
                success: true,
                message:
                    "Category updated successfully."
            });

        } catch (error) {

            console.error(
                "[CategoryController][Update]",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update category."
            });

        }

    }

    async delete(req, res) {

        try {

            const { id } = req.params;
const [categories] = await db.execute(
    `
    SELECT category_name
    FROM categories
    WHERE id = ?
    `,
    [id]
);

const categoryName =
    categories[0].category_name;
            await db.execute(
                `
                DELETE FROM categories
                WHERE id = ?
                `,
                [id]
            );

            await IntegrationHub.processEvent(
    "CATEGORY_DELETED",
    {
        userId: req.user.userId,
        categoryId: id,
        categoryName
    }
);
            return res.status(200).json({
                success: true,
                message:
                    "Category deleted successfully."
            });

        } catch (error) {

            console.error(
                "[CategoryController][Delete]",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to delete category."
            });

        }

    }

}

module.exports = new CategoryController();