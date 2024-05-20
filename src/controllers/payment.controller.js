import Stripe from 'stripe';
import { Reservation } from '../models/reservation.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { APIError } from '../utils/APIError.js';
import { APIResponse } from '../utils/APIResponse.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create a payment intent
const createPaymentIntent = asyncHandler(async (req, res) => {
    const { reservationId } = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
        throw new APIError(404, 'Reservation not found');
    }

    if (reservation.status !== 'approved') {
        throw new APIError(400, 'Reservation is not approved yet');
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: reservation.totalPrice * 100, // Stripe expects the amount in cents
        currency: 'cad',
        payment_method_types: ['card'],
    });

    reservation.paymentIntentId = paymentIntent.id;
    await reservation.save();

    res.status(201).json(new APIResponse(201, { clientSecret: paymentIntent.client_secret }, 'Payment intent created successfully'));
});

// Confirm the payment
const confirmPayment = asyncHandler(async (req, res) => {
    const { reservationId, paymentIntentId } = req.body;

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
        throw new APIError(404, 'Reservation not found');
    }

    if (reservation.paymentIntentId !== paymentIntentId) {
        throw new APIError(400, 'Payment intent ID mismatch');
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
        reservation.paymentStatus = 'failed';
        await reservation.save();
        throw new APIError(400, 'Payment failed');
    }

    reservation.paymentStatus = 'succeeded';
    await reservation.save();

    res.status(200).json(new APIResponse(200, reservation, 'Payment confirmed successfully'));
});

export { createPaymentIntent, confirmPayment };
