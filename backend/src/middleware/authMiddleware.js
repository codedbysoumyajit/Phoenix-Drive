// middleware/authMiddleware.js

/**
 * Authentication middleware. Checks if the user is logged in via session.
 * If not, returns a 401 Unauthorized JSON response.
 */
export function authenticate(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return next();
  }
  // User is not logged in, return JSON unauthorized
  return res.status(401).json({ error: "Unauthorized. Please log in." });
}

/**
 * Middleware to check if the user is already logged in.
 * If logged in, returns a 400 Bad Request JSON response.
 */
export function checkLoggedIn(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return res.status(400).json({ error: "Already logged in." });
  }
  next();
}
