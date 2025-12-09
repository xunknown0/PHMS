// config/dotenv.js
const path = require("path");
const dotenv = require("dotenv");

// Load multiple .env files if needed (optional)
const envFiles = [
  path.resolve(__dirname, "../.env.local"),
  path.resolve(__dirname, "../.env")
];

// Load each .env file in order
envFiles.forEach((file) => {
  dotenv.config({
    path: file,
    override: true, // override existing process.env values
    debug: process.env.NODE_ENV !== "production", // optional: show parsing info in dev
  });
});

console.log("Environment variables loaded.");
