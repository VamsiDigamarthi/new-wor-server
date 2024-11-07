import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    authenticationImage: {
      type: String,
    },
    compareImage: {
      type: String, // this field is just store image and send url to client
    },
    role: {
      type: String,
      required: true,
    },
    onDuty: {
      type: Boolean,
      default: false,
    },
    holdingCaptain: {
      type: Boolean,
      default: false, // this is the holding captain some time if true no services available if false service available
    },
    termsAndCondition: { type: Boolean, default: false },
    profilePic: { type: String },
    captainLiveImage: { type: String },
    // licenseImage: { type: String },
    license: { type: String, default: null },
    pan: { type: String, default: null },
    adhar: { type: String, default: null },
    adharBack: { type: String, default: null },
    rc: { type: String, default: null },
    vehicleNumber: { type: String, default: null },
    // verification status
    // aadharCardVerified: { type: Boolean, default: false },
    aadharCardDetails: {
      type: {
        name: { type: String },
        dob: { type: String },
        gender: { type: String },
        fatherName: { type: String },
      },
      default: null,
    },
    // aadharCardDetails: {},
    panAadharCardVerified: { type: Boolean, default: false },

    panCardDetails: {
      type: {
        pan: { type: String },
        name: { type: String },
        firstName: { type: String },
        middleName: { type: String },
        lastName: { type: String },
        gender: { type: String },
        dob: { type: Date },
        // status: { type: String, default: "pending" }, // Default status can be adjusted as needed
      },
      default: null,
    },

    rcCardVerified: { type: Boolean, default: false },
    rcCardDetails: {
      type: {
        rc_body_type_desc: { type: String },
        rc_eng_no: {
          type: String,
        },
        rc_maker_desc: {
          type: String,
        },
        rc_maker_model: {
          type: String,
        },
        rc_manu_month_yr: {
          type: String,
        },
        rc_mobile_no: {
          type: String,
        },
        rc_owner_name: {
          type: String,
        },
        rc_owner_sr: {
          type: String,
        },
        rc_permanent_address: {
          type: String,
        },
        rc_present_address: {
          type: String,
        },
        rc_registered_at: {
          type: String,
        },
        rc_regn_no: {
          type: String,
        },
      },
      default: null,
    },
    licenseCardVerified: { type: Boolean, default: false },
    licenseCardDetails: {
      type: {
        issueDate: { type: String },
        fatherOrHusband: { type: String }, // renamed to avoid `/` character
        name: { type: String },
        bloodGroup: { type: String },
        dob: { type: String },
        dlNumber: { type: String },
        validity: {
          nonTransport: { type: String },
          transport: { type: String },
        },
        status: { type: String },
      },
      default: null,
    },
    allVerificationStatus: { type: Boolean, default: false },
    // captain location tracking to display the map
    captainLocation: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    // 24-09-24
    dateOfBirth: { type: String },
    email: { type: String },
    signUpDateAndTime: { type: Date, default: Date.now() },
    uniqueKey: { type: String },
    address: { type: String },
    fbtoken: { type: String },
    time: { type: String },
    personalContact: {
      type: String,
      default: null,
    },
    userVerified: { type: Boolean, default: false }, // this is the final verification key if true user verified if false user nor verified
    reviewToVerified: { type: Boolean, default: false },
    storeUnVerifiedDetails: { type: String },
    password: { type: String },
    signUpCompletePercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ captainLocation: "2dsphere" });

const UserModel = mongoose.model("User", userSchema);
export default UserModel;
