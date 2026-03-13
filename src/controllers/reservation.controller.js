import Stripe from 'stripe';
import mongoose from 'mongoose';
import { Reservation } from '../models/reservation.model.js';
import { ParkingSpace } from '../models/parkingSpace.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { APIError } from '../utils/APIError.js';
import { APIResponse } from '../utils/APIResponse.js';
import { User } from '../models/user.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const escapeHtml = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const createReservation = asyncHandler(async (req, res) => {
    const { parkingSpaceId, startTime, endTime, vehicleReg, stripeSessionId } = req.body;

    if (!parkingSpaceId || !startTime || !endTime || !vehicleReg || !stripeSessionId) {
        throw new APIError(400, 'All fields are required');
    }

    // Verify payment actually succeeded via Stripe — never trust client claims
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    if (session.payment_status !== 'paid') {
        throw new APIError(402, 'Payment has not been completed');
    }

    // Idempotency: prevent duplicate reservations on page refresh
    const existing = await Reservation.findOne({ stripeSessionId });
    if (existing) {
        return res.status(200).json(new APIResponse(200, existing, 'Reservation already exists'));
    }

    // PERF-4: Fetch user and parking space in parallel
    const [user, parkingSpace] = await Promise.all([
        User.findOne({ uid: req.user.uid }),
        ParkingSpace.findById(parkingSpaceId).populate('reservations').populate('owner'),
    ]);

    if (!user) {
        throw new APIError(404, 'User not found');
    }

    if (!user.phoneNumber) {
        throw new APIError(400, 'User must have a phone number to make a reservation');
    }

    if (!parkingSpace) {
        throw new APIError(404, 'Parking space not found');
    }

    const newStartTime = new Date(startTime);
    const newEndTime = new Date(endTime);
    const queryDay = newStartTime.toLocaleString('en-US', { weekday: 'long' });

    // Check for overlapping reservations
    const overlappingReservation = parkingSpace.reservations.some(reservation => {
        const existingStartTime = new Date(reservation.startTime);
        const existingEndTime = new Date(reservation.endTime);
        return (
            (newStartTime < existingEndTime && newEndTime > existingStartTime) ||
            (newEndTime > existingStartTime && newStartTime < existingEndTime) ||
            (newStartTime <= existingStartTime && newEndTime >= existingEndTime)
        );
    });

    if (overlappingReservation) {
        throw new APIError(400, 'Parking space is already reserved for the given time');
    }

    // Check availability windows
    const isAvailable = parkingSpace.daysAvailable.some(slot => {
        if (slot.day === queryDay) {
            const fromTime = new Date(`1970-01-01T${slot.fromTime}:00`);
            const toTime = new Date(`1970-01-01T${slot.toTime}:00`);
            const startReservation = new Date(`1970-01-01T${newStartTime.toTimeString().slice(0, 5)}:00`);
            const endReservation = new Date(`1970-01-01T${newEndTime.toTimeString().slice(0, 5)}:00`);
            return startReservation >= fromTime && endReservation <= toTime;
        }
        return false;
    });

    if (!isAvailable) {
        throw new APIError(400, 'Parking space is not available at the requested time');
    }

    // Use Stripe-verified amount as the authoritative price (in dollars)
    const totalPrice = session.amount_total / 100;

    const newReservation = new Reservation({
        user: user._id,
        parkingSpace: parkingSpaceId,
        startTime,
        endTime,
        totalPrice,
        status: 'Pending',
        approved: false,
        vehicleReg,
        stripeSessionId,
    });

    // HIGH-4: Wrap all three writes in a transaction so partial failures don't leave inconsistent state
    const dbSession = await mongoose.startSession();
    await dbSession.withTransaction(async () => {
        await newReservation.save({ session: dbSession });
        await ParkingSpace.findByIdAndUpdate(
            parkingSpaceId,
            { $push: { reservations: newReservation._id } },
            { session: dbSession }
        );
        await User.findByIdAndUpdate(
            user._id,
            { $push: { reservationHistory: newReservation._id } },
            { session: dbSession }
        );
    });
    await dbSession.endSession();

    // Send email notification to the parking space owner (HTML-escaped)
    const safeOwnerName = escapeHtml(parkingSpace.owner.fullName || '');
    const safeAddress = escapeHtml(parkingSpace.address || '');
    const safeUserName = escapeHtml(user.fullName || '');
    const safeUserEmail = escapeHtml(user.email || '');
    const safeVehicleReg = escapeHtml(vehicleReg || '');

    const html = `
        <img src="https://raw.githubusercontent.com/Zeethx/SpotShare/master/public/images/spotshare_horizontal.png" alt="SpotShare Logo">
        <p>Hello ${safeOwnerName},</p>
        <p>Your parking space at ${safeAddress} has a new reservation.</p>
        <ul>
            <li>User: ${safeUserName} (${safeUserEmail})</li>
            <li>Start Time: ${newStartTime.toISOString()}</li>
            <li>End Time: ${newEndTime.toISOString()}</li>
            <li>Total Price: $${totalPrice.toFixed(2)}</li>
            <li>Vehicle Registration: ${safeVehicleReg}</li>
        </ul>
        <p>View the reservation: <a href="${process.env.CLIENT_URL}/reservations/${newReservation._id}">here</a></p>
        <p>SpotShare Team</p>
    `;
    // await sendEmail(parkingSpace.owner.email, 'New Reservation for Your Parking Space!', html);

    res.status(201).json(new APIResponse(201, newReservation, 'Reservation created successfully'));
});

