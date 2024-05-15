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
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
    },
}, { timestamps: true });


export const Review = mongoose.model('Review', reviewSchema);