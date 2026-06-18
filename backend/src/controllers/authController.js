// controllers/authController.js
import bcrypt from "bcryptjs";
import config from "../../config/config.js";
import getDB from "../utils/mongodb.js";
import log from "../utils/console.js";

/**
 * Returns current session info.
 */
export const getSession = (req, res) => {
  if (req.session && req.session.loggedIn) {
    return res.status(200).json({ loggedIn: true, username: req.session.user });
  }
  return res.status(200).json({ loggedIn: false });
};

/**
 * Returns system configuration needed by frontend.
 */
export const getConfig = (req, res) => {
  const secretRequired = !!config.settings.registrationSecret;
  return res.status(200).json({ secretRequired, encryptionEnabled: config.settings.encryption });
};

/**
 * Handles user registration.
 */
export const registerUser = async (req, res) => {
  try {
    const { username, password, confirmPassword, registrationSecret } = req.body;
    const db = await getDB();
    const usersCollection = db.collection("users");

    // 1. Check registration secret if configured
    if (config.settings.registrationSecret) {
      if (registrationSecret !== config.settings.registrationSecret) {
        return res.status(400).json({ error: "Invalid registration secret code." });
      }
    }

    // 2. Validation
    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const trimmedUsername = username.trim().toLowerCase();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return res.status(400).json({ error: "Username must be between 3 and 20 characters." });
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      return res.status(400).json({ error: "Username can only contain letters, numbers, underscores, and hyphens." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    // 3. Check duplicate user
    const existingUser = await usersCollection.findOne({ username: trimmedUsername });
    if (existingUser) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    // 4. Hash password & Insert User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      username: trimmedUsername,
      password: hashedPassword,
      createdAt: new Date(),
    };

    await usersCollection.insertOne(newUser);
    log(`User registered successfully: ${trimmedUsername}`, "info");

    // 5. Establish session automatically on signup (Regenerate to prevent fixation)
    req.session.regenerate((err) => {
      if (err) {
        log(`Session regeneration error during registration: ${err.message}`, "error");
        return res.status(500).json({ error: "Server error during registration login." });
      }
      req.session.user = trimmedUsername;
      req.session.loggedIn = true;
      return res.status(201).json({ success: true, username: trimmedUsername, redirectUrl: "/dashboard" });
    });

  } catch (err) {
    log(`Registration error: ${err.message}`, "error");
    return res.status(500).json({ error: "Internal server error during registration." });
  }
};

/**
 * Handles user login.
 */
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const trimmedUsername = username.trim().toLowerCase();
    const db = await getDB();
    const usersCollection = db.collection("users");

    // Find User
    const user = await usersCollection.findOne({ username: trimmedUsername });
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password." });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid username or password." });
    }

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        log(`Session regeneration error during login: ${err.message}`, "error");
        return res.status(500).json({ error: "Server login error occurred." });
      }
      req.session.user = trimmedUsername;
      req.session.loggedIn = true;
      log(`User logged in: ${trimmedUsername}`, "info");
      return res.status(200).json({ success: true, username: trimmedUsername, redirectUrl: "/dashboard" });
    });

  } catch (err) {
    log(`Login error: ${err.message}`, "error");
    return res.status(500).json({ error: "Internal server error." });
  }
};

/**
 * Handles user logout.
 */
export const logoutUser = (req, res) => {
  const username = req.session.user;
  req.session.destroy((err) => {
    if (err) {
      log(`Error destroying session during logout: ${err.message}`, "error");
      return res.status(500).json({ error: "Could not log out." });
    }
    res.clearCookie("connect.sid");
    if (username) {
      log(`User logged out: ${username}`, "info");
    }
    return res.status(200).json({ success: true, message: "Logged out successfully." });
  });
};

