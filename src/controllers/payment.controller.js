import Stripe from 'stripe';
import { Reservation } from '../models/reservation.model.js';
import { Payment } from '../models/payment.model.js';
import { ParkingSpace } from '../models/parkingSpace.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { APIError } from '../utils/APIError.js';
import { APIResponse } from '../utils/APIResponse.js';
import { User } from '../models/user.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createPaymentSession = asyncHandler(async (req, res, next) => {
try {
        const { reservationId, amount  } = req.body;
    
        const reservation = await Reservation.findById(reservationId).populate('parkingSpace');

        if (!reservation) {
            return next(new APIError('Reservation not found', 404));
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

        if(!session) {
            return next(new APIError('Failed to create payment session', 500));
        }
        
    
        res.status(200)
        .json(new APIResponse('Payment session created successfully', { url: session.url}));
} catch (error) {
        next(new APIError('Failed to create payment session', 500));
}
});

const confirmPayment = asyncHandler(async (req, res, next) => {
    const { reservationId } = req.params;
    const user = await User.findOne({uid: req.user.uid})
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
        return next(new APIError('Reservation not found', 404));
    }

    if (reservation.paymentStatus === 'succeeded') {
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

    reservation.paymentStatus = 'succeeded';
    reservation.paymentId = payment._id;
    await reservation.save();

    res.status(200).json(new APIResponse('Payment confirmed successfully'));
});

const cancelPayment = asyncHandler(async (req, res, next) => {
    const { reservationId } = req.params;
    const user = await User.findOne({uid: req.user.uid}).exec();

    if (!user) {
        return next(new APIError('User not found', 404));
    }

    const reservation = await Reservation.findOne({ _id: reservationId, user: user._id }).exec();

    if (!reservation) {
        return next(new APIError('Reservation not found', 404));
    }

    if (reservation.paymentStatus !== 'pending') {
        return next(new APIError('Cannot cancel payment', 400));
    }

    const parkingSpace = await ParkingSpace.updateOne({ _id: reservation.parkingSpace, reservations: reservation._id }, {
        $pull: { reservations: reservation._id }
    }).exec();

    if (parkingSpace.nModified === 0) {
        return next(new APIError('Parking space not found or reservation not found in parking space', 404));
    }

    await User.updateOne({ _id: user._id }, {
        $pull: { reservations: reservation._id }
    }).exec();

    await Reservation.findByIdAndDelete(reservation._id).exec();
    
    res.status(200).json(new APIResponse('Payment cancelled successfully'));
});

export { createPaymentSession, confirmPayment, cancelPayment };