import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { createPaymentSession, confirmPayment } from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/create-checkout-session', auth,  createPaymentSession);
router.post('/confirm-payment', auth,  confirmPayment);

export default router;
