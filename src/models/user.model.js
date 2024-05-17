import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    uid: { // Firebase UID
        type: String,
        required: true,
        unique: true,
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
    parkingHistory: [
        {
        type: Schema.Types.ObjectId,
        ref: "Reservation",
        }
    ]

}, { timestamps: true });



export const User = mongoose.model("User", userSchema);