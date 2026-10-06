const db =
    require("../config/db");

const CodeGenerator =
    require(
        "./codeGenerator.service"
    );

class CustomRequestService {
async rejectRequest(requestId, reason) {

    const [requestRows] =
    await db.execute(
        `
        SELECT *
        FROM custom_requests
        WHERE id = ?
        `,
        [requestId]
    );

if (
    requestRows.length === 0
) {
    throw new Error(
        "Request not found"
    );
}


    const request =
        requestRows[0];

    await db.execute(
        `
        UPDATE custom_requests
        SET status = 'rejected'
        WHERE id = ?
        `,
        [requestId]
    );

    const [messageRows] =
    await db.execute(
        `
        SELECT id, message
        FROM messages
        WHERE chat_id = ?
        `,
        [request.chat_id]
    );

for (const row of messageRows) {

    try {

        const payload =
            JSON.parse(row.message);

        if (
            payload.type === "request_card" &&
            Number(payload.requestId) === Number(request.id)
        ) {

            payload.status = "rejected";
await db.execute(
`
INSERT INTO messages
(
    message_code,
    chat_id,
    sender_id,
    message,
    is_read
)
VALUES (?, ?, ?, ?, ?)
`,
[
    `TEMP-${Date.now()}`,
    request.chat_id,
    1,
    `Custom Request Rejected

Reason:
${reason}`,
    0
]
);
            await db.execute(
                `
                UPDATE messages
                SET message = ?
                WHERE id = ?
                `,
                [
                    JSON.stringify(payload),
                    row.id
                ]
            );

            break;

        }

    } catch (err) {}

}

    return {
        success: true
    };

}
    async saveQuotation(
    requestId,
    quotationAmount
) {

    const [requestRows] =
        await db.execute(
            `
            SELECT *
            FROM custom_requests
            WHERE id = ?
            `,
            [requestId]
        );

    if (
        requestRows.length === 0
    ) {

        throw new Error(
            "Request not found"
        );

    }

    const request =
        requestRows[0];
        const requestCode =
    request.request_code ||
    `REQ-${request.id}`;

    const subtotal =
        Number(
            quotationAmount
        );

    const vatAmount =
        subtotal * 0.12;

    const totalAmount =
        subtotal + vatAmount;

    const [orderResult] =
        await db.execute(
            `

            INSERT INTO orders (

                order_code,
                user_id,
                custom_request_id,

                subtotal,
                vat_rate,
                vat_amount,
                total_amount,

                status

            )

            VALUES (

                ?, ?, ?,
                ?, ?, ?, ?,
                ?

            )

            `,
            [

                `TEMP-${Date.now()}`,


                request.user_id,

                request.id,

                subtotal,

                12,

                vatAmount,

                totalAmount,

                "pending"

            ]

            
        );
        

    const orderId =
        orderResult.insertId;

    const orderCode =
        CodeGenerator.generate(
            "ORD",
            orderId
        );

    await db.execute(
        `
        UPDATE orders
        SET order_code = ?
        WHERE id = ?
        `,
        [
            orderCode,
            orderId
        ]
    );

  await db.execute(
`
INSERT INTO order_items
(
    order_item_code,
    order_id,
    product_id,
    custom_item_name,
    quantity,
    unit_price,
    subtotal
)
VALUES
(
    ?, ?, ?, ?, ?, ?, ?
)
`,
[
    `TEMP-${Date.now()}`,
    orderId,
    null,
    request.request_type,
    request.quantity || 1,
    subtotal,
    subtotal
]
);
    await db.execute(
        `
        UPDATE custom_requests
        SET status = 'approved'
        WHERE id = ?
        `,
        [requestId]
    );

    const [notifResult] =
await db.execute(
`
INSERT INTO notifications
(
    notification_code,
    user_id,
    title,
    message,
    is_read,
    type
)
VALUES
(
    ?, ?, ?, ?, ?, ?
)
`,
[
    `TEMP-${Date.now()}`,
    request.user_id,
    "Quotation Ready",
    `${requestCode} has been approved. Quotation amount: ₱${subtotal.toFixed(2)}.`,
    0,
    "request"
]

);



const notifCode =
    CodeGenerator.generate(
        "NOTIF",
        notifResult.insertId
    );

await db.execute(
`
UPDATE notifications
SET notification_code = ?
WHERE id = ?
`,
[
    notifCode,
    notifResult.insertId
]
);

await db.execute(
`
UPDATE notifications
SET notification_code = ?
WHERE id = ?
`,
[
    notifCode,
    notifResult.insertId
]
);
const [adminNotifResult] =
await db.execute(
`
INSERT INTO notifications
(
    notification_code,
    user_id,
    title,
    message,
    is_read,
    type
)
VALUES
(
    ?, ?, ?, ?, ?, ?
)
`,
[
    `TEMP-${Date.now()}`,
    1,
    "Quotation Sent",
    `${requestCode} quotation has been sent to the customer. Amount: ₱${subtotal.toFixed(2)}.`,
    0,
    "request"
]
);

const adminNotifCode =
    CodeGenerator.generate(
        "NOTIF",
        adminNotifResult.insertId
    );

await db.execute(
`
UPDATE notifications
SET notification_code = ?
WHERE id = ?
`,
[
    adminNotifCode,
    adminNotifResult.insertId
]
);

    await db.execute(
    `
    INSERT INTO notifications
    (
        notification_code,
        user_id,
        title,
        message,
        is_read,
        type
    )
    VALUES
    (
        ?, ?, ?, ?, ?, ?
    )
    `,
    [
        `TEMP-${Date.now()}`,
        request.user_id,
        "Custom Request Approved",
        `Your custom request ${request.request_code} has been approved. Your quotation amount is ₱${subtotal.toFixed(2)}.`,
        0,
        "request"
    ]
);

    return {

        orderId,

        orderCode,

        totalAmount

    };

}

