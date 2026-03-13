import mongoose from 'mongoose';
import { Review } from '../models/review.model.js';
import { Reservation } from '../models/reservation.model.js';
import { ParkingSpace } from '../models/parkingSpace.model.js';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { APIError } from '../utils/APIError.js';
import { APIResponse } from '../utils/APIResponse.js';
import { RESERVATION_STATUS } from '../constants.js';

const createReview = asyncHandler(async (req, res, next) => {
    try {
        const { parkingId, reservationId } = req.params;
        const { rating, comment } = req.body;

        const user = await User.findOne({ uid: req.user.uid });
        if (!user) {
            throw new APIError(404, "User not found");
        }

        const parkingSpace = await ParkingSpace.findById(parkingId);
        if (!parkingSpace) {
            throw new APIError(404, "Parking space not found");
        }

        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            throw new APIError(404, "Reservation not found");
        }

        if (reservation.endTime > new Date()) {
            throw new APIError(400, "Reservation has not ended yet");
        }

        // CRIT-4: Verify reviewer owns the reservation
        if (reservation.user.toString() !== user._id.toString()) {
            throw new APIError(403, "You can only review your own reservations");
        }

        // MED-11: Only allow reviews on Approved reservations
        if (reservation.status !== RESERVATION_STATUS.APPROVED) {
            throw new APIError(400, "Can only review an approved reservation");
        }

        const review = new Review({
            user: user._id,
            parkingSpace: parkingId,
            reservation: reservationId,
            rating,
            comment
        });

        // HIGH-4: Transaction — all three writes succeed or none do
        const dbSession = await mongoose.startSession();
        await dbSession.withTransaction(async () => {
            await review.save({ session: dbSession });
            await ParkingSpace.findByIdAndUpdate(
                parkingId,
                { $push: { reviews: review._id } },
                { session: dbSession }
            );
            await Reservation.findByIdAndUpdate(
                reservationId,
                { review: review._id, status: RESERVATION_STATUS.COMPLETED },
                { session: dbSession }
            );
        });
        await dbSession.endSession();

        return res.status(201).json(new APIResponse(201, { review }, "Review created successfully"));
    } catch (error) {
        next(error);
    }
});

const getReviews = asyncHandler(async (req, res, next) => {
    try {
        const { spotId } = req.params;

        // PERF-1: Nested populate replaces the separate User.find query (eliminates N+1)
        const parkingSpace = await ParkingSpace.findById(spotId).populate({
            path: 'reviews',
            populate: { path: 'user', select: 'fullName profilePhoto' },
        });
        if (!parkingSpace) {
            throw new APIError(404, "Parking space not found");
        }

        const reviewsWithUsers = parkingSpace.reviews.map((review) => ({
            id: review._id,
            rating: review.rating,
            comment: review.comment,
            user: {
                fullName: review.user?.fullName,
                profilePhoto: review.user?.profilePhoto,
            },
            createdAt: review.createdAt,
        }));

        return res.status(200).json(new APIResponse(200, reviewsWithUsers, "Reviews retrieved successfully"));

    } catch (error) {
        next(error);
    }
});

const getRatings = asyncHandler(async (req, res, next) => {
    try {
        const { spotIds } = req.query;
        // MED-3: Cap to 50 IDs to prevent DoS via unbounded $in query
        const ids = (Array.isArray(spotIds) ? spotIds : [spotIds]).slice(0, 50);
        const parkingSpaces = await ParkingSpace.find({ _id: { $in: ids } }).populate("reviews");
        if (!parkingSpaces.length) {
            throw new APIError(404, "Parking spaces not found");
        }

        const ratings = parkingSpaces.map(parkingSpace => {
            const spotRatings = parkingSpace.reviews.map((review) => review.rating);
            const averageRating = spotRatings.reduce((a, b) => a + b, 0) / spotRatings.length;
            return { spotId: parkingSpace._id, averageRating, totalRatings: spotRatings.length };
        });

        return res.status(200).json(new APIResponse(200, ratings, "Ratings retrieved successfully"));

    } catch (error) {
        next(error);
    }
});

export { createReview, getReviews, getRatings };
