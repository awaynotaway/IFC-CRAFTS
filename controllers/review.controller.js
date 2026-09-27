const ReviewService = require(
    "../services/review.service"
);

class ReviewController {

    async create(req, res) {

        try {

            const {
    orderId,
    productId,
    reviewerName,
    productName,
    rating,
    review
} = req.body;

            const result =
                await ReviewService.create({
    orderId,
    productId,
    reviewerName,
    productName,
    rating,
    review,
    userId: req.user.userId
});

                await IntegrationHub.processEvent(
    "REVIEW_CREATED",
    {
        userId: req.user.userId,
        username: req.user.username,
        productName
    }
);

            return res.status(201)
                .json(result);

        } catch (error) {

            console.error(
                "[ReviewController]",
                error
            );

            return res.status(500)
                .json({
                    success: false,
                    message:
                        "Failed to create review."
                });

        }

    }

    async getAll(req, res) {

        try {

            const reviews =
                await ReviewService.getAll();

            return res.status(200)
                .json({
                    success: true,
                    data: reviews
                });

        } catch (error) {

            console.error(
                "[ReviewController]",
                error
            );

            return res.status(500)
                .json({
                    success: false,
                    message:
                        "Failed to load reviews."
                });

        }

    }

}

module.exports =
    new ReviewController();