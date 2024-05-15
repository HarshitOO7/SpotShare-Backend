import mongoose, { Schema } from "mongoose";

const parkingSpaceSchema = new Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    address: {
        type: String,
        required: true
    },
    // might need this
    // coordinates: {
    //     lat: {
    //         type: Number,
    //         required: true
    //     },
    //     lng: {
    //         type: Number,
    //         required: true
    //     }
    // },
    pricePerHour: {
        type: Number,
        required: true
    },
    pricePerDay: {
        type: Number,
        required: true
    },
    pricePerMonth: {
        type: Number,
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    availableFrom: {
        type: Date,
        required: true
    },
    availableTo: {
        type: Date,
        required: true
    },

}, { timestamps: true });

export const ParkingSpace = mongoose.model("ParkingSpace", parkingSpaceSchema);