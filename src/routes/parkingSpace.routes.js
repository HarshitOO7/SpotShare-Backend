import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { auth } from '../middlewares/auth.middleware.js';
import { createParkingSpace, getParkingSpaces } from '../controllers/parkingSpace.controller.js';

const router = Router();

router.post("/create", auth, upload.array("spotImages", 6), createParkingSpace);
router.get("/list", getParkingSpaces);



export default router;