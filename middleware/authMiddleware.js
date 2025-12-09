// middleware/authMiddleware.js

function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  req.flash("error", "Please login first");
  return res.redirect("/login");
}

module.exports = { requireLogin };
