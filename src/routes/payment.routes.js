import express from 'express';
import rateLimit from 'express-rate-limit';
import { auth } from '../middlewares/auth.middleware.js';
import { createPaymentSession, handleStripeWebhook, confirmPayment, retrieveSession } from '../controllers/payment.controller.js';

// HIGH-3: Prevent payment session spam (Stripe quota abuse)
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many payment requests. Please try again later.' },
});

const router = express.Router();

// Stripe webhook — uses express.raw() configured in app.js; no auth middleware
router.post('/webhook', handleStripeWebhook);

router.post('/create-checkout-session', paymentLimiter, auth, createPaymentSession);
router.post('/:reservationId/confirm-payment', paymentLimiter, auth, confirmPayment);
router.get('/checkout-session/:sessionId', auth, retrieveSession);

export default router;
