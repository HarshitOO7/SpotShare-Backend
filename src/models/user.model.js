import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        index: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    profilePhoto: {
        type: String,
        // default: "https://www.gravatar.com/avatar/
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    refreshToken: {
        type: String,
    },
    parkingHistory: [
        {
        type: Schema.Types.ObjectId,
        ref: "Reservation",
        }
    ]

}, { timestamps: true });



export const User = mongoose.model("User", userSchema);