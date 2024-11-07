import mongoose from "mongoose";
const { Schema } = mongoose;

const CitiesSchema = new Schema(
  {
    cities: [],
  },
  {
    timestamps: true,
  }
);

const CitiesModel = mongoose.model("Cities", CitiesSchema);
export default CitiesModel;
