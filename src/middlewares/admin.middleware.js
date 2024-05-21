import { APIError } from '../utils/APIError.js';
import { User } from '../models/user.model.js';

export const isAdmin = async (req, res, next) => {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) {
        return res.status(403).json(new APIError(403, "Forbidden"));
    }

    if (user.role !== "admin") {
        return res.status(403).json(new APIError(403, "Forbidden"));
    }

    next();
}
