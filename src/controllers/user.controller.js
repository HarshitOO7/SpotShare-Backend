import { asyncHandler } from '../utils/asyncHandler.js';
import {APIError} from '../utils/APIError.js';
import { User } from '../models/user.model.js';
import { APIResponse } from '../utils/APIResponse.js';
import { uploadProfilePhotoOnCloudinary } from '../utils/cloudinary.js';
import { sendEmail } from '../utils/mailer.js';
import { Reservation } from '../models/reservation.model.js';
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
            const user = await User.findOne({uid: req.user.uid}).select("-uid")
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

const getProfilePhoto = asyncHandler(async (req, res) => {
    const user = await User.findOne({uid: req.user.uid})
    if (!user) {
        throw new APIError(404, "User not found")
    }
    return res.status(200).json(
        new APIResponse(200, user.profilePhoto, "User profile photo retrieved successfully")
    )
});

// Contact helper function
const receiveContactMessage = asyncHandler(async (req, res) => {
    const { name, email, message } = req.body;
    const messageBody = `
    <html>
    <head>
    <meta name="viewport" content="width=device-width" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    </head>
    <body>
    <table bgcolor="#fafafa" style=" width: 100%!important; height: 100%; background-color: #fafafa; padding: 20px; font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, 'Lucida Grande', sans-serif;  font-size: 100%; line-height: 1.6;">
    <tr>
    <td></td>
    <td bgcolor="#FFFFFF" style="border: 1px solid #eeeeee; background-color: #ffffff; border-radius:5px; display:block!important; max-width:600px!important; margin:0 auto!important; clear:both!important;"><div style="padding:20px; max-width:600px; margin:0 auto; display:block;">
    <table style="width: 100%;">
    <tr>
    <td><p style="text-align: center; display: block;  padding-bottom:20px;  margin-bottom:20px; border-bottom:1px solid #dddddd; width:50px"><img src="https://raw.githubusercontent.com/Zeethx/SpotShare/master/public/images/spotshare_horizontal.png"/></p>
    <h1 style="font-weight: 200; font-size: 36px; margin: 20px 0 30px 0; color: #333333;">From ${name}: ${email}</h1>
    <p style="margin-bottom: 10px; font-weight: normal; font-size:16px; color: #333333;">${message}</p>
    <p style="text-align: center; display: block; padding-top:20px; font-weight: bold; margin-top:30px; color: #666666; border-top:1px solid #dddddd;">SpotShare</p></td>
    </tr>
    </table>
    </div></td>
    <td></td>
    </tr>
    </table>
    </body>
    </html>
    `;

    try {
        await sendEmail(email, "spotshare3@gmail.com", "Contact Form Submission", messageBody);
        res.status(200).json(new APIResponse(200, null, "Message sent successfully"));
    } catch (error) {
        console.error(error);
        throw new APIError(500, "Failed to send message");
    }
}
);

const getUserReservations = asyncHandler(async (req, res) => {
    const user = await User.findOne({ uid: req.user.uid }).populate('reservationHistory');
    if (!user) {
        throw new APIError(404, 'User not found');
    }

    // Find reservations using the reservationHistory array from the user and populate parkingSpace info
    const reservationParkingInfo = await Reservation.find({ _id: { $in: user.reservationHistory } }).populate('parkingSpace');
    if (!reservationParkingInfo) {
        throw new APIError(404, 'Reservations not found');
    }

    res.status(200).json(new APIResponse(200, reservationParkingInfo, 'Reservations retrieved successfully'));
});


const cronjob = asyncHandler(async (req, res) => {
    res.send("OK");
});

export { 
    registerUser,
    getUserDetails,
    updateAvatar,
    getParkingSpaces,
    isUserAdmin,
    getProfilePhoto,
    receiveContactMessage,
    getUserReservations,
    cronjob
}