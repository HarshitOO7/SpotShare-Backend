import { ParkingSpace } from "../models/parkingSpace.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { APIError } from "../utils/APIError.js";
import { APIResponse } from "../utils/APIResponse.js";
import { getCoordinates } from "../utils/geoCoding.js";

const createParkingSpace = asyncHandler(async (req, res) => {
    const { owner, address, typeOfSpot, vehicleSize, spacesToRent, title, description, accessInstructions, spotImages, pricePerHour, pricePerDay, pricePerMonth, availableFrom, daysAvailable } = req.body;

    // Validate required fields
    if (!owner || !address || !typeOfSpot || !vehicleSize || !spacesToRent || !title || !description || !spotImages || !pricePerHour || !pricePerDay || !pricePerMonth || !availableFrom || !daysAvailable) {
        throw new APIError(400, "All fields are required");
    }

    // Validate image array length
    if (spotImages.length > 6) {
        throw new APIError(400, "You can only upload a maximum of 6 images");
    }

    // Get coordinates from address using Google Maps Geocoding API
    const coordinates = await getCoordinates(address);

    // Create new parking space
    const newParkingSpace = new ParkingSpace({
        owner,
        address,
        coordinates,
        typeOfSpot,
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


export { createParkingSpace, getParkingSpaces };
    