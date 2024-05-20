import { Router } from 'express';
import { registerUser, getUserDetails, updateAvatar, getParkingSpaces} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { auth } from '../middlewares/auth.middleware.js';


const router = Router();

router.post("/register", registerUser);
router.get("/me", auth, getUserDetails);
router.post("/avatar", auth, upload.single("profilePhoto"), updateAvatar);
router.get("/parking-spaces", auth, getParkingSpaces);

export default router;