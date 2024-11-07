import mongoose from "mongoose";
const { Schema } = mongoose;

const BannerOffersSchema = new Schema(
  {
    bannerImage: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subTitle: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const BannerOffersModel = mongoose.model("BannerOffers", BannerOffersSchema);
export default BannerOffersModel;
