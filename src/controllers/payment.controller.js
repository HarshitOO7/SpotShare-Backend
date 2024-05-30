import Stripe from 'stripe';
import { Reservation } from '../models/reservation.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { APIError } from '../utils/APIError.js';
import { APIResponse } from '../utils/APIResponse.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createPaymentSession = asyncHandler(async (req, res, next) => {
try {
        const { reservationId, amount  } = req.body;
    
        const reservation = await Reservation.findById(reservationId).populate('parkingSpace');

        if (!reservation) {
            return next(new APIError('Reservation not found', 404));
        }
    
        if (reservation.paymentStatus === 'succeeded') {
            return next(new APIError('Payment already completed', 400));
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'cad',
                        product_data: {
                            name: reservation.parkingSpace.title,
                            description: reservation.parkingSpace.description,
                        },
                        unit_amount: amount * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/payment-success?reservationId=${reservationId}`,
            cancel_url: `${process.env.CLIENT_URL}/payment-failed?reservationId=${reservationId}`,
            metadata: {
                reservationId: reservationId,
            },
        });
    
        res.status(200)
        .json(new APIResponse('Payment session created successfully', { url: session.url}));
} catch (error) {
        next(new APIError('Failed to create payment session', 500));
}
});

const confirmPayment = asyncHandler(async (req, res, next) => {
    const { reservationId } = req.query;

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
        return next(new APIError('Reservation not found', 404));
    }

    if (reservation.paymentStatus === 'succeeded') {
        return next(new APIError('Payment already completed', 400));
    }

    reservation.paymentStatus = 'succeeded';
    await reservation.save();

    res.json(new APIResponse('Payment completed successfully'));
});

export { createPaymentSession, confirmPayment };