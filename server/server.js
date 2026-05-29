// server.js
import "./src/config/env.js";
import express from "express";
import cors from "cors";
import multer from "multer";
import authRoutes from "./src/routes/authRoutes.js";
import jobRoutes from "./src/routes/jobRoutes.js";
import offerRoutes from "./src/routes/offerRoutes.js";
import applicationRoutes from "./src/routes/applicationRoutes.js";
import connectDB from "./src/config/mongodb.js";

const app = express();
const upload = multer();

connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(upload.none());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", jobRoutes);
app.use("/api", offerRoutes);
app.use("/api", applicationRoutes); 


app.use((err, req, res, next) => {
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Stack:', err.stack);

  if (err.code === 'LIMIT_FILE_SIZE' || err.message === 'File too large') {
    return res.status(400).json({ message: "File too large. Maximum size is 5MB" });
  }

  res.status(500).json({ message: err.message || "Internal server error" });
});

// Handle 404 routes
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: `Route not found: ${req.method} ${req.url}` });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MongoDB status: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}`);
  console.log(`Cloudinary status: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not configured'}`);
});