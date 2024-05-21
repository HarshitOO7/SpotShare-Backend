import { APIError } from '../utils/APIError.js';
import { User } from '../models/user.model.js';

export const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user && user.role === 'admin') {
            next();
        } else {
            throw new APIError(403, 'Access denied, admin only');
        }
    } catch (error) {
        next(error);
    }
};
