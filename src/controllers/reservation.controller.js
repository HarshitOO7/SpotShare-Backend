import { Reservation } from '../models/reservation.model.js';
import { ParkingSpace } from '../models/parkingSpace.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { APIError } from '../utils/APIError.js';
import { APIResponse } from '../utils/APIResponse.js';
import { User } from '../models/user.model.js';

const createReservation = asyncHandler(async (req, res) => {
    const { userEmail, parkingSpaceId, startTime, endTime, totalPrice, vehicleReg } = req.body;

    if (!userEmail || !parkingSpaceId || !startTime || !endTime || !totalPrice || !vehicleReg) {
        throw new APIError(400, 'All fields are required');
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
        throw new APIError(404, 'User not found');
    }

    const parkingSpace = await ParkingSpace.findById(parkingSpaceId).populate('reservations');
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

export { createReservation, approveReservation, rejectReservation, getReservations, getReservationById };
