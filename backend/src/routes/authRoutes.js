// routes/authRoutes.js
import { Router } from "express";
import { rateLimiter } from "../middleware/rateLimiter.js";
import {
  loginUser,
  registerUser,
  logoutUser,
  getSession,
  getConfig,
} from "../controllers/authController.js";

const router = Router();

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,                  // Max 15 attempts
  message: "Too many auth attempts from this IP. Please try again in 15 minutes."
});

router.post("/login", authLimiter, loginUser);
router.post("/register", authLimiter, registerUser);
router.get("/logout", logoutUser);
router.post("/logout", logoutUser);
router.get("/session", getSession);
router.get("/config", getConfig);

export default router;

