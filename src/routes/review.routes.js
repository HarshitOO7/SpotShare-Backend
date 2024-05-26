import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { getReviews, createReview, getRatings } from "../controllers/review.controller.js";

const router = Router();

router.post("/:parkingId/:reservationId/create", auth, createReview);
router.get("/:spotId/all", getReviews);
router.get("/ratings", getRatings);

export default router;