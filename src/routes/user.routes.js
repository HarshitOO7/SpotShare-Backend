import { Router } from "express";
import {
  registerUser,
  getUserDetails,
  updateAvatar,
  getParkingSpaces,
  isUserAdmin,
  getProfilePhoto,
  receiveContactMessage,
  getUserReservations
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { auth } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.get("/me", auth, getUserDetails);
router.post("/avatar", auth, upload.single("profilePhoto"), updateAvatar);
router.get("/parking-spaces", auth, getParkingSpaces);
router.get("/admin", auth, isAdmin, isUserAdmin);
router.get("/profile-photo", auth, getProfilePhoto);
router.post("/contact", receiveContactMessage);
router.get("/reservations", auth, getUserReservations);

export default router;
