import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { createPaymentSession, confirmPayment, cancelPayment } from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/create-checkout-session', auth,  createPaymentSession);
router.post('/:reservationId/confirm-payment', auth,  confirmPayment);
router.post('/:reservationId/cancel-payment', auth,  cancelPayment);

export default router;
