import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { createPaymentIntent, confirmPayment } from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/create-payment-intent', auth,  createPaymentIntent);
router.post('/confirm-payment', auth,  confirmPayment);

export default router;
