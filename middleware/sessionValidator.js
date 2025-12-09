// middleware/sessionValidator.js

/**
 * Middleware to ensure user is logged in
 */
function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash("error", "You must be logged in to access this page.");
  return res.redirect("/login");
}

/**
 * Middleware to prevent logged-in users from visiting login/register pages
 */
function preventAuthAccess(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect("/dashboard");
  }
  return next();
}

module.exports = {
  requireLogin,
  preventAuthAccess,
};
