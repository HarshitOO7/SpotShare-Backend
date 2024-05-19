import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { auth } from '../middlewares/auth.middleware.js';
import { createParkingSpace, getParkingSpaces, uploadSpotImages, findNearbyParkingSpaces, getParkingSpaceById } from '../controllers/parkingSpace.controller.js';

const router = Router();

router.post("/create", auth, createParkingSpace);
router.get("/list", getParkingSpaces);
router.post("/upload", auth, upload.array("spotImages", 6), uploadSpotImages);
router.get("/nearby", findNearbyParkingSpaces);
router.get("/:id", getParkingSpaceById);


export default router;