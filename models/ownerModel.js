const mongoose = require("mongoose");

const OwnerSchema = new mongoose.Schema(
  {
    /* -------------------------------------------------
       Identifiers
    ------------------------------------------------- */
    ownerId: {
      type: String,
      unique: true,
    },
    qrCode: {
      type: String,
    },

    /* -------------------------------------------------
       Basic Information
    ------------------------------------------------- */
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Prefer not to say"],
      default: "Prefer not to say",
    },
    birthdate: {
      type: Date,
      default: null,
    },
    civilStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed", "Other"],
      default: "Single",
    },

    /* -------------------------------------------------
       Contact
    ------------------------------------------------- */
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
    },
    phone2: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },

    /* -------------------------------------------------
       Emergency contact
    ------------------------------------------------- */
    emergencyContactPerson: {
      type: String,
      default: "",
    },
    emergencyContactNumber: {
      type: String,
      default: "",
    },

   
    /* -------------------------------------------------
       System
    ------------------------------------------------- */
  
    profileImage: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Owner", OwnerSchema);
