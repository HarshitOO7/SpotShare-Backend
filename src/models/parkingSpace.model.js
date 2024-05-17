import mongoose, { Schema } from "mongoose";


const availabilitySchema = new Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
    },
    fromTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/  // Matches HH:MM format
    },
    toTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/  // Matches HH:MM format
    }
});

const parkingSpaceSchema = new Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    address: {
        type: String,
        required: true
    },
    coordinates: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },
    typeOfSpot: {
        type: String,
        enum: ["Driveway", "Garage", "Street"],
        required: true
    },
    vehicleSize: {
        type: String,
        enum: ["Small", "Medium", "Large", "Van"],
        required: true
    },
    spacesToRent: {
        type: Number,
        required: true,
        default: 1
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    accessInstructions: {
        type: String,
    },
    spotImages: {
        type: [{
            type: String,
            required: true
        }],
        validate: [arrayLimit, '{PATH} exceeds the limit of 6']
    },
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
    daysAvailable: [availabilitySchema],

}, { timestamps: true });


function arrayLimit(val) {
    return val.length <= 6;
}

// Validate the number of images uploaded
parkingSpaceSchema.path("spotImages").validate(function (value) {
    return value.length <= 6;
}, "You can only upload a maximum of 6 images");

// Create a 2dsphere index on the coordinates field
parkingSpaceSchema.index({ coordinates: "2dsphere" });

export const ParkingSpace = mongoose.model("ParkingSpace", parkingSpaceSchema);