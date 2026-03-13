import Stripe from 'stripe';
import { Reservation } from '../models/reservation.model.js';
import { Payment } from '../models/payment.model.js';
import { ParkingSpace } from '../models/parkingSpace.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { APIError } from '../utils/APIError.js';
import { APIResponse } from '../utils/APIResponse.js';
import { User } from '../models/user.model.js';
import { calculatePrice } from '../utils/calculatePrice.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createPaymentSession = asyncHandler(async (req, res, next) => {
    try {
        // `amount` is NOT accepted from the client — calculated server-side
        const { parkingSpaceId, metadata } = req.body;

        const parkingSpace = await ParkingSpace.findById(parkingSpaceId);
        if (!parkingSpace) {
            return next(new APIError('Parking space not found', 404));
        }

        // Check if the parking space is available for the selected time
        const reservations = await Reservation.find({
            parkingSpace: parkingSpaceId,
            status: { $in: ['Pending', 'Approved'] },
            $or: [
                { startTime: { $lte: metadata.startTime }, endTime: { $gte: metadata.startTime } },
                { startTime: { $lte: metadata.endTime }, endTime: { $gte: metadata.endTime } },
            ],
        });

        if (reservations.length > 0) {
            return next(new APIError('Parking space is not available for the selected time', 400));
        }

        // Calculate price server-side — never trust client-supplied amount
        const amount = calculatePrice(metadata.startTime, metadata.endTime, parkingSpace);

        if (amount <= 0) {
            return next(new APIError('Unable to calculate price for this parking space', 400));
        }

        // Include uid and server-authoritative spotId in metadata
        // spotId is always taken from the validated parkingSpaceId — never from client metadata
        const sessionMetadata = {
            ...metadata,
            spotId: parkingSpaceId,  // CRIT-3: override any client-supplied spotId
            uid: req.user.uid,
        };

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'cad',
                        product_data: {
                            name: parkingSpace.title,
                            description: parkingSpace.description,
                        },
                        unit_amount: Math.round(amount * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/reservation/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/reservation/cancel`,
            metadata: sessionMetadata,
        });

        if (!session) {
            return next(new APIError('Failed to create payment session', 500));
        }

        res.status(200).json(new APIResponse(200, { url: session.url }, 'Payment session created successfully'));
    } catch (error) {
        next(new APIError('Failed to create payment session', 500));
    }
});


const handleStripeWebhook = asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Idempotency: skip if we already processed this session
        const existing = await Reservation.findOne({ stripeSessionId: session.id });
        if (existing) {
            return res.status(200).json({ received: true });
        }

        const { spotId, vehicleReg, startTime, endTime, uid } = session.metadata;

        const user = await User.findOne({ uid });
        if (!user) {
            // Log for debugging; return 200 so Stripe does not retry endlessly
            console.error(`Webhook: user not found for uid ${uid}`);
            return res.status(200).json({ received: true });
        }

        const parkingSpace = await ParkingSpace.findById(spotId).populate('reservations');
        if (!parkingSpace) {
            console.error(`Webhook: parking space ${spotId} not found`);
            return res.status(200).json({ received: true });
        }

        // Use Stripe-verified amount (what was actually charged)
        const totalPrice = session.amount_total / 100;

        const newReservation = new Reservation({
            user: user._id,
            parkingSpace: spotId,
            startTime,
            endTime,
            totalPrice,
            status: 'Pending',
            approved: false,
            vehicleReg,
            stripeSessionId: session.id,
        });

        await newReservation.save();

        parkingSpace.reservations.push(newReservation._id);
        await parkingSpace.save();

        user.reservationHistory.push(newReservation._id);
        await user.save();
    }

    res.status(200).json({ received: true });
});


const confirmPayment = asyncHandler(async (req, res, next) => {
    const { reservationId } = req.params;
    const user = await User.findOne({ uid: req.user.uid });
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
        return next(new APIError('Reservation not found', 404));
    }

    // CRIT-2: Verify the requesting user owns this reservation
    if (reservation.user.toString() !== user._id.toString()) {
        return next(new APIError('Unauthorized', 403));
    }

    // MED-6: Atomic check + update to prevent TOCTOU race condition
    const updated = await Reservation.findOneAndUpdate(
        { _id: reservationId, paymentStatus: { $ne: 'succeeded' } },
        { paymentStatus: 'succeeded' },
        { new: true }
    );
    if (!updated) {
        return next(new APIError('Payment already completed', 400));
    }

    const payment = await Payment.create({
        reservation: reservationId,
        user: user._id,
        amount: reservation.totalPrice,
        paymentStatus: 'Completed',
        transactionDate: Date.now(),
    });

    if (!payment) {
        return next(new APIError('Failed to confirm payment', 500));
    }

    updated.paymentId = payment._id;
    await updated.save();

    res.status(200).json(new APIResponse(200, null, 'Payment confirmed successfully'));
});


const retrieveSession = asyncHandler(async (req, res, next) => {
    const { sessionId } = req.params;

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        // Also return the reservation ID if the webhook has already processed this session
        const reservation = await Reservation.findOne({ stripeSessionId: sessionId });
        res.status(200).json({
            data: session,
            reservationId: reservation?._id || null,
        });
    } catch (error) {
        res.status(404).json({ error: 'Session not found' });
    }
});


export { createPaymentSession, handleStripeWebhook, confirmPayment, retrieveSession };
