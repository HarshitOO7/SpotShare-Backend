import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { createPaymentSession, handleStripeWebhook, confirmPayment, retrieveSession } from '../controllers/payment.controller.js';

const router = express.Router();

// Stripe webhook — uses express.raw() configured in app.js; no auth middleware
router.post('/webhook', handleStripeWebhook);

router.post('/create-checkout-session', auth, createPaymentSession);
router.post('/:reservationId/confirm-payment', auth, confirmPayment);
router.get('/checkout-session/:sessionId', auth, retrieveSession);

export default router;
