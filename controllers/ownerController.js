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
    // Use async fs.promises.unlink in a production environment for non-blocking I/O
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

        // Use async fs.promises.writeFile in a production environment
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
    Redirect Helper (NEW)
    Builds the redirect URL based on existing query parameters
--------------------------------------------------- */
function keepQueryAndRedirect(req, success = false, message = "") {
    const { page, limit, search } = req.query;
    const query = new URLSearchParams();

    if (page) query.append("page", page);
    if (limit) query.append("limit", limit);
    // Retain search term for visual context even on success/error
    if (search) query.append("search", search);

    if (success) {
        req.flash("success", message);
    } else {
        req.flash("errors", [{ msg: message }]);
        req.flash("oldData", req.body);
    }

    const queryString = query.toString();
    const path = `/owners${queryString ? `?${queryString}` : ''}`;
    return req.res.redirect(path);
}


/* ---------------------------------------------------
    Flash helper (REMOVED: Replaced by keepQueryAndRedirect)
--------------------------------------------------- */
// function rejectOwner(req, body, message) {
//     req.flash("errors", [{ msg: message }]);
//     req.flash("oldData", body);
//     return req.res.redirect("/owners");
// }

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
            // Query parameters -----------------------------------------
            const {
                page: pageQuery,
                limit: limitQuery,
                search: rawSearch = "",
            } = req.query;

            const page = Number(pageQuery) || 1;
            const limit = Number(limitQuery) || 6;

            // Normalized search text ------------------------------------
            const search = rawSearch.trim().replace(/\s+/g, " ");
            const searchRegex = new RegExp(search, "i");

            // Dynamic query --------------------------------------------
            const q = search
                ? {
                    $or: [
                        { firstName: searchRegex },
                        { lastName: searchRegex },
                        { email: searchRegex },
                        { phone: searchRegex },
                        { ownerId: searchRegex },

                        // Full name search "Miguel Dela Cruz"
                        {
                            $expr: {
                                $regexMatch: {
                                    input: {
                                        $concat: [
                                            { $trim: { input: "$firstName" } },
                                            " ",
                                            { $trim: { input: "$lastName" } },
                                        ],
                                    },
                                    regex: searchRegex,
                                },
                            },
                        },
                    ],
                }
                : {};

            // Paging ----------------------------------------------------
            const { owners, total, totalPages } = await paginate(q, page, limit);

            // Render ----------------------------------------------------
            res.render("owners/index", {
                owners,
                currentPage: page,
                totalPages,
                totalRecords: total,
                search,
                limit,
                errorsList: req.flash("errors"),
                oldData: req.flash("oldData")[0] || {},
                successMessage: req.flash("success")[0] || "",
            });
        } catch (err) {
            console.error(err);
            res.status(500).send("Error fetching owners list.");
        }
    },


/* CREATE OWNER */
 createOwner: async (req, res) => {
        const errors = validateOwner(req.body);

        if (errors.length) {
            if (req.file) deleteFile(req.file.filename);
            req.flash("errors", errors);
            req.flash("oldData", req.body);
            return res.redirect("back");
        }

        try {
            const email = req.body.email?.trim();

            if (await uniqueEmail(email)) {
                if (req.file) deleteFile(req.file.filename);
                req.flash("error", "Email already exists");
                return res.redirect("back");
            }

            /* ------------------------------------------------------
                FIXED IMAGE HANDLING
            ------------------------------------------------------ */
            let profileImage = null;

            // CASE 1: Normal file upload
            if (req.file) {
                profileImage = req.file.filename;
            }

            // CASE 2: Base64 camera image
            else if (req.body.cameraImage && req.body.cameraImage.startsWith("data:image")) {

                const base64Data = req.body.cameraImage.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, "base64");

                const filename = `cam_${Date.now()}.png`;
                const filePath = path.join(uploadPath, filename);

                fs.writeFileSync(filePath, buffer);
                profileImage = filename;
            }

            /* ------------------------------------------------------
                SAVE OWNER
            ------------------------------------------------------ */
            const payload = {
                ...req.body,
                email,
                ownerId: Date.now().toString(36).toUpperCase(),
                profileImage,
            };

            await Owner.create(payload);

            req.flash("success", "Owner added successfully!");
            return res.redirect("/owners");

        } catch (err) {
            console.error("Error creating owner:", err);
            if (req.file) deleteFile(req.file.filename);

            req.flash("error", "Error creating owner");
            return res.redirect("back");
        }
    },

    /* UPDATE */
    updateOwner: async (req, res) => {
        try {
            const owner = await Owner.findById(req.params.id);
            if (!owner) {
                if (req.file) deleteFile(req.file.filename);
                return keepQueryAndRedirect(req, false, "Owner not found");
            }

            const errors = validateOwner(req.body);
            
            // 1. Validation Error
            if (errors.length) {
                if (req.file) deleteFile(req.file.filename);
                req.flash("errors", errors);
                req.flash("oldData", req.body);
                return keepQueryAndRedirect(req, false, "Validation failed. Please check the required fields.");
            }

            const email = req.body.email?.trim();

            // 2. Duplicate Email Error
            if (await uniqueEmail(email, owner._id)) {
                if (req.file) deleteFile(req.file.filename);
                return keepQueryAndRedirect(req, false, "Email already exists");
            }

            let profileImage = owner.profileImage;

            if (req.file) {
                // New file upload: delete old file and use new filename
                deleteFile(owner.profileImage);
                profileImage = req.file.filename;
            } else if (req.body.cameraImage && req.body.cameraImage !== 'false') {
                // New camera image: delete old photo and save base64
                deleteFile(owner.profileImage);
                profileImage = saveBase64Image(req.body.cameraImage);
            } else if (req.body.deleteImage === 'true') {
                // Explicitly deleted image: delete file and set field to null
                deleteFile(owner.profileImage);
                profileImage = null;
            }


            const payload = {
                ...req.body,
                email,
                profileImage,
            };

            await Owner.findByIdAndUpdate(req.params.id, payload);

            // 3. Successful Update
            return keepQueryAndRedirect(req, true, "Owner updated successfully!");
        } catch (err) {
            console.error(err);
            // 4. Server Error on Update
            return keepQueryAndRedirect(req, false, "Error updating owner");
        }
    },

    /* DELETE */
    deleteOwner: async (req, res) => {
        try {
            const owner = await Owner.findById(req.params.id);

            // 1. Owner Not Found
            if (!owner) return keepQueryAndRedirect(req, false, "Owner not found");

            deleteFile(owner.profileImage);
            await Owner.findByIdAndDelete(req.params.id);

            // 2. Successful Delete
            // Use the redirect helper to keep the user on the current page/search results
            return keepQueryAndRedirect(req, true, "Owner deleted successfully!");

        } catch (err) {
            console.error(err);
            // 3. Server Error on Delete
            return keepQueryAndRedirect(req, false, "Error deleting owner");
        }
    },

    /* CAMERA UPLOAD */
    cameraUpload: async (req, res) => {
        try {
            // Note: This endpoint should ideally handle the saving of the base64/file, 
            // but for simplicity based on the original code, we'll keep the response structure.
            if (!req.file)
                return res.status(400).json({ error: "No image uploaded" });
            return res.json({ fileName: req.file.filename });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Upload failed" });
        }
    },
};