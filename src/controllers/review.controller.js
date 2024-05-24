import { Review } from "../models/review.model";
import { ParkingSpace } from "../models/parkingSpace.model";
import { User } from "../models/user.model";
import { APIError } from "../utils/APIError";
import { APIResponse } from "../utils/APIResponse";
import { asyncHandler } from "../utils/asyncHandler";

const createReview = asyncHandler(async (req, res, next) => {
    const { spotId } = req.params;
    const { rating, comment } = req.body;
    const user = User.findOne({ uid: req.user.uid });

    const parkingSpace = await ParkingSpace.findById(spotId);
    if (!parkingSpace) {
        return next(new APIError(404, "Parking space not found"));
    }

    const review = new Review({
        user: user._id,
        parkingSpace: parkingSpace._id,
        rating,
        comment
    });

    await review.save();
    parkingSpace.reviews.push(review._id);
    await parkingSpace.save();

    return res.status(201).json(new APIResponse(201, "Review created successfully", { review }));
});

const getReviews = asyncHandler(async (req, res, next) => {
    const { spotId } = req.params;
    const parkingSpace = await ParkingSpace.findById(spotId).populate("reviews");

    if (!parkingSpace) {
        return next(new APIError(404, "Parking space not found"));
    }

    return res.status(200).json(new APIResponse(200, "Reviews retrieved successfully", { reviews: parkingSpace.reviews }));
});

export { createReview, getReviews };