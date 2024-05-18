// controller for reservations
import Reservation from '../models/reservation.model.js';
import { User } from '../models/user.model.js';
import { APIError } from '../utils/APIError.js';
import { APIResponse } from '../utils/APIResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendEmail } from '../utils/sendEmail.js';
import { Payment } from '../models/payment.model.js';
import { sendSMS } from '../utils/sendSMS.js';
import { getCoordinates } from '../utils/geoCoding.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ParkingSpace } from '../models/parkingSpace.model.js';

// function to create a reservation
const createReservation = asyncHandler(async (req, res) => {
    const { parkingSpaceId, vehicle, checkIn, checkOut, amount } = req.body;

    // Validate required fields
    if ([parkingSpaceId, vehicle, checkIn, checkOut, amount].some((field) => field === "")) {
        throw new APIError(400, "All fields are required");
    }

    // Get parking space details
    const parkingSpace = await ParkingSpace.findById(parkingSpaceId);
    if (!parkingSpace) {
        throw new APIError(404, "Parking space not found");
    }

    // Get user details
    const user = await User.findById(req.user._id);
    if (!user) {
        throw new APIError(404, "User not found");
    }

    // Create new reservation
    const newReservation = new Reservation({
        parkingSpace: parkingSpaceId,
        user: req.user._id,
        vehicle,
        checkIn,
        checkOut,
        amount,
    });

    // Save reservation
    await newReservation.save();

    // Send email to user
    sendEmail(user.email, "Reservation Confirmation", `Your reservation for ${parkingSpace.title} has been confirmed`);

    // Send SMS to user
    sendSMS(user.phoneNumber, `Your reservation for ${parkingSpace.title} has been confirmed`);

    return res.status(201).json(new APIResponse(201, newReservation, "Reservation created successfully"));
});