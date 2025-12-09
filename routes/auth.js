const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const catchAsync = require("../utils/catchAsync");

// ===== LOGIN ROUTES =====
router.get("/login", authController.getLogin);
router.post("/login", catchAsync(authController.postLogin));

// ===== REGISTER ROUTES =====
router.get("/register", authController.getRegister);
router.post("/register", catchAsync(authController.postRegister));

// ===== LOGOUT =====
router.get("/logout", catchAsync(authController.logout));

module.exports = router;
