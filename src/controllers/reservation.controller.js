import { Reservation } from '../models/reservation.model.js';
import { ParkingSpace } from '../models/parkingSpace.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { APIError } from '../utils/APIError.js';
import { APIResponse } from '../utils/APIResponse.js';
import { User } from '../models/user.model.js';
import { sendEmail } from '../utils/mailer.js';

const createReservation = asyncHandler(async (req, res) => {
    const { parkingSpaceId, startTime, endTime, totalPrice, vehicleReg } = req.body;
    if (!parkingSpaceId || !startTime || !endTime || !totalPrice || !vehicleReg) {
        throw new APIError(400, 'All fields are required');
    }

    const user = await User.findOne({ uid: req.user.uid});
    if (!user) {
        throw new APIError(404, 'User not found');
    }

    if(!user.phoneNumber) {
        throw new APIError(400, 'User must have a phone number to make a reservation');
    }

    const parkingSpace = await ParkingSpace.findById(parkingSpaceId).populate('reservations').populate('owner');
    if (!parkingSpace) {
        throw new APIError(404, 'Parking space not found');
    }
    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);
    const queryDay = newStartTime.toLocaleString('en-US', { weekday: 'long' });

    // Check if the requested time overlaps with existing reservations
    const overlappingReservation = parkingSpace.reservations.some(reservation => {
        const existingStartTime = new Date(reservation.startTime);
        const existingEndTime = new Date(reservation.endTime);

        return (
            (newStartTime < existingEndTime && newEndTime > existingStartTime) || // New start time is within an existing reservation
            (newEndTime > existingStartTime && newStartTime < existingEndTime) || // New end time is within an existing reservation
            (newStartTime <= existingStartTime && newEndTime >= existingEndTime)  // New reservation spans an existing reservation
        );
    });

    if (overlappingReservation) {
        throw new APIError(400, 'Parking space is already reserved for the given time');
    }

    // Check if the requested time falls within the available time slots
    const isAvailable = parkingSpace.daysAvailable.some(slot => {
        if (slot.day === queryDay) {
            const fromTime = new Date(`1970-01-01T${slot.fromTime}:00`);
            const toTime = new Date(`1970-01-01T${slot.toTime}:00`);
            const startReservation = new Date(`1970-01-01T${newStartTime.toTimeString().slice(0, 5)}:00`);
            const endReservation = new Date(`1970-01-01T${newEndTime.toTimeString().slice(0, 5)}:00`);

            return (
                startReservation >= fromTime && endReservation <= toTime
            );
        }
        return false;
    });

    if (!isAvailable) {
        throw new APIError(400, 'Parking space is not available at the requested time');
    }

    const newReservation = new Reservation({
        user: user._id,
        parkingSpace: parkingSpaceId,
        startTime,
        endTime,
        totalPrice,
        status: 'Pending',
        approved: false,
        vehicleReg,
    });

    await newReservation.save();

    parkingSpace.reservations.push(newReservation._id);
    await parkingSpace.save();

    user.reservationHistory.push(newReservation._id);
    await user.save();
        // Send email notification to the parking space owner
        const subject = 'New Reservation for Your Parking Space!';
        const to = parkingSpace.owner.email;
        const html = `
        <img src="https://raw.githubusercontent.com/Zeethx/SpotShare/master/public/images/spotshare_horizontal.png" alt="SpotShare Logo">
        <p>Hello ${parkingSpace.owner.fullName},</p>
        <p>Your parking space at ${parkingSpace.address} has a new reservation.</p>
        <p>Reservation Details:</p>
        <ul>
            <li>User: ${user.fullName} (${user.email})</li>
            <li>Start Time: ${newStartTime.toISOString()}</li>
            <li>End Time: ${newEndTime.toISOString()}</li>
            <li>Total Price: ${totalPrice}</li>
            <li>Vehicle Registration: ${vehicleReg}</li>
        </ul>
        <p>View the reservation: <a href="${process.env.CLIENT_URL}/reservations/${newReservation._id}">here</a></p>
        <p>Thank you,</p>
        <p>SpotShare Team</p>
    `;
    
        // await sendEmail(to, subject, html);

    res.status(201).json(new APIResponse(201, newReservation, 'Reservation request created successfully and is pending approval'));
});

const approveReservation = asyncHandler(async (req, res) => {
    const { reservationId } = req.body;

    const reservation = await Reservation.findById(reservationId).populate('parkingSpace');
    if (!reservation) {
        throw new APIError(404, 'Reservation not found');
    }

    if (reservation.status !== 'Pending') {
        throw new APIError(400, 'Reservation is not in a pending state');
    }

    reservation.status = 'Approved';
    reservation.approved = true;
    await reservation.save();

    res.status(200).json(new APIResponse(200, reservation, 'Reservation approved successfully'));
});

const rejectReservation = asyncHandler(async (req, res) => {
    const { reservationId } = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
        throw new APIError(404, 'Reservation not found');
    }

    if (reservation.status !== 'Pending') {
        throw new APIError(400, 'Reservation is not in a pending state');
    }

    reservation.status = 'Rejected';
    await reservation.save();

    res.status(200).json(new APIResponse(200, reservation, 'Reservation rejected successfully'));
});

const getReservations = asyncHandler(async (req, res) => {
    const reservations = await Reservation.find().populate('parkingSpace user');

    return res.status(200).json(new APIResponse(200, reservations, 'Reservations retrieved successfully'));
});

const getReservationById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reservation = await Reservation.findById(id).populate('parkingSpace user');

    if (!reservation) {
        throw new APIError(404, 'Reservation not found');
    }

    res.status(200).json(new APIResponse(200, reservation, 'Reservation retrieved successfully'));
});

const getAllParkingSpaceReservations = asyncHandler(async (req, res) => {
    let reservations;
    const parkingSpaceId = req.query.parkingSpaceId;
    const userId = req.user.uid; // authenticated user ID
    
    const user = await User.findOne({ uid: userId });
    // Fetch the parking space and verify ownership
    const parkingSpace = await ParkingSpace.findOne({ owner: user._id });

    if (!parkingSpace) {
        throw new APIError(403, 'Unauthorized access, you do not own this parking space');
    }
    

    if (parkingSpaceId) {
        reservations = await Reservation.find({ parkingSpace: parkingSpaceId }).populate('user');
    } else {
        reservations = await Reservation.find().populate('user');
    }


    res.status(200).json(new APIResponse(200, reservations, 'Reservations retrieved successfully'));
});



export { createReservation, approveReservation, rejectReservation, getReservations, getReservationById, getAllParkingSpaceReservations };
