import { Router } from "express";
import {
  registerUser,
  getUserDetails,
  updateAvatar,
  getParkingSpaces,
  isUserAdmin,
  getProfilePhoto,
  receiveContactMessage,
  getUserReservations,
  cronjob,
  createSession,
  logoutUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { auth } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import rateLimit from "express-rate-limit";

const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many contact requests. Please try again later.' },
});

// HIGH-3: Rate limiter for account creation
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many registrations from this IP. Please try again later.' },
});

const router = Router();

router.post("/register", registerLimiter, auth, registerUser);
router.get("/me", auth, getUserDetails);
router.get("/verify-token", auth, (_req, res) => res.send("Token is valid"));
router.post("/avatar", auth, upload.single("profilePhoto"), updateAvatar);
router.get("/parking-spaces", auth, getParkingSpaces);
router.get("/admin", auth, isAdmin, isUserAdmin);
router.get("/profile-photo", auth, getProfilePhoto);
router.post("/contact", contactLimiter, receiveContactMessage);
router.get("/reservations", auth, getUserReservations);
router.get("/cron", cronjob);

// HIGH-1: Session cookie endpoints (no auth required — these are called before/after auth)
router.post("/session", createSession);
router.post("/logout", logoutUser);

export default router;
