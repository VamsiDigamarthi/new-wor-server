import mongoose from "mongoose";
const { Schema } = mongoose;

const OrderSchema = new Schema(
  {
    price: {
      type: Number,
      required: true,
    },
    vehicleType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "pending",
    },
    cancelReasong: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reason: {
        type: String,
      },
    },
    orderPlaceDate: {
      type: String,
      required: true,
    },
    orderPlaceTime: {
      type: String,
      required: true,
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    pickup: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    pickupAddress: { type: String, required: true },
    drop: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    dropAddress: { type: String, required: true },
    acceptCaptain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    favorite: {
      type: Boolean,
      default: false,
    },
    saved: {
      type: Boolean,
      default: false,
    },
    rejectedCaptaine: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reviewRating: {
      type: Number,
    },
    reviewTest: {
      type: String,
      default: "",
    },
    parcelType: {
      type: String,
    },
    deliveryInstruction: {
      type: String,
    },
    userAuthenticationImage: {
      type: String,
    },
    ratingByCaptain: { type: Number },
    distance: { type: String },
    rideTime: { type: String },
    giveVehicleNumber: { type: Boolean, default: true },
    onNaviagtionChange: {
      type: Boolean,
      default: false,
    },
    time: { type: String },
    // this is used only user (user added how many mans added)
    howManyMans: {
      type: Number,
      default: 0,
    },
    // this is change captain
    mensProblem: {
      type: Boolean,
      default: false,
    },
    orderOtp: { type: Number },
  }
  // { timestamps: true }
);

OrderSchema.index({ pickup: "2dsphere" });
OrderSchema.index({ drop: "2dsphere" });
// OrderSchema.index({ pickup: "2dsphere", drop: "2dsphere" });

const OrderModel = mongoose.model("Order", OrderSchema);

export default OrderModel;
