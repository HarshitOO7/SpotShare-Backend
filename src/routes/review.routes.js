import { Router } from "express";
import rateLimit from "express-rate-limit";
import { auth } from "../middlewares/auth.middleware.js";
import { getReviews, createReview, getRatings } from "../controllers/review.controller.js";

// HIGH-3: Prevent review spam
const reviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many review submissions. Please try again later.' },
});

const router = Router();

router.post("/:parkingId/:reservationId/create", reviewLimiter, auth, createReview);
router.get("/:spotId/all", getReviews);
router.get("/ratings", getRatings);

export default router;