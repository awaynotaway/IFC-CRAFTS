const db = require("../config/db");
const ExcelJS =
    require("exceljs");
class ReportController {
async exportReport(req, res) {

    try {

        const period =
    req.query.period || "month";

const selectedDate =
    req.query.date || null;

let dateFilter = "";

switch(period) {

    case "today":

        dateFilter = `
            AND DATE(created_at)
            = CURDATE()
        `;

        break;

    case "custom":

        if (selectedDate) {

            dateFilter = `
                AND DATE(created_at)
                = '${selectedDate}'
            `;

        }

        break;

    case "week":

        dateFilter = `
            AND YEARWEEK(created_at)
            = YEARWEEK(CURDATE())
        `;

        break;

    case "year":

        dateFilter = `
            AND YEAR(created_at)
            = YEAR(CURDATE())
        `;

        break;

    case "month":

    default:

        dateFilter = `
            AND MONTH(created_at)
            = MONTH(CURDATE())

            AND YEAR(created_at)
            = YEAR(CURDATE())
        `;
}

        const workbook =
            new ExcelJS.Workbook();

        const worksheet =
            workbook.addWorksheet(
                "Reports"
            );

        const [[sales]] =
    await db.execute(`
        SELECT
            COALESCE(
                SUM(total_amount),
                0
            ) AS totalSales
        FROM orders
        WHERE status = 'received'
        ${dateFilter}
    `);

           const [[vat]] =
    await db.execute(`
        SELECT
            COALESCE(
                SUM(vat_amount),
                0
            ) AS totalVat
        FROM orders
        WHERE status = 'received'
        ${dateFilter}
    `);

        const [[orders]] =
            await db.execute(`
                SELECT
    COUNT(*) AS totalOrders
FROM orders
WHERE 1=1
${dateFilter}

            `);

        worksheet.columns = [
            {
                header: "Metric",
                key: "metric",
                width: 25
            },
            {
                header: "Value",
                key: "value",
                width: 20
            }
        ];

        worksheet.addRow({
    metric: "Total Sales",
    value: sales.totalSales
});

worksheet.addRow({
    metric: "VAT Collected",
    value: vat.totalVat
});

worksheet.addRow({
    metric: "Product Revenue",
    value:
        Number(
            sales.totalSales
        ) -
        Number(
            vat.totalVat
        )
});

worksheet.addRow({
    metric: "Total Orders",
    value: orders.totalOrders
});

        worksheet.addRow([]);

        worksheet.addRow([
            "Top Products"
        ]);

       const [topProducts] =
    await db.execute(`
        SELECT
            COALESCE(
    p.product_name,
    oi.custom_item_name
) AS name,

  COALESCE(
    c.category_name,
    'Custom Request'
) AS category,

            SUM(oi.quantity) AS orders,

            SUM(oi.subtotal) AS revenue,

SUM(
    oi.subtotal * 0.12
) AS vat

        FROM order_items oi

        INNER JOIN orders o
            ON oi.order_id = o.id

        LEFT JOIN products p
    ON oi.product_id = p.id

       LEFT JOIN categories c
    ON p.category_id = c.id

        WHERE o.status = 'received'

        ${dateFilter.replaceAll(
            "created_at",
            "o.created_at"
        )}

        GROUP BY p.id

        ORDER BY orders DESC
    `);

        worksheet.addRow([
    "Product",
    "Category",
    "Orders",
    "Product Revenue (Excl. VAT)"
]);

        topProducts.forEach(
            product => {

                worksheet.addRow([
                    product.name,
                    product.category,
                    product.orders,
                    product.revenue
                ]);

            }
        );

const reportDate =
    new Date(
        selectedDate ||
        new Date().toISOString()
    );


const monthName =
    reportDate.toLocaleString(
        "en-US",
        {
            month: "long"
        }
    );

const day =
    reportDate.getDate();

const year =
    reportDate.getFullYear();

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        
const formattedDate =
    reportDate
        .toISOString()
        .split("T")[0];

let fileName = "";

if (period === "today") {

    fileName =
        `IFC_Crafts_Daily_Report_${formattedDate}.xlsx`;

}

else if (period === "week") {

    const today =
        new Date();

    const firstDay =
        new Date(today);

    firstDay.setDate(
        today.getDate() -
        today.getDay() + 1
    );

    const lastDay =
        new Date(firstDay);

    lastDay.setDate(
        firstDay.getDate() + 6
    );

    const startDate =
        firstDay
            .toISOString()
            .split("T")[0];

    const endDate =
        lastDay
            .toISOString()
            .split("T")[0];

    fileName =
        `IFC_Crafts_Weekly_Report_${startDate}_to_${endDate}.xlsx`;

}


else if (period === "month") {

    fileName =
        `IFC_Crafts_${monthName}_${year}_Report.xlsx`;

}

else if (period === "year") {

    fileName =
        `IFC_Crafts_${year}_Annual_Report.xlsx`;

}

else if (period === "custom") {

    fileName =
        `IFC_Crafts_Report_${formattedDate}.xlsx`;

}

else {

    fileName =
        `IFC_Crafts_Report.xlsx`;

}

res.setHeader(
    "Content-Disposition",
    `attachment; filename=${fileName}`
);

        await workbook.xlsx.write(
            res
        );

        res.end();

    }

    catch(error) {

        console.error(error);

        return res.status(500).json({
            success:false,
            message:error.message
        });

    }

}
    async getSalesReport(req, res) {

        try {

            const [[sales]] =
    await db.execute(`
        SELECT
            COALESCE(
                SUM(total_amount),
                0
            ) AS totalSales
        FROM orders
        WHERE status = 'received'
        ${dateFilter}
    `);

console.log(
    "SALES:",
    sales
);

            return res.status(200).json({
                success: true,
                data: sales
            });

        } catch (error) {

            console.error(
                "[ReportController][Sales]",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to fetch sales report."
            });

        }

    }

    async getTopProducts(req, res) {
try {
const [products] =
await db.execute(
`
SELECT
products.product_name,
SUM(order_items.quantity)
totalSold
FROM order_items
INNER JOIN products
ON order_items.product_id =
products.id
GROUP BY products.id
ORDER BY totalSold DESC
`
);
return res.status(200).json({
success: true,
data: products
});
} catch (error) {
console.error(error);
return res.status(500).json({
success: false
});
}


}


