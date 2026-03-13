import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    parkingSpace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ParkingSpace',
        required: true,
    },
    reservation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation',
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        maxlength: 2000,
        trim: true,
    },
}, { timestamps: true });

// PERF-2: Index for getReviews query
reviewSchema.index({ parkingSpace: 1 });

export const Review = mongoose.model('Review', reviewSchema);