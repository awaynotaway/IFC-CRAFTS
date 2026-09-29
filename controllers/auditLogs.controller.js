const db = require("../config/db");
const ExcelJS =
    require("exceljs");

class AuditLogController {

    
async exportLogs(req, res) {

    try {
        const {
    search,
    action,
    module,
    date
} = req.query;

        let query = `
    SELECT

        audit_logs.created_at,

        CONCAT(
            users.first_name,
            ' ',
            users.last_name
        ) AS user,

        users.role,

        audit_logs.action,

        audit_logs.module,

        audit_logs.description

    FROM audit_logs

    INNER JOIN users
        ON audit_logs.user_id =
        users.id

    WHERE 1=1
`;

const params = [];

if (
    search &&
    search.trim()
) {

    query += `
        AND (
            audit_logs.description LIKE ?
            OR audit_logs.action LIKE ?
            OR audit_logs.module LIKE ?
        )
    `;

    params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
    );

}

if (
    action &&
    action !== "all"
) {

    query += `
        AND audit_logs.action = ?
    `;

    params.push(action);

}

if (
    module &&
    module !== "all"
) {

    query += `
        AND audit_logs.module = ?
    `;

    params.push(module);

}

if (date) {

    query += `
        AND DATE(
            audit_logs.created_at
        ) = ?
    `;

    params.push(date);

}

query += `
    ORDER BY
    audit_logs.id DESC
`;

const [logs] =
    await db.execute(
        query,
        params
    );

        const workbook =
            new ExcelJS.Workbook();

        const worksheet =
            workbook.addWorksheet(
                "Audit Logs"
            );

        worksheet.columns = [
            {
                header:
                    "Date & Time",
                key:
                    "created_at",
                width: 25
            },
            {
                header:
                    "User",
                key:
                    "user",
                width: 30
            },
            {
                header:
                    "Role",
                key:
                    "role",
                width: 15
            },
            {
                header:
                    "Action",
                key:
                    "action",
                width: 25
            },
            {
                header:
                    "Module",
                key:
                    "module",
                width: 20
            },
            {
                header:
                    "Description",
                key:
                    "description",
                width: 50
            }
        ];

        logs.forEach(log => {

            worksheet.addRow({
                created_at:
                    log.created_at,
                user:
                    log.user,
                role:
                    log.role,
                action:
                    log.action,
                module:
                    log.module,
                description:
                    log.description
            });

        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=IFC_Crafts_Audit_Logs.xlsx`
        );

        await workbook.xlsx.write(
            res
        );

        res.end();

    }

    catch(error) {

        console.error(error);

        return res.status(500)
        .json({
            success: false,
            message:
                error.message
        });

    }

}
async getLogs(req, res) {

    console.log(
        "QUERY:",
        req.query
    );

    try {

        const {
            search,
            action,
            module,
            date
        } = req.query;

        let query = `
            SELECT

                audit_logs.*,

                audit_logs.created_at AS date,

                CONCAT(
                    users.first_name,
                    ' ',
                    users.last_name
                ) AS user,

                users.role

            FROM audit_logs

            INNER JOIN users
                ON audit_logs.user_id =
                users.id

            WHERE 1=1
        `;

        const params = [];

        if (search) {

            query += `
                AND (
                    CONCAT(
                        users.first_name,
                        ' ',
                        users.last_name
                    ) LIKE ?
                    OR audit_logs.description LIKE ?
                    OR audit_logs.action LIKE ?
                )
            `;

            params.push(
                `%${search}%`,
                `%${search}%`,
                `%${search}%`
            );

        }

        if (
            action &&
            action !== "all"
        ) {

            query += `
                AND audit_logs.action = ?
            `;

            params.push(action);

        }

        if (
            module &&
            module !== "all"
        ) {

            query += `
                AND audit_logs.module = ?
            `;

            params.push(module);

        }

        if (date) {

            query += `
                AND DATE(
                    audit_logs.created_at
                ) = ?
            `;

            params.push(date);

        }

        query += `
            ORDER BY
            audit_logs.id DESC
        `;

       console.log(
    "SQL:",
    query
);

console.log(
    "PARAMS:",
    params
);

const [logs] =
    await db.execute(
        query,
        params
    );

console.log(
    "RESULT:",
    logs
);
        return res.json({
            success: true,
            data: logs
        });

    }

    catch(error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

}

}

module.exports =
    new AuditLogController();