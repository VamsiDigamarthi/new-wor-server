import mongoose from "mongoose";
const { Schema } = mongoose;

const MaterialSchema = new Schema(
  {
    Author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const MaterialModel = mongoose.model("Material", MaterialSchema);
export default MaterialModel;
