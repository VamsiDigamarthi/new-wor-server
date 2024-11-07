import mongoose from "mongoose";
const { Schema } = mongoose;

const FeedbackSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    head: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const FeedbackModel = mongoose.model("Feedback", FeedbackSchema);
export default FeedbackModel;