const approveReservation = asyncHandler(async (req, res) => {
    const { reservationId } = req.body;

    const reservation = await Reservation.findById(reservationId).populate('parkingSpace');
    if (!reservation) {
        throw new APIError(404, 'Reservation not found');
    }

    // Only the parking space owner can approve reservations
    const user = await User.findOne({ uid: req.user.uid });
    if (!user || reservation.parkingSpace.owner.toString() !== user._id.toString()) {
        throw new APIError(403, 'Unauthorized: only the parking space owner can approve reservations');
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

    const reservation = await Reservation.findById(reservationId).populate('parkingSpace');
    if (!reservation) {
        throw new APIError(404, 'Reservation not found');
    }

    // Only the parking space owner can reject reservations
    const user = await User.findOne({ uid: req.user.uid });
    if (!user || reservation.parkingSpace.owner.toString() !== user._id.toString()) {
        throw new APIError(403, 'Unauthorized: only the parking space owner can reject reservations');
    }

    if (reservation.status !== 'Pending') {
        throw new APIError(400, 'Reservation is not in a pending state');
    }

    reservation.status = 'Rejected';
    await reservation.save();

    res.status(200).json(new APIResponse(200, reservation, 'Reservation rejected successfully'));
});

const getReservations = asyncHandler(async (req, res) => {
    // Admin-only: enforced by isAdmin middleware on the route
    // HIGH-8: Paginate to prevent loading all reservations into memory
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const reservations = await Reservation.find().populate('parkingSpace user').skip(skip).limit(limit);
    return res.status(200).json(new APIResponse(200, reservations, 'Reservations retrieved successfully'));
});

const getReservationById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reservation = await Reservation.findById(id).populate('parkingSpace user');

    if (!reservation) {
        throw new APIError(404, 'Reservation not found');
    }

    // Allow access to: the user who made the reservation, the space owner, or an admin
    const currentUser = await User.findOne({ uid: req.user.uid });
    const reservationUserId = reservation.user?._id || reservation.user;
    const spaceOwnerId = reservation.parkingSpace?.owner?._id || reservation.parkingSpace?.owner;

    const isReservationOwner = reservationUserId?.toString() === currentUser._id.toString();
    const isSpaceOwner = spaceOwnerId?.toString() === currentUser._id.toString();

    if (!isReservationOwner && !isSpaceOwner && currentUser.role !== 'admin') {
        throw new APIError(403, 'Unauthorized');
    }

    res.status(200).json(new APIResponse(200, reservation, 'Reservation retrieved successfully'));
});

const getAllParkingSpaceReservations = asyncHandler(async (req, res) => {
    const parkingSpaceId = req.query.parkingSpaceId;

    if (!parkingSpaceId) {
        throw new APIError(400, 'parkingSpaceId query parameter is required');
    }

    const user = await User.findOne({ uid: req.user.uid });

    // Verify the user owns the specific parking space being queried
    const parkingSpace = await ParkingSpace.findOne({ _id: parkingSpaceId, owner: user._id });
    if (!parkingSpace) {
        throw new APIError(403, 'Unauthorized: you do not own this parking space');
    }

    const reservations = await Reservation.find({ parkingSpace: parkingSpaceId }).populate('user');
    res.status(200).json(new APIResponse(200, reservations, 'Reservations retrieved successfully'));
});

const deleteReservation = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const reservation = await Reservation.findById(id);

    if (!reservation) {
        throw new APIError(404, 'Reservation not found');
    }

    // Allow deletion by the reservation owner OR the parking space owner
    const user = await User.findOne({ uid: req.user.uid });
    const space = await ParkingSpace.findById(reservation.parkingSpace);

    const isReservationOwner = reservation.user.toString() === user._id.toString();
    const isSpaceOwner = space?.owner.toString() === user._id.toString();

    if (!isReservationOwner && !isSpaceOwner) {
        throw new APIError(403, 'Unauthorized');
    }

    await reservation.deleteOne();

    res.status(200).json(new APIResponse(200, {}, 'Reservation deleted successfully'));
});

export { createReservation, approveReservation, rejectReservation, getReservations, getReservationById, getAllParkingSpaceReservations, deleteReservation };
