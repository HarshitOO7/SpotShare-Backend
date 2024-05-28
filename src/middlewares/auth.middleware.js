import admin from '../config/firebase.config.cjs';
import { APIError } from '../utils/APIError.js';

const auth = async (req, res, next) => {
    const idToken = req.header("Authorization")?.replace("Bearer ", "");

    if (!idToken) {
        return next(new APIError(401, "Unauthorized"));
    }
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = { uid: decodedToken.uid}
        next();
    } catch (error) {
        return next(new APIError(401, "Unauthorized"));
    }
};

export { auth };