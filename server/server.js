import "dotenv/config";
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";

import roomRoutes from "./routes/roomRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import classroomRoutes from "./routes/classroomRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { generalLimiter } from "./middleware/rateLimiters.js";
import { registerSocketHandlers } from "./sockets/index.js";

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/codeclass";

const app = express();
const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: { origin: CLIENT_URL, credentials: true },
});

// Make io reachable from REST controllers (e.g. joinRoom emits student:joined)
// without introducing a circular import.
app.set("io", io);

// Render (and most PaaS hosts) put the app behind a reverse proxy, which
// adds an X-Forwarded-For header. Without trusting the proxy, express-
// rate-limit refuses every request in production (and req.ip would be the
// proxy's IP for everyone, breaking IP-based rate limiting anyway).
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(mongoSanitize());
if (process.env.NODE_ENV !== "test") app.use(morgan("dev"));
app.use(generalLimiter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api", roomRoutes);
app.use("/api/test", testRoutes);
app.use("/api/classroom", classroomRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

registerSocketHandlers(io);

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");
    httpServer.listen(PORT, () => {
      console.log(`CodeClass server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

// Graceful shutdown
process.on("SIGTERM", async () => {
  await mongoose.disconnect();
  httpServer.close(() => process.exit(0));
});
