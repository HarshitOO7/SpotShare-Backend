import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { auth } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import {
  createParkingSpace,
  getParkingSpaces,
  uploadSpotImages,
  findNearbyParkingSpaces,
  getParkingSpaceById,
  approveParkingSpace,
  rejectParkingSpace,
  getAllParkingSpaces,
} from "../controllers/parkingSpace.controller.js";

const router = Router();

router.post("/create", auth, createParkingSpace);
router.get("/list", getParkingSpaces);
router.post("/upload", auth, upload.array("spotImages", 6), uploadSpotImages);
router.get("/nearby", findNearbyParkingSpaces);
router.get("/all", auth, isAdmin, getAllParkingSpaces);
router.get("/:id", getParkingSpaceById);
router.patch("/:id/approve", auth, isAdmin, approveParkingSpace);
router.patch("/:id/reject", auth, isAdmin, rejectParkingSpace);

export default router;
