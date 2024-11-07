import mongoose from "mongoose";
const { Schema } = mongoose;

const ChatSchema = new Schema(
  {
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // Reference to the 'User' model, adjust as per your actual user model name
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ChatModel = mongoose.model("Chats", ChatSchema);
export default ChatModel;
