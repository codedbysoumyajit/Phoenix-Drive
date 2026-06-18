// index.js
import express from "express";
import fileUpload from "express-fileupload";
import session from "express-session";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import log from "./utils/console.js";
import config from "../config/config.js";

// Import Routes
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import compression from "compression";

const app = express();
const server = createServer(app);

server.requestTimeout = 0;
server.headersTimeout = 0;

// --- Configuration and Global Middleware ---
app.use(compression()); // Optimize bandwidth and transfer speeds by Gzipping responses
app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);

// Serve uploads statically if local storage is used (optional, but cdn route is preferred)
// Define __dirname for static file serving and pathing
import path from "path";
import { fileURLToPath } from "url";
import { cdnFile, webshareUploadFile } from "./controllers/fileController.js";
import { authenticate } from "./middleware/authMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Headers Middleware (Performance & clickjacking protection)
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  fileUpload({
    limits: { fileSize: 1024 * 1024 * 1024 },
    abortOnLimit: true,
    responseOnLimit: "Uploaded file is too large.",
    createParentPath: false,
  })
); // Make sure this middleware comes before routes that handle file uploads
app.use(cors());

// Prefer a stable configured secret so sessions survive restarts in the tunnel/container.
const SESSION_SECRET =
  config.settings.sessionSecret || process.env.SESSION_SECRET || "phoenix-drive-dev-session-secret";

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: config.settings.mongoURI,
      dbName: "phoenix-drive",
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60, // 14 days in seconds
    }),
    cookie: {
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
      secure: false, // Set to true in production with HTTPS
      sameSite: "lax",
    },
  })
);

// --- Route Mounting ---
app.use("/api/auth", authRoutes); // Auth related API routes
app.use("/api/files", fileRoutes); // File related API routes
app.get("/cdn/:fileName", cdnFile); // Direct file download route (CDN)
app.post("/webshare", authenticate, webshareUploadFile); // PWA Web share API target

// --- Error Handlers ---
// 404 handler (JSON API format)
app.use((req, res, next) => {
  res.status(404).json({ error: "API endpoint not found." });
});

// --- Server Start ---
server.listen(config.settings.port, () => {
  log(`Phoenix Drive API Server is running on port ${config.settings.port}`, "info");
});