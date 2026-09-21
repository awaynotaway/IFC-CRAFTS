const db = require("../config/db");

class AuditLogService {

    async create(data) {

        try {

            const logCode =
                `LOG-${Date.now()}`;

            const query = `
                INSERT INTO audit_logs (
                    log_code,
                    user_id,
                    action,
                    module,
                    description
                )
                VALUES (?, ?, ?, ?, ?)
            `;

            const [result] = await db.execute(
                query,
                [
                    logCode,
                    data.userId,
                    data.action,
                    data.module,
                    data.description
                ]
            );

            return {
                success: true,
                logId: result.insertId
            };

        } catch (error) {

            console.error(
                "[AuditLogService]",
                error
            );

            throw new Error(
                "Failed to create audit log."
            );
        }
    }
}

module.exports = new AuditLogService();