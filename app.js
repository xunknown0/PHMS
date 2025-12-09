const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const engine = require("ejs-mate");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const methodOverride = require("method-override");
const rootPath = path.join(__dirname, "..");

// ===== Services =====
const socketService = require("./services/socketService");

// ===== Routers =====
const authRouter = require("./routes/auth");
const indexRouter = require("./routes/index");
const ownerRoutes = require("./routes/owner");

// ===== Middleware =====
const { requireLogin } = require("./middleware/authMiddleware");

// ===== Database Connection =====
const connectDB = require("./config/db");
connectDB();

// ===== Express App Setup =====
const app = express();
const server = http.createServer(app);

// ===== Socket.IO Setup =====
const io = new Server(server);
socketService.initialize(io);
app.set("io", io);
app.set("userSockets", socketService.userSockets);

// ===== View Engine Setup =====
app.engine("ejs", engine);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// ===== Logging =====
if (process.env.NODE_ENV === "development") {
  app.use(logger("dev"));
}

// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(rootPath, "public", "uploads")));
app.use("/images", express.static(path.join(rootPath, "public", "images")));
app.use(express.static(path.join(rootPath, "public")));
// Enable method override
app.use(methodOverride("_method"));

// ===== Trust Proxy =====
if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);

// ===== Session Configuration =====
const sessionStore = MongoStore.create({
  mongoUrl: process.env.MONGO_URI,
  ttl: 14 * 24 * 60 * 60, // 14 days
});

app.use(
  session({
    name: process.env.SESSION_NAME || "phms.sid",
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// ===== Flash Messages =====
app.use(flash());

// ===== Global Template Locals =====
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash("success") || [];
  res.locals.error_msg = req.flash("error") || [];
  next();
});

// ===== Routes =====
app.get("/", (req, res) => res.redirect("/login"));
app.use("/", authRouter);
app.use("/dashboard", requireLogin, indexRouter);
app.use("/owners", requireLogin, ownerRoutes);

// ===== 404 =====
app.use((req, res) => {
  res.status(404).render("error", {
    title: "404 - Not Found",
    status: 404,
    message: "The page you are looking for does not exist.",
    error: null,
  });
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  console.error(err);

  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message;

  res.status(status).render("error", {
    title: `${status} - Error`,
    status,
    message,
    error: process.env.NODE_ENV === "production" ? null : err,
  });
});

module.exports = { app, server };
