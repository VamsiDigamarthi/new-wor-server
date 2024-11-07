import contactModal from "../Modals/ContactModal.js";

export const onContact = async (req, res) => {
  const { name, email, subject, message, mobile } = req.body;
  try {
    const docs = {
      name,
      email,
      subject,
      message,
      mobile,
    };

    const contact = new contactModal(docs);
    await contact.save();
    return res.status(201).json({ message: "Thank You for your message..!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Contact failed..!",
      error: error.message,
    });
  }
};
