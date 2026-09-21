const NotificationService = require("./notification.service");
const AuditLogService = require("./auditLog.service");

class IntegrationHubService {

    async processEvent(event, payload = {}) {

        try {

            if (!event || typeof event !== "string") {
                throw new Error("Invalid event.");
            }

            const allowedEvents = [
                "ORDER_CREATED",
                "PAYMENT_VERIFIED",
                "PAYMENT_REJECTED",
                "ORDER_SHIPPED",
                "ORDER_RECEIVED"
            ];

            if (!allowedEvents.includes(event)) {
                throw new Error(`Unsupported event: ${event}`);
            }

            switch (event) {

                case "ORDER_CREATED":

                    await NotificationService.create({
                        userId: payload.userId,
                        title: "Order Placed",
                        message: "Your order has been successfully placed."
                    });

                    await AuditLogService.create({
                        userId: payload.userId,
                        action: "CREATE_ORDER",
                        module: "ORDERS",
                        description: "Customer created an order."
                    });

                    break;

                case "PAYMENT_VERIFIED":

                    await NotificationService.create({
                        userId: payload.userId,
                        title: "Payment Verified",
                        message: "Your payment has been verified."
                    });

                    await AuditLogService.create({
                        userId: payload.adminId,
                        action: "VERIFY_PAYMENT",
                        module: "PAYMENTS",
                        description: "Admin verified a payment."
                    });

                    break;

                case "PAYMENT_REJECTED":

                    await NotificationService.create({
                        userId: payload.userId,
                        title: "Payment Rejected",
                        message:
                            "Your payment was rejected. Please upload another proof of payment."
                    });

                    await AuditLogService.create({
                        userId: payload.adminId,
                        action: "REJECT_PAYMENT",
                        module: "PAYMENTS",
                        description: "Admin rejected a payment."
                    });

                    break;

                case "ORDER_SHIPPED":

                    await NotificationService.create({
                        userId: payload.userId,
                        title: "Order Shipped",
                        message: "Your order is now on the way."
                    });

                    await AuditLogService.create({
                        userId: payload.adminId,
                        action: "SHIP_ORDER",
                        module: "DELIVERIES",
                        description: "Order marked as shipped."
                    });

                    break;

                case "ORDER_RECEIVED":

                    await NotificationService.create({
                        userId: payload.userId,
                        title: "Order Completed",
                        message:
                            "Thank you for confirming receipt of your order."
                    });

                    await AuditLogService.create({
                        userId: payload.userId,
                        action: "ORDER_RECEIVED",
                        module: "ORDERS",
                        description:
                            "Customer confirmed order receipt."
                    });

                    break;
            }

            return {
                success: true,
                event
            };

        } catch (error) {

            console.error(
                "[IntegrationHubService]",
                error.message
            );

            throw error;
        }
    }
}

module.exports = new IntegrationHubService();