import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env"
});

// DO-2: Fail fast on startup if required env vars are missing
const REQUIRED_ENV = [
    'MONGODB_URI',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'CLIENT_URL',
];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
    console.error(`[Startup] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
}

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((error) => {
    console.log("Failed to connect to MongoDB", error);
});

