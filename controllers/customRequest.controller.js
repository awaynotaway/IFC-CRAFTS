const CustomRequestService =
    require(
        "../services/customRequest.service"
    );

class CustomRequestController {
 async getCustomOrders(
    req,
    res
) {

    try {

        const requests =
            await CustomRequestService.getCustomOrders();

        return res.status(200).json({
            success: true,
            data: requests
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

}
    async claimRequest(
    req,
    res
) {

    try {

        const result =
            await CustomRequestService.claimRequest(
                req.params.id,
                req.user.userId
            );

        return res.json(
            result
        );

    }
    catch(error) {

        console.error(
            error
        );

        return res.status(500).json({
            success:false,
            message:error.message
        });

    }

}
async getById(
    req,
    res
) {

    try {

        const result =
            await CustomRequestService.getById(
                req.params.id
            );

        return res.json({

            success: true,

            data: result

        });

    }
    catch(error) {

        console.error(
            "GET REQUEST ERROR:",
            error
        );

        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

}
    async create(req, res) {

        console.log("BODY:", req.body);
console.log("FILE:", req.file);
const referenceImage =
    req.file
        ? `/references/${req.file.filename}`
        : null;
        try {

            const requestType =
    req.body?.requestType;

const preferredDate =
    req.body?.preferredDate;

const quantity =
    req.body?.quantity;

const description =
    req.body?.description;

const notes =
    req.body?.notes;

            const result =
                await CustomRequestService.create({

    userId:
        req.user.userId,

    requestType,

    preferredDate,

    quantity,

    description,

    notes,

    referenceImage

});

            return res.status(201).json(
                result
            );

        } catch(error) {

            console.error(error);

            return res.status(500).json({

                success:false,

                message:error.message

            });

        }

    }

    async saveQuotation(
    req,
    res
) {

    try {

        const result =
            await CustomRequestService.saveQuotation(

                req.params.id,

                req.body.quotationAmount

            );

        return res.json({
            success: true,
            data: result
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

async rejectRequest(
    req,
    res
) {

    try {

        const result =
            await CustomRequestService.rejectRequest(
                req.params.id,
                req.body.reason
            );

        return res.json(result);

    } catch(error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

}

}

module.exports =
    new CustomRequestController();