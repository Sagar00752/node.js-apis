const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config(); 


const app = express();

// middleware
app.use(express.json());

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected to", process.env.MONGO_URI))
  .catch(err => console.error("❌ MongoDB connection error:", err));

  app.get("/", (req, res) => {
  res.send("Hello World!");
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

//user routes
const employeeRoutes = require("./routes/employeeRoutes");
app.use("/api", employeeRoutes);

//login routes
const authRoutes = require("./routes/authRoutes");
app.use("/api", authRoutes);

//logout routes
const logoutRoutes = require("./routes/authRoutes");
app.use("/api", logoutRoutes);

//register routes
const registerRoutes = require("./routes/authRoutes");
app.use("/api", registerRoutes);
