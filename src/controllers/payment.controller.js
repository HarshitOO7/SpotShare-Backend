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
      const { parkingSpaceId, amount, metadata } = req.body;

      const parkingSpace = await ParkingSpace.findById(parkingSpaceId);

      if (!parkingSpace) {
          return next(new APIError('Parking space not found', 404));
      }

      // check if the parking space is available for the selected time
        const reservations = await Reservation.find({
            parkingSpace: parkingSpaceId,
            status: { $in: ['Pending', 'Approved'] },
            $or: [
                {
                    startTime: { $lte: metadata.startTime },
                    endTime: { $gte: metadata.startTime },
                },
                {
                    startTime: { $lte: metadata.endTime },
                    endTime: { $gte: metadata.endTime },
                },
            ],
        });

        if (reservations.length > 0) {
            return next(new APIError('Parking space is not available for the selected time', 400));
        }

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
                      unit_amount: amount * 100,
                  },
                  quantity: 1,
              },
          ],
          mode: 'payment',
          success_url: `${process.env.CLIENT_URL}/reservation/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.CLIENT_URL}/reservation/cancel`,
          metadata: metadata,
      });

      if (!session) {
          return next(new APIError('Failed to create payment session', 500));
      }

      res.status(200).json(new APIResponse('Payment session created successfully', { url: session.url }));
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


const retrieveSession = asyncHandler(async (req, res, next) => {
  const { sessionId } = req.params;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.status(200).json({ data: session });
  } catch (error) {
    res.status(404).json({ error: 'Session not found' });
  }
}
);


export { createPaymentSession, confirmPayment, retrieveSession };