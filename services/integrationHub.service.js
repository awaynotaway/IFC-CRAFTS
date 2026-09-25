const NotificationService = require("./notification.service");
const AuditLogService = require("./auditLog.service");

class IntegrationHubService {

    async processEvent(event, payload = {}) {

        try {

            if (!event || typeof event !== "string") {
                throw new Error("Invalid event.");
            }

            const allowedEvents = [

                // Authentication
                "USER_REGISTERED",
                "USER_LOGGED_IN",
                "USER_LOGGED_OUT",

                // Categories
                "CATEGORY_CREATED",
                "CATEGORY_UPDATED",
                "CATEGORY_DELETED",

                // Products
                "PRODUCT_CREATED",
                "PRODUCT_UPDATED",
                "PRODUCT_DELETED",
                "PRODUCT_RESTOCKED",

                // Carts
                "ADD_TO_CART",
                "UPDATE_CART_ITEM",
                "REMOVE_CART_ITEM",

                // Orders
                "ORDER_CREATED",
                "ORDER_RECEIVED",
                "ORDER_SHIPPED",

                // Payments
                "PAYMENT_SUBMITTED",
                "PAYMENT_VERIFIED",
                "PAYMENT_REJECTED",

                // Delivery
                "ORDER_SHIPPED"

            ];

            if (!allowedEvents.includes(event)) {
                throw new Error(
                    `Unsupported event: ${event}`
                );
            }

            switch (event) {

                /*
                |--------------------------------------------------------------------------
                | Authentication Events
                |--------------------------------------------------------------------------
                */

                case "USER_REGISTERED":

                    await NotificationService.create({
                        userId: payload.userId,
                        title: "Welcome to IFC Crafts",
                        message:
                            "Your account has been successfully created."
                    });

                    await AuditLogService.create({
                        userId: payload.userId,
                        action: "USER_REGISTERED",
                        module: "AUTHENTICATION",
                        description:
                            "Customer registered an account."
                    });

                    break;

                case "USER_LOGGED_IN":

                    await AuditLogService.create({
                        userId: payload.userId,
                        action: "USER_LOGGED_IN",
                        module: "AUTHENTICATION",
                        description:
                            "User logged into the system."
                    });

                    break;

                case "USER_LOGGED_OUT":

                    await AuditLogService.create({
                        userId: payload.userId,
                        action: "USER_LOGGED_OUT",
                        module: "AUTHENTICATION",
                        description:
                            "User logged out from the system."
                    });

                    break;

                    case "CATEGORY_CREATED":

                    await AuditLogService.create({
                        userId: payload.userId,
                        action: "CREATE_CATEGORY",
                        module: "CATEGORIES",
                        description:
                            `Created category "${payload.categoryName}.`
                    });

                    break;

                case "CATEGORY_UPDATED":

                    await AuditLogService.create({
                        userId: payload.userId,
                        action: "UPDATE_CATEGORY",
                        module: "CATEGORIES",
                        description:
                        `Updated category "${payload.oldCategoryName}" to "${payload.newCategoryName}".`
                    });

                    break;

                case "CATEGORY_DELETED":

                    await AuditLogService.create({
                        userId: payload.userId,
                        action: "DELETE_CATEGORY",
                        module: "CATEGORIES",
                        description:
                            `Deleted category "${payload.categoryName}".`
                    });

                    break;

                case "PRODUCT_CREATED":

                    await AuditLogService.create({
                        userId: payload.userId,
                        action: "CREATE_PRODUCT",
                        module: "PRODUCTS",
                        description:
    `Created product "${payload.productName}".`
                    });

                    break;

                case "PRODUCT_UPDATED":

                    await AuditLogService.create({
                        userId: payload.userId,
                        action: "UPDATE_PRODUCT",
                        module: "PRODUCTS",
                       description:
    `Updated product "${payload.oldProductName}" to "${payload.newProductName}".`
                    });

                    break;

                case "PRODUCT_DELETED":

                    await AuditLogService.create({
                        userId: payload.userId,
                        action: "DELETE_PRODUCT",
                        module: "PRODUCTS",
                        description:
    `Deleted product "${payload.productName}".`
                    });

                    break;

                    case "PRODUCT_RESTOCKED":

                    await AuditLogService.create({
                        userId: payload.adminId,
                        action: "RESTOCK_PRODUCT",
                        module: "INVENTORY",
                        description:
                            `Restocked "${payload.productName}" with ${payload.quantity} units.`
                    });

    break;



                    // CARTS

                    case "ADD_TO_CART":

                        await AuditLogService.create({
                            userId: payload.userId,
                            action: "ADD_TO_CART",
                            module: "CART",
                            description:
                                `Added product "${payload.productName}" to cart.`
                        });

                    break;

                    case "UPDATE_CART_ITEM":

                        await AuditLogService.create({
                            userId: payload.userId,
                            action: "UPDATE_CART_ITEM",
                            module: "CART",
                            description:
                                `Updated quantity of "${payload.productName}" from ${payload.oldQuantity} to ${payload.newQuantity}.`
                        });

                    break;


                    case "REMOVE_CART_ITEM":

                        await AuditLogService.create({
                            userId: payload.userId,
                            action: "REMOVE_CART_ITEM",
                            module: "CART",
                            description:
                                `Removed product "${payload.productName}" from cart.`
                        });

                    break;


                /*
                |--------------------------------------------------------------------------
                | Order Events
                |--------------------------------------------------------------------------
                */

                case "ORDER_CREATED":

                    await NotificationService.create({
                        userId: payload.userId,
                        title: "Order Placed",
                        message:
                            "Your order has been successfully placed."
                    });

                    await AuditLogService.create({
                        userId: payload.userId,
                        action: "CREATE_ORDER",
                        module: "ORDERS",
                        description:
                            `Created order "${payload.orderCode}".`
                    });

                    break;

                case "ORDER_RECEIVED":

                    await NotificationService.create({
                        userId: payload.userId, 
                        title: "Order Received",
                        message:
                        "Your order has been marked as received."
                    });

                    await AuditLogService.create({
                        userId: payload.userId,
                        action: "ORDER_RECEIVED",
                        module: "ORDERS",
                        description:
                            `Order "${payload.orderCode}" was marked as received.`
                    });

                    break;

                    case "ORDER_SHIPPED":

                    await NotificationService.create({
                        userId: payload.userId,
                        title: "Order Shipped",
                        message:
                            "Your order has been shipped."
                    });

                    await AuditLogService.create({
                        userId: payload.adminId,
                        action: "SHIP_ORDER",
                        module: "ORDERS",
                        description:
                            `Shipped order "${payload.orderCode}".`
                    });

                    break;

                /*
                |--------------------------------------------------------------------------
                | Payment Events
                |--------------------------------------------------------------------------
                */

                case "PAYMENT_SUBMITTED":

                await NotificationService.create({
                    userId: payload.userId,
                    title: "Payment Submitted",
                    message:
                        "Your payment is waiting for verification."
                });

                await AuditLogService.create({
                    userId: payload.userId,
                    action: "PAYMENT_SUBMITTED",
                    module: "PAYMENTS",
                    description:
                        `Submitted payment "${payload.paymentCode}".`
                });

                break;

                case "PAYMENT_VERIFIED":

                await NotificationService.create({
                    userId: payload.userId,
                    title: "Payment Verified",
                    message:
                        "Your payment has been verified."
                });

                await AuditLogService.create({
                    userId: payload.adminId,
                    action: "VERIFY_PAYMENT",
                    module: "PAYMENTS",
                    description:
                        `Verified payment "${payload.paymentCode}".`
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
                        description:
                            "Admin rejected a payment."
                    });

                    break;

                /*
                |--------------------------------------------------------------------------
                | Delivery Events
                |--------------------------------------------------------------------------
                */

                case "ORDER_SHIPPED":

                    await NotificationService.create({
                        userId: payload.userId,
                        title: "Order Shipped",
                        message:
                            "Your order is now on the way."
                    });

                    await AuditLogService.create({
                        userId: payload.adminId,
                        action: "SHIP_ORDER",
                        module: "DELIVERIES",
                        description:
                            "Order marked as shipped."
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
                error
            );

            throw error;
        }
    }
}

module.exports = new IntegrationHubService();