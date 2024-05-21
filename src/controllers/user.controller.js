import { asyncHandler } from '../utils/asyncHandler.js';
import {APIError} from '../utils/APIError.js';
import { User } from '../models/user.model.js';
import { APIResponse } from '../utils/APIResponse.js';
import { uploadProfilePhotoOnCloudinary } from '../utils/cloudinary.js';


const registerUser = asyncHandler(async (req, res) => 
    {
        const { uid, fullName, email, phoneNumber} = req.body

        if ([uid, fullName, email, phoneNumber].some((field) => field?.trim() === "")) {
            throw new APIError(400, "All fields are required")
        }

        if (await User.findOne({ $or: [{ email }, { uid }] })) {
            throw new APIError(400, "User already exists")
        }

        const user = await User.create({
            uid,
            fullName,
            email,
            phoneNumber
        })

        const createdUser = await User.findById(user._id).select("-uid")

        if (!user) {
            throw new APIError(500, "User not created")
        }

        return res.status(201).json(
            new APIResponse(201, createdUser, "User registered successfully")
        )
    }
);

const getUserDetails = asyncHandler(async (req, res) => {
    try {
            const user = await User.findOne({uid: req.user.uid}).select("-refreshToken -uid")
            if (!user) {
                throw new APIError(404, "User not found")
            }
        
            return res.status(200).json(
                new APIResponse(200, user, "User details retrieved successfully")
            )
    } catch (error) {
        console.error(error)
        throw new APIError(500, "Something went wrong while getting user details")
    }
});

const updateAvatar = asyncHandler(async (req, res) => {
    // get the image from the request body and upload it to cloudinary but upload using multer middleware
    const image = req.file?.path
    if (!image) {
        throw new APIError(400, "Please upload an image")
    }

    const result = await uploadProfilePhotoOnCloudinary(image)

    if (!result) {
        throw new APIError(500, "Something went wrong while uploading profile photo")
    }

    // update the user profile photo in the database
    const user = await User.findOneAndUpdate(
        { uid: req.user.uid },
        { profilePhoto: result.secure_url },
        { new: true }
    )

    if (!user) {
        throw new APIError(500, "Something went wrong while updating profile photo")
    }

    return res.status(200).json(
        new APIResponse(200, user, "Profile photo updated successfully")
    )
});


const getParkingSpaces = asyncHandler(async (req, res) => {
    const user = await User.findOne({uid: req.user.uid}).populate("parkingSpaces")
    if (!user) {
        throw new APIError(404, "User not found")
    }
    return res.status(200).json(
        new APIResponse(200, user.parkingSpaces, "User parking spaces retrieved successfully")
    )
});

const isUserAdmin = asyncHandler(async (req, res) => {
    const user = await User.findOne({uid: req.user.uid})
    if (!user) {
        throw new APIError(404, "User not found")
    }
    if (user.role !== "admin") {
        
        throw new APIError(403, "Access denied, admin only")
    }
    return res.status(200).json(
        new APIResponse(200, user, "User is an admin")
    )
});

export { 
    registerUser,
    getUserDetails,
    updateAvatar,
    getParkingSpaces,
    isUserAdmin
}