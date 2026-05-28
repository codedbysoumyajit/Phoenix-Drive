// routes/authRoutes.js
import { Router } from "express";
import { checkLoggedIn } from "../middleware/authMiddleware.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import {
  renderLoginPage,
  loginUser,
  renderRegisterPage,
  registerUser,
  logoutUser,
} from "../controllers/authController.js";

const router = Router();

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,                  // Max 15 attempts
  message: "Too many auth attempts from this IP. Please try again in 15 minutes."
});

router.get("/", checkLoggedIn, renderLoginPage);
router.get("/login", checkLoggedIn, renderLoginPage);
router.post("/login", authLimiter, loginUser);

router.get("/register", checkLoggedIn, renderRegisterPage);
router.post("/register", authLimiter, registerUser);
router.get("/logout", logoutUser);

export default router;
