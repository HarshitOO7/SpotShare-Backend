import express from 'express';
import rateLimit from 'express-rate-limit';
import { auth } from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/admin.middleware.js';
import { createReservation, approveReservation, rejectReservation, getReservations, getReservationById, getAllParkingSpaceReservations, deleteReservation } from '../controllers/reservation.controller.js';

// HIGH-3: Limit reservation creation to prevent slot-hoarding
const reservationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many reservation requests. Please try again later.' },
});

const router = express.Router();

router.post('/create', reservationLimiter, auth, createReservation);
router.post('/approve', auth, approveReservation);
router.post('/reject', auth, rejectReservation);
router.get('/all-reservations', auth, isAdmin, getReservations);
router.get('/all', auth, getAllParkingSpaceReservations);
router.get('/:id', auth, getReservationById);
router.delete('/:id', auth, deleteReservation);

export default router;
