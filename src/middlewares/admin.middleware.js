import { APIError } from '../utils/APIError.js';
import { User } from '../models/user.model.js';

export const isAdmin = async (req, res, next) => {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) {
        // MED-8: Use next() so the global error handler formats the response consistently
        return next(new APIError(403, "Forbidden"));
    }

    if (user.role !== "admin") {
        return next(new APIError(403, "Forbidden"));
    }

    next();
}
