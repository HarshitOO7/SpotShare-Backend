import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN, // Fix it later
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit:"16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

(async () => {
    try {
        app.on("ready", () => {
            console.log("Server is ready to accept connections");
        });
    } catch (error) {
        console.log("Failed to connect to MongoDB", error);
    }
})();

// Importing the routes
import userRouter from "./routes/user.routes.js";
import parkingSpaceRouter from "./routes/parkingSpace.routes.js";
import reservationRouter from "./routes/reservation.routes.js";
import paymentRouter from "./routes/payment.routes.js";
import reviewRouter from "./routes/review.routes.js";


// Routes declaration and usage
app.use("/api/v1/users", userRouter);
app.use("/api/v1/parking-space", parkingSpaceRouter);
app.use("/api/v1/reservation", reservationRouter);
app.use("/api/v1/pay", paymentRouter);
app.use("/api/v1/review", reviewRouter);


export { app };
