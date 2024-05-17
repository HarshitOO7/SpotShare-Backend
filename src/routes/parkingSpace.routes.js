import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { auth } from '../middlewares/auth.middleware.js';
import { createParkingSpace, getParkingSpaces, uploadSpotImages } from '../controllers/parkingSpace.controller.js';

const router = Router();

router.post("/create", auth, createParkingSpace);
router.get("/list", getParkingSpaces);
router.post("/upload", upload.array("spotImages", 6), uploadSpotImages);



export default router;