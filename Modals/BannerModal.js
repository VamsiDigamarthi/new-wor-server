import mongoose from "mongoose";
const { Schema } = mongoose;

const BannersSchema = new Schema(
  {
    bannerImage: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const BannersModel = mongoose.model("Banners", BannersSchema);
export default BannersModel;
