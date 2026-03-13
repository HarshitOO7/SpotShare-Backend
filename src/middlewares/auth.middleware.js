import admin from '../config/firebase.config.cjs';
import { APIError } from '../utils/APIError.js';

// HIGH-1: Accepts either an httpOnly session cookie (preferred) or a Bearer token (dev fallback)
const auth = async (req, res, next) => {
    try {
        const sessionCookie = req.cookies?.session;

        if (sessionCookie) {
            // Verify the Firebase session cookie (long-lived, httpOnly)
            const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
            req.user = { uid: decodedClaims.uid };
            return next();
        }

        // Fallback: Bearer token (for dev tools, mobile clients, or migration period)
        const idToken = req.header("Authorization")?.replace("Bearer ", "");
        if (!idToken) {
            return next(new APIError(401, "Unauthorized"));
        }
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        req.user = { uid: decodedToken.uid };
        next();
    } catch (error) {
        return next(new APIError(401, "Unauthorized"));
    }
};

export { auth };