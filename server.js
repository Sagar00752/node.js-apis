import express from "express";
import mongoose from "mongoose";
import "dotenv/config"; // loads .env automatically
import { createClient } from "redis";
import employeeRoutes from "./routes/employeeRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(express.json());

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected to", process.env.MONGO_URI))
  .catch(err => console.error("❌ MongoDB connection error:", err));

app.get("/", (req, res) => res.send("Hello World!"));

// attach routes
app.use("/api", employeeRoutes);
app.use("/api", authRoutes);

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// Redis client (use env vars for credentials)
const client = createClient({
  username: process.env.REDIS_USERNAME ?? "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
  }
});

client.on("error", err => console.log("Redis Client Error", err));

await client.connect();

await client.set("foo", "bar");
const result = await client.get("foo");
console.log(result); // >>> bar
