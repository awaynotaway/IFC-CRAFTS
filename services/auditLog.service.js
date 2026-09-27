const db = require("../config/db");
const CodeGenerator = require(
"./codeGenerator.service"
);

class AuditLogService {

    async create(data) {

    try {

        const [result] =
            await db.execute(
                `
                INSERT INTO audit_logs (
                    log_code,
                    user_id,
                    action,
                    module,
                    description
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    "TEMP",
                    data.userId,
                    data.action,
                    data.module,
                    data.description
                ]
            );

        const logId =
            result.insertId;

        const logCode =
            CodeGenerator.generate(
                "LOG",
                logId
            );

        await db.execute(
            `
            UPDATE audit_logs
            SET log_code = ?
            WHERE id = ?
            `,
            [
                logCode,
                logId
            ]
        );

        return {
            success: true,
            logId,
            logCode
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