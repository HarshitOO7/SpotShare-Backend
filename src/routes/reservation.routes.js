import express from 'express';
import { auth } from '../middlewares/auth.middleware.js';
import { createReservation, approveReservation, rejectReservation, getReservations, getReservationById, getAllParkingSpaceReservations, deleteReservation } from '../controllers/reservation.controller.js';

const router = express.Router();

router.post('/create', auth, createReservation);
router.post('/approve', auth,  approveReservation);
router.post('/reject', auth,  rejectReservation);
router.get('/all-reservations', auth, getReservations);
router.get('/all', auth, getAllParkingSpaceReservations);
router.get('/:id',auth, getReservationById);
router.delete('/:id', auth, deleteReservation);

export default router;
