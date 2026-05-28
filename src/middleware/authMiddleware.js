// middleware/authMiddleware.js

/**
 * Authentication middleware. Checks if the user is logged in via session.
 * If not, redirects to the login page.
 */
export function authenticate(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return next();
  }
  // User is not logged in, redirect to the login page
  res.redirect("/login");
}

/**
 * Middleware to check if the user is already logged in.
 * If logged in, redirects to the upload page.
 */
export function checkLoggedIn(req, res, next) {
  if (req.session && req.session.loggedIn) {
    return res.redirect("/upload");
  }
  next();
}
