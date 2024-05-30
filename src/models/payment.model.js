import mongoose, { Schema } from "mongoose";

const paymentSchema = new Schema({

    reservation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        required: true,
    },
    transactionDate: {
        type: Date,
        default: Date.now,
    },
    transactionId: {
        type: String,
        required: true,
    },

}, { timestamps: true });

export const Payment = mongoose.model('Payment', paymentSchema);