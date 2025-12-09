const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const { userSockets } = require("../services/socketService"); // import userSockets map

const MAX_ATTEMPTS = 3;
const LOCK_TIME = 5 * 60 * 1000; // 5 minutes

const authController = {
  /** -------------------- LOGIN VIEW -------------------- **/
  getLogin: (req, res) => {
    res.render("auth/login", { title: "Login - PHMS" });
  },

  /** -------------------- LOGIN HANDLER -------------------- **/
  postLogin: catchAsync(async (req, res) => {
    const username = req.body.username?.trim();
    const password = String(req.body.password)?.trim();
    const io = req.app.get("io");

    if (!username || !password) return flashAndRedirect(req, res, "Please provide both username and password.");

    const user = await User.findOne({ username });
    if (!user) return loginFail(req, res);

    await resetLockIfExpired(user);

    if (isAccountLocked(user)) {
      return flashAndRedirect(req, res, accountLockedMessage(user));
    }

    const passwordMatch = await user.matchPassword(password);
    if (!passwordMatch) {
      await handleWrongPassword(user, req);
      return res.redirect("/login");
    }

    // Enforce single session before creating new session
    await enforceSingleSession(req, io, user);

    // Create new session
    createSession(req, user);

    user.currentSession = req.sessionID;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    req.flash("success", `Welcome back, ${user.username}!`);
    return res.redirect("/dashboard");
  }),

  /** -------------------- REGISTER VIEW -------------------- **/
  getRegister: (req, res) => {
    res.render("auth/register", {
      title: "Register - PHMS",
      username: "",
      error_msg: req.flash("error") || [],
      success_msg: req.flash("success") || [],
    });
  },

  /** -------------------- REGISTER HANDLER -------------------- **/
  postRegister: catchAsync(async (req, res) => {
    const username = req.body.username?.trim();
    const password = String(req.body.password)?.trim();
    const confirmPassword = String(req.body.confirmPassword)?.trim();

    const errors = validateRegistration(username, password, confirmPassword);
    if (errors.length) return renderRegister(res, username, errors);

    const existingUser = await User.findOne({ username });
    if (existingUser) return renderRegister(res, username, ["Username already taken."]);

    await new User({ username, password, role: "staff" }).save();
    req.flash("success", "Registration successful! You can log in now.");
    return res.redirect("/login");
  }),

  /** -------------------- LOGOUT -------------------- **/
  logout: catchAsync(async (req, res) => {
    const username = req.session.user?.username || "User";
    const sessionCollection = req.app.get("sessionCollection");

    if (req.sessionID && sessionCollection) {
      await sessionCollection.deleteOne({ _id: req.sessionID }).catch(console.error);
    }

    if (req.session.user?.id) {
      await User.findByIdAndUpdate(req.session.user.id, { currentSession: null });
    }

    req.flash("success", `Goodbye, ${username}!`);
    req.session.destroy(err => {
      if (err) console.error("Session destroy error:", err);
      res.clearCookie("connect.sid");
      return res.redirect("/login");
    });
  }),
};

/* ===== Helper Functions ===== */

async function handleWrongPassword(user, req) {
  user.loginAttempts = (user.loginAttempts || 0) + 1;

  if (user.loginAttempts >= MAX_ATTEMPTS) {
    user.lockUntil = Date.now() + LOCK_TIME;
    req.flash("error", `Account locked for ${LOCK_TIME / 60000} min.`);
  } else {
    const remaining = MAX_ATTEMPTS - user.loginAttempts;
    req.flash("error", `Invalid login (${remaining} attempt${remaining === 1 ? "" : "s"} left).`);
  }

  await user.save();
}

function loginFail(req, res) {
  return flashAndRedirect(req, res, "Invalid username or password.");
}

function createSession(req, user) {
  req.session.user = { id: user._id, username: user.username, role: user.role };
}

function validateRegistration(username, password, confirmPassword) {
  const errors = [];
  if (!username || !password || !confirmPassword) errors.push("All fields are required.");
  if (password.length < 6) errors.push("Password must be at least 6 characters.");
  if (password !== confirmPassword) errors.push("Passwords do not match.");
  return errors;
}

function renderRegister(res, username, errors) {
  return res.render("auth/register", { title: "Register - PHMS", username, error_msg: errors });
}

/** Enforce single-session per user */
async function enforceSingleSession(req, io, user) {
  if (!user.currentSession) return;

  const sessionCollection = req.app.get("sessionCollection");
  if (!sessionCollection) return;

  // Remove old session
  await sessionCollection.deleteOne({ _id: user.currentSession }).catch(console.error);

  // Notify old socket and remove from userSockets map
  const oldSocketId = userSockets.get(user._id.toString());
  if (oldSocketId && io.sockets.sockets.get(oldSocketId)) {
    io.to(oldSocketId).emit("forceLogout", { message: "Logged in from another device." });
    userSockets.delete(user._id.toString());
  }
}

/* ----- Lock helpers ----- */
async function resetLockIfExpired(user) {
  if (user.lockUntil && user.lockUntil <= Date.now()) {
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();
  }
}

function isAccountLocked(user) {
  return user.lockUntil && user.lockUntil > Date.now();
}

function accountLockedMessage(user) {
  const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
  return `Account locked: ${mins} minute${mins === 1 ? "" : "s"}.`;
}

function flashAndRedirect(req, res, message) {
  req.flash("error", message);
  return res.redirect("/login");
}

module.exports = authController;