 async getCustomOrders() {

    const [rows] = await db.execute(`

        SELECT

            cr.id,
            cr.request_code,
            cr.request_type,
            cr.preferred_date,
            cr.description,
            cr.reference_image,
            cr.additional_notes,
            cr.status,
            cr.created_at,

            CONCAT(
                u.first_name,
                ' ',
                u.last_name
            ) AS customer_name,

            u.email

        FROM custom_requests cr

        INNER JOIN users u
            ON u.id = cr.user_id

        WHERE cr.is_claimed = 1

        ORDER BY cr.created_at DESC

    `);

    return rows;

}

    async claimRequest(
    requestId,
    adminId
) {

    const [requestRows] =
        await db.execute(
            `
            SELECT *
            FROM custom_requests
            WHERE id = ?
            `,
            [requestId]
        );

    if (
        requestRows.length === 0
    ) {

        throw new Error(
            "Request not found"
        );

    }

    const request =
        requestRows[0];

    await db.execute(
`
UPDATE custom_requests
SET is_claimed = 1
WHERE id = ?
`,
[requestId]
);

    const [messageRows] =
    await db.execute(
        `
        SELECT id, message
        FROM messages
        WHERE chat_id = ?
        `,
        [request.chat_id]
    );

    for (const row of messageRows) {

        try {

            const payload =
                JSON.parse(
                    row.message
                );

            if (
                payload.type === "request_card" &&
                Number(payload.requestId) === Number(request.id)
            ) {

                payload.status =
    "claimed";

                await db.execute(
                    `
                    UPDATE messages
                    SET message = ?
                    WHERE id = ?
                    `,
                    [
                        JSON.stringify(payload),
                        row.id
                    ]
                );

                break;

            }

        } catch (err) {}

    }

    await db.execute(
        `
        INSERT INTO messages
        (
            message_code,
            chat_id,
            sender_id,
            message,
            is_read
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            `TEMP-${Date.now()}`,
            request.chat_id,
            adminId,

            `✅ Custom Request Confirmed

Request:
${request.request_code}

Status:
Waiting for Quotation

Your custom request has been accepted.

We are currently preparing your quotation and pricing details. You will receive them shortly.`,

            0
        ]
    );

    return {
        success: true,
        requestId
    };

}
async getById(id) {

    const [rows] =
    await db.execute(
        `
        SELECT
            cr.*,

            CONCAT(
                u.first_name,
                ' ',
                u.last_name
            ) AS customer_name,

            u.email,

            u.contact_number

        FROM custom_requests cr

        LEFT JOIN users u
            ON cr.user_id = u.id

        WHERE cr.id = ?
        `,
        [id]
    );
    return rows[0];

}
    async create(data) {

        const [result] =
            await db.execute(
                `
                INSERT INTO custom_requests (

    request_code,
    user_id,
    request_type,
    preferred_date,
    quantity,
    description,
    reference_image,
    additional_notes,
    status

)

VALUES (

    ?, ?, ?, ?, ?, ?, ?, ?, ?

)
                `,
                [
    "TEMP",

    data.userId || null,

    data.requestType || null,

    data.preferredDate || null,

    data.quantity || 1,

    data.description || null,

    data.referenceImage || null,

    data.notes || null,

    "pending"
]
            );

        const requestCode =
            CodeGenerator.generate(
                "REQ",
                result.insertId
            );

            const requestId =
    result.insertId;

    const [chatRows] =
    await db.execute(
        `
        SELECT id
        FROM chats
        WHERE customer_id = ?
        LIMIT 1
        `,
        [data.userId]
    );

let chatId;
if (
    chatRows.length > 0
) {

    chatId =
        chatRows[0].id;

}
else {

    const [chatResult] =
    await db.execute(
        `
        INSERT INTO chats (

            chat_code,
            customer_id,
            admin_id

        )

        VALUES (

            ?, ?, ?

        )
        `,
        [

            "TEMP",

            data.userId,

            null

        ]
    );

    chatId =
        chatResult.insertId;

        const chatCode =
    CodeGenerator.generate(
        "CHAT",
        chatId
    );

await db.execute(
    `
    UPDATE chats
    SET chat_code = ?
    WHERE id = ?
    `,
    [
        chatCode,
        chatId
    ]
);

}
await db.execute(
    `
    UPDATE custom_requests
    SET chat_id = ?
    
    WHERE id = ?
    `,
    [
        chatId,
        requestId
    ]
    
);
const requestMessage =
    JSON.stringify({

        type: "request_card",

        requestId,

        requestCode,

        customerId:
            data.userId,

        requestType:
            data.requestType,

        description:
            data.description,

        referenceImage:
            data.referenceImage,

        status:
            "pending"

    });
const [messageResult] =
    await db.execute(
        `
        INSERT INTO messages (

            message_code,

            chat_id,

            sender_id,

            message,

            is_read

        )

        VALUES (

            ?, ?, ?, ?, ?

        )
        `,
        [
    `TEMP-${Date.now()}`,
    chatId,
    data.userId,
    requestMessage,
    0
]
    );
    const messageCode =
    CodeGenerator.generate(
        "MSG",
        messageResult.insertId
    );

await db.execute(
    `
    UPDATE messages
    SET message_code = ?
    WHERE id = ?
    `,
    [
        messageCode,
        messageResult.insertId
    ]
);

        await db.execute(
            `
            UPDATE custom_requests
            SET request_code = ?
            WHERE id = ?
            `,
            [
                requestCode,
                result.insertId
            ]
        );
const [userRows] =
await db.execute(
`
SELECT
    first_name,
    last_name
FROM users
WHERE id = ?
`,
[data.userId]
);

const customerName =
`${userRows[0].first_name} ${userRows[0].last_name}`;
        const [notifResult] =
await db.execute(
`
INSERT INTO notifications
(
    notification_code,
    user_id,
    title,
    message,
    is_read,
    type
)
VALUES
(
    ?, ?, ?, ?, ?, ?
)
`,
[
    `TEMP-${Date.now()}`,
    1,
    "New Custom Request",
    `${customerName} submitted ${requestCode}.`,
    0,
    "requests"
]
);

const notifCode =
CodeGenerator.generate(
    "NOTIF",
    notifResult.insertId
);

await db.execute(
`
UPDATE notifications
SET notification_code = ?
WHERE id = ?
`,
[
    notifCode,
    notifResult.insertId
]
);

        return {

    success: true,

    requestCode,

    chatId

};

    }

}

module.exports =
    new CustomRequestService();
