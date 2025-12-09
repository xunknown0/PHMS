const express = require("express");
const router = express.Router();
const ownerController = require("../controllers/ownerController");
const upload = require("../middleware/upload");

// list
router.get("/", ownerController.listOwners);
router.post("/", upload.single("image"), ownerController.createOwner);
router.put("/:id", upload.single("image"), ownerController.updateOwner);

router.delete("/:id", ownerController.deleteOwner);
router.post("/camera-upload", upload.single("image"), ownerController.cameraUpload);

module.exports = router;
