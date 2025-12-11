const express = require("express");
const router = express.Router();
const ownerController = require("../controllers/ownerController");
const upload = require("../middleware/upload");

// list
router.get("/", ownerController.listOwners);

// Create (Handles both Multer file upload AND Base64 camera image in req.body)
router.post("/", upload.single("image"), ownerController.createOwner);

// Update (Handles both Multer file upload AND Base64 camera image in req.body)
router.put("/:id", upload.single("image"), ownerController.updateOwner);

// Delete
router.delete("/:id", ownerController.deleteOwner);

// --- REMOVED THE BREAKING ROUTE BELOW ---
// router.post("/camera-upload", upload.single("image"), ownerController.cameraUpload); 
// ----------------------------------------

module.exports = router;