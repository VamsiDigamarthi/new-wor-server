import UserModel from "../Modals/UserModal.js";

export const CheckingUser = async (req, res, next) => {
  const { mobile } = req;
  try {
    const existingUser = await UserModel.findOne({ mobile });
    // console.log(mobile);
    // console.log(existingUser);
    if (!existingUser) {
      return res.status(404).json({ message: "This User No More Available" });
    }

    req.user = existingUser; // Storing the found user in req.user for further use if needed
    next(); // Call next() to proceed to the next middleware/controller
  } catch (error) {
    console.error("Error finding user:", error);
    return res
      .status(500)
      .json({ message: "Finding User from Db Failed...!", error });
  }
};
