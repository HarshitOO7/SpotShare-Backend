import { ParkingSpace } from "../models/parkingSpace.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { getCoordinates } from "../utils/geoCoding.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Function to transform customTimes object
const transformCustomTimes = (customTimes) => {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const availability = [];

    daysOfWeek.forEach((day) => {
        if (customTimes[day.toLowerCase()]) {
            availability.push({
                day,
                fromTime: customTimes[day.toLowerCase()].in,
                toTime: customTimes[day.toLowerCase()].out
            });
        }
    });

    return availability;
};

const createParkingSpace = asyncHandler(async (req, res) => {
    const { owner, address, spotType, vehicleSize, spacesToRent, title, description, accessInstructions, spotImages, pricePerHour, pricePerDay, pricePerMonth, availableFrom, customTimes } = req.body;

    // Validate required fields
    if (!owner || !address || !spotType || !vehicleSize || !spacesToRent || !title || !description || !spotImages || !pricePerHour || !pricePerDay || !pricePerMonth || !availableFrom || !customTimes) {
        throw new APIError(400, "All fields are required");
    }

    // Validate image array length
    if (spotImages.length > 6) {
        throw new APIError(400, "You can only upload a maximum of 6 images");
    }

    // Get coordinates from address using Google Maps Geocoding API
    const coordinates = await getCoordinates(address);

    // Transform customTimes to daysAvailable
    const daysAvailable = transformCustomTimes(JSON.parse(customTimes));

    // Create new parking space
    const newParkingSpace = new ParkingSpace({
        owner,
        address,
        coordinates,
        spotType,
        vehicleSize,
        spacesToRent,
        title,
        description,
        accessInstructions,
        spotImages,
        pricePerHour,
        pricePerDay,
        pricePerMonth,
        availableFrom,
        daysAvailable
    });

    // Save parking space to the database
    await newParkingSpace.save();

    return res.status(201).json(
        new APIResponse(201, newParkingSpace, "Parking space created successfully")
    );
});

const getParkingSpaces = asyncHandler(async (req, res) => {
    const parkingSpaces = await ParkingSpace.find();

    return res.status(200).json(
        new APIResponse(200, parkingSpaces, "Parking spaces retrieved successfully")
    );
});

const uploadSpotImages = asyncHandler(async (req, res) => {
    const spotImages = [];
    console.log(req.files)
    for (let file of req.files) {
        const result = await uploadOnCloudinary(file.path);
        spotImages.push(result.secure_url);
    }

    return res.status(200).json(
        new APIResponse(200, spotImages, "Images uploaded successfully")
    );
});

export { createParkingSpace, getParkingSpaces, uploadSpotImages };
