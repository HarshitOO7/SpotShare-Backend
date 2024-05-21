import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    uid: { // Firebase UID
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    profilePhoto: {
        type: String,
        default: "https://www.gravatar.com/avatar/?d=mp"
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    phoneNumber: {
        type: String,
    },
    reservationHistory: [
        {
        type: Schema.Types.ObjectId,
        ref: "Reservation",
        }
    ],
    parkingSpaces: [
        {
        type: Schema.Types.ObjectId,
        ref: "ParkingSpace",
        }
    ],

}, { timestamps: true });



export const User = mongoose.model("User", userSchema);