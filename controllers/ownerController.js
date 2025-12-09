const Owner = require("../models/ownerModel");
const fs = require("fs");
const path = require("path");

const uploadPath = path.join(__dirname, "..", "public", "uploads");

/* ---------------------------------------------------
   File helper
--------------------------------------------------- */
function deleteFile(filename) {
  if (!filename) return;
  const p = path.join(uploadPath, filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

/* ---------------------------------------------------
   Save Base64 image (camera)
--------------------------------------------------- */
function saveBase64Image(base64String) {
  try {
    const fileName = `camera_${Date.now()}.jpg`;
    const filePath = path.join(uploadPath, fileName);

    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    fs.writeFileSync(filePath, imageBuffer);

    return fileName;
  } catch (err) {
    console.error("Camera save failed:", err);
    return null;
  }
}

/* ---------------------------------------------------
   Pagination
--------------------------------------------------- */
async function paginate(query, page = 1, limit = 6) {
  const total = await Owner.countDocuments(query);
  const owners = await Owner.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  return { owners, total, totalPages: Math.ceil(total / limit) };
}

/* ---------------------------------------------------
   Validation
--------------------------------------------------- */
function validateOwner({ firstName, lastName }) {
  const errors = [];
  if (!firstName) errors.push({ msg: "First name is required" });
  if (!lastName) errors.push({ msg: "Last name is required" });
  return errors;
}

/* ---------------------------------------------------
   Flash helper
--------------------------------------------------- */
function rejectOwner(req, body, message) {
  req.flash("errors", [{ msg: message }]);
  req.flash("oldData", body);
  return req.res.redirect("/owners");
}

/* ===================================================
   helpers
=================================================== */
async function uniqueEmail(email, currentId) {
  if (!email) return false;

  const existing = await Owner.findOne({
    email: new RegExp(`^${email}$`, "i"),
    _id: { $ne: currentId || null },
  });

  return !!existing;
}

/* ===================================================
   CONTROLLER
=================================================== */
module.exports = {
  /* LIST */
  listOwners: async (req, res) => {
    try {
      const page = +req.query.page || 1;
      const limit = +req.query.limit || 6;
      const rawSearch = req.query.search || "";
      const search = rawSearch.trim().replace(/\s+/g, " "); // normalize spaces

const searchRegex = new RegExp(search, "i");

const q = search
  ? {
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { ownerId: searchRegex },

        // FULL NAME search: "Miguel Dela Cruz"
        {
          $expr: {
            $regexMatch: {
              input: {
                $concat: [
                  { $trim: { input: "$firstName" } },
                  " ",
                  { $trim: { input: "$lastName" } }
                ]
              },
              regex: searchRegex,
            }
          }
        }
      ]
    }
  : {};

      const { owners, total, totalPages } = await paginate(q, page, limit);

      res.render("owners/index", {
        owners,
        errorsList: req.flash("errors"),
        oldData: req.flash("oldData")[0] || {},
        successMessage: req.flash("success")[0] || "",
        currentPage: page,
        totalPages,
        totalRecords: total,
        search,
        limit,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error fetching owners list.");
    }
  },

  /* CREATE */
  createOwner: async (req, res) => {
    const errors = validateOwner(req.body);
    if (errors.length) {
      if (req.file) deleteFile(req.file.filename);
      req.flash("errors", errors);
      req.flash("oldData", req.body);
      return res.redirect(keepPage(req, res));

    }

    try {
      const email = req.body.email?.trim();

      if (await uniqueEmail(email)) {
        if (req.file) deleteFile(req.file.filename);
        return rejectOwner(req, req.body, "Email already exists");
      }

   let profileImage = req.body.cameraImage || (req.file && req.file.filename) || null;


      const payload = {
        ...req.body,
        email,
        ownerId: Date.now().toString(36).toUpperCase(),
        profileImage,
      };

      await Owner.create(payload);

      req.flash("success", "Owner added successfully!");
      res.redirect("/owners");
    } catch (err) {
      console.error(err);
      if (req.file) deleteFile(req.file.filename);
      return rejectOwner(req, req.body, "Error creating owner");
    }
  },

  /* UPDATE */
  updateOwner: async (req, res) => {
    try {
      const owner = await Owner.findById(req.params.id);
      if (!owner) {
        if (req.file) deleteFile(req.file.filename);
        return rejectOwner(req, req.body, "Owner not found");
      }

      const errors = validateOwner(req.body);
      if (errors.length) {
        if (req.file) deleteFile(req.file.filename);
        req.flash("errors", errors);
        req.flash("oldData", req.body);
        return res.redirect("/owners");
      }

      const email = req.body.email?.trim();
      if (await uniqueEmail(email, owner._id)) {
        if (req.file) deleteFile(req.file.filename);
        return rejectOwner(req, req.body, "Email already exists");
      }

      let profileImage = owner.profileImage;

      if (req.file) {
        deleteFile(owner.profileImage);
        profileImage = req.file.filename;
      } else if (req.body.cameraImage) {
        // delete old photo
        deleteFile(owner.profileImage);
        profileImage = saveBase64Image(req.body.cameraImage);
      }

      const payload = {
        ...req.body,
        email,
        profileImage,
      };

      await Owner.findByIdAndUpdate(req.params.id, payload);

      req.flash("success", "Owner updated successfully!");
      res.redirect("/owners");
    } catch (err) {
      console.error(err);
      return rejectOwner(req, req.body, "Error updating owner");
    }
  },

  /* DELETE */
  deleteOwner: async (req, res) => {
    try {
      const owner = await Owner.findById(req.params.id);

      if (!owner) return rejectOwner(req, {}, "Owner not found");

      deleteFile(owner.profileImage);
      await Owner.findByIdAndDelete(req.params.id);

      req.flash("success", "Owner deleted successfully!");
      res.redirect("/owners");
    } catch (err) {
      console.error(err);
      return rejectOwner(req, {}, "Error deleting owner");
    }
  },

  /* CAMERA UPLOAD */
  cameraUpload: async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No image uploaded" });
      return res.json({ fileName: req.file.filename });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Upload failed" });
    }
  },
};
