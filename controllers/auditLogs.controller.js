const db = require("../config/db");

class AuditLogController {

    async getLogs(req, res) {

        try {

            const [logs] =
                await db.execute(
                    `
                    SELECT
                        audit_logs.*,
                        accounts.username
                    FROM audit_logs
                    INNER JOIN accounts
                        ON audit_logs.user_id =
                        accounts.user_id
                    ORDER BY audit_logs.id DESC
                    `
                );

            return res.status(200).json({
                success: true,
                data: logs
            });

        } catch (error) {

            console.error(
                "[AuditLogController]",
                error
            );

            return res.status(500).json({
                success: false
            });

        }

    }

}

module.exports =
    new AuditLogController();