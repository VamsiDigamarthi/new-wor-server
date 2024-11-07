import MessageModel from "../Modals/MessageModal.js";

export const addMessage = async (req, res) => {
  const { user } = req;

  const { chatId, message } = req.body;
  console.log(chatId);
  const newmessage = new MessageModel({
    chatId,
    senderId: user._id,
    message,
  });
  try {
    const result = await newmessage.save();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getMessages = async (req, res) => {
  const { chatId } = req.params;
  try {
    const result = await MessageModel.find({ chatId });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
};