async dashboard(req, res) {

    try {

        const period =
    req.query.period || "month";

    const selectedDate =
    req.query.date || null;

let dateFilter = "";

switch(period) {

    case "today":

        dateFilter = `
            AND DATE(created_at)
            = CURDATE()
        `;

        break;

        case "custom":

    if (selectedDate) {

        dateFilter = `
            AND DATE(created_at)
            = '${selectedDate}'
        `;

    }

    break;

    case "week":

        dateFilter = `
            AND YEARWEEK(created_at)
            = YEARWEEK(CURDATE())
        `;

        break;

    case "year":

        dateFilter = `
            AND YEAR(created_at)
            = YEAR(CURDATE())
        `;

        break;

    case "month":

    default:

        dateFilter = `
            AND MONTH(created_at)
            = MONTH(CURDATE())

            AND YEAR(created_at)
            = YEAR(CURDATE())
        `;
}

        const [[sales]] =
            await db.execute(`
                SELECT
                    COALESCE(
                        SUM(total_amount),
                        0
                    ) AS totalSales
                FROM orders
                WHERE status='received'
${dateFilter}
            `);

        const [[orders]] =
    await db.execute(`
        SELECT
            COUNT(*) AS totalOrders
        FROM orders
        WHERE 1=1
        ${dateFilter}
    `);

        const [[received]] =
            await db.execute(`
                SELECT
                    COUNT(*) AS completedOrders
                FROM orders
                WHERE status='received'
${dateFilter}
            `);

        const [statuses] =
    await db.execute(`
        SELECT
            status,
            COUNT(*) AS total
        FROM orders
        WHERE 1=1
        ${dateFilter}
        GROUP BY status
    `);

          const [topProducts] =
await db.execute(`
    SELECT
        COALESCE(
            p.product_name,
            oi.custom_item_name
        ) AS name,

        COALESCE(
            c.category_name,
            'Custom Request'
        ) AS category,

        SUM(oi.quantity) AS orders,

       SUM(oi.subtotal) AS revenue,

SUM(
    oi.subtotal * 0.12
) AS vat

    FROM orders o

    INNER JOIN order_items oi
        ON o.id = oi.order_id

    LEFT JOIN products p
        ON oi.product_id = p.id

    LEFT JOIN categories c
        ON p.category_id = c.id

    WHERE o.status = 'received'

    ${dateFilter.replaceAll(
        "created_at",
        "o.created_at"
    )}

    GROUP BY
        COALESCE(
            p.product_name,
            oi.custom_item_name
        ),
        COALESCE(
            c.category_name,
            'Custom Request'
        )

    ORDER BY orders DESC

    LIMIT 5
`);
    const [recentSales] =
    await db.execute(`
       SELECT
    o.order_code AS \`order\`,

    CONCAT(
        u.first_name,
        ' ',
        u.last_name
    ) AS customer,

    o.total_amount AS amount,

    o.vat_amount AS vat,

    DATE_FORMAT(
        o.created_at,
        '%m/%d/%Y'
    ) AS date

        FROM orders o

        INNER JOIN users u
            ON o.user_id = u.id

        WHERE o.status = 'received'
${dateFilter.replaceAll("created_at", "o.created_at")}

        ORDER BY o.created_at DESC

        LIMIT 5
    `);

    const [salesOverview] =
    await db.execute(`
        SELECT
            DATE(created_at) AS salesDate,

            SUM(total_amount)
            AS totalSales

        FROM orders

       WHERE status = 'received'
${dateFilter}

        GROUP BY DATE(created_at)

        ORDER BY salesDate ASC
    `);

  console.log(
    "TOP PRODUCTS:",
    topProducts
);

console.log(
    "PERIOD:",
    period
);

console.log(
    "DATE FILTER:",
    dateFilter
);

        return res.json({
            success: true,
           data: {

    totalSales:
        sales.totalSales,

    totalOrders:
        orders.totalOrders,

    completedOrders:
        received.completedOrders,

    statuses,

    topProducts,

    recentSales,

    salesOverview

}
        });

    } catch(error) {

        console.error(error);

        return res.status(500).json({
            success:false,
            message:error.message
        });

    }

}
}

module.exports =
    new ReportController();