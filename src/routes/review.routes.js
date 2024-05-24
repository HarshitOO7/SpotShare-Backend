import { Router } from "express";
import { auth } from "../middlewares/auth.middleware";
import { getReviews, createReview } from "../controllers/review.controller";

const router = Router();

router.post("/:spotId/create", auth, createReview);
router.get("/:spotId/all", auth, getReviews);

export default router;