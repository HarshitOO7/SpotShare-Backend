import mongoose, { Schema } from "mongoose";

const reservationSchema = new Schema({
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
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Upcoming','Parked', 'Completed', 'Cancelled'],
        required: true,
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
    },
    review: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    isReviewed: {
        type: Boolean,
        default: false,
    },

}, { timestamps: true });

export const Reservation = mongoose.model('Reservation', reservationSchema);