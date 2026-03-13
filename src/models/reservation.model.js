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
        enum: ['Pending','Approved', 'Rejected', 'Cancelled', 'Completed'],
        required: true,
    },
    review: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
    },
    approved: {
        type: Boolean,
        default: false,
    },
    paymentId: {
        type: String,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'succeeded', 'failed'],
        default: 'pending'
    },
    vehicleReg: {
        type: String,
        required: true,
    },
    stripeSessionId: {
        type: String,
        unique: true,
        sparse: true, // allows multiple documents with no stripeSessionId
    }

}, { timestamps: true });

// PERF-2: Indexes for frequent query patterns
reservationSchema.index({ parkingSpace: 1, status: 1 });  // getAllParkingSpaceReservations filter
reservationSchema.index({ user: 1 });                      // getUserReservations

export const Reservation = mongoose.model('Reservation', reservationSchema);